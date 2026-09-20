const Product = require("../models/productModel");
const Category = require("../models/categoryModel");
const Supplier = require("../models/supplierModel");
const Order = require("../models/orderModel");
const { HttpStatus } = require("../config/constants");

const isV1Request = (req) => req.baseUrl.startsWith("/api/v1/");

const sendV1Response = (res, status, message, data = null, count) =>
  res.status(status).json({
    success: status < HttpStatus.BAD_REQUEST,
    message,
    count: count ?? (Array.isArray(data) ? data.length : data ? 1 : 0),
    data,
  });

const exactNamePattern = (value) =>
  new RegExp(`^${String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");

const populateProduct = (query, includeSupplier = false) => {
  query.populate("categoryId", "categoryName");
  return includeSupplier ? query.populate("supplierId", "supplierName") : query;
};

const withSalesCounts = async (products) => {
  const ids = products.map((product) => product._id);
  if (!ids.length) return products;
  const counts = await Order.aggregate([
    { $match: { orderStatus: "Completed", "orderItems.productId": { $in: ids } } },
    { $unwind: "$orderItems" },
    { $match: { "orderItems.productId": { $in: ids } } },
    { $group: { _id: "$orderItems.productId", soldQuantity: { $sum: "$orderItems.quantity" } } },
  ]);
  const countByProduct = new Map(counts.map((item) => [String(item._id), item.soldQuantity]));
  return products.map((product) => ({
    ...product.toObject(),
    soldQuantity: countByProduct.get(String(product._id)) || 0,
  }));
};

const getProducts = async (req, res, includeInactive = false) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 100);
    const skip = (page - 1) * limit;
    const filter = includeInactive || req.query.includeInactive === "true"
      ? {}
      : { $or: [{ isActive: true }, { isActive: { $exists: false } }] };
    const versionOne = isV1Request(req);

    if (req.query.category) {
      const category = await Category.findOne({
        categoryName: exactNamePattern(req.query.category),
      });
      filter.categoryId = category ? category._id : null;
    }

    if (versionOne && req.query.supplier) {
      const supplier = await Supplier.findOne({
        supplierName: exactNamePattern(req.query.supplier),
      });
      filter.supplierId = supplier ? supplier._id : null;
    }

    if (versionOne && req.query.search)
      filter.$text = { $search: req.query.search };

    const total = versionOne ? await Product.countDocuments(filter) : 0;
    const products = populateProduct(Product.find(filter), versionOne);

    if (req.query.sort === "price") products.sort({ productPrice: 1 });

    const data = await withSalesCounts(await products.skip(skip).limit(limit));
    if (versionOne)
      return sendV1Response(
        res,
        HttpStatus.OK,
        "Products retrieved successfully.",
        data,
        total,
      );
    res.json(data);
  } catch (error) {
    if (isV1Request(req))
      return sendV1Response(
        res,
        HttpStatus.INTERNAL_SERVER_ERROR,
        error.message,
      );
    res
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .json({ message: error.message });
  }
};
const getAdminProducts = (req, res) => {
  return getProducts(req, res, true);
};
const getSupplierProducts = async (req, res) => {
  try {
    if (!req.user.supplierId)
      return res.status(HttpStatus.FORBIDDEN).json({ message: "Your account is not linked to a supplier record." });
    res.json(
      await populateProduct(
        Product.find({ supplierId: req.user.supplierId }).sort({ createdAt: -1 }),
        true,
      ),
    );
  } catch (error) {
    res.status(HttpStatus.BAD_REQUEST).json({ message: error.message });
  }
};
const getProduct = async (req, res) => {
  try {
    const versionOne = isV1Request(req);
    const product = await populateProduct(
      Product.findOne({
        _id: req.params.id,
        $or: [{ isActive: true }, { isActive: { $exists: false } }],
      }),
      versionOne,
    );
    if (!product) {
      if (versionOne)
        return sendV1Response(res, HttpStatus.NOT_FOUND, "Product not found.");
      return res
        .status(HttpStatus.NOT_FOUND)
        .json({ message: "Product not found." });
    }
    const productDocument = await product;
    const data = productDocument.toObject();
    const [withSales] = await withSalesCounts([productDocument]);
    if (versionOne)
      return sendV1Response(
        res,
        HttpStatus.OK,
        "Product retrieved successfully.",
        { ...data, soldQuantity: withSales.soldQuantity },
      );
    res.json({ ...data, soldQuantity: withSales.soldQuantity });
  } catch (error) {
    if (isV1Request(req))
      return sendV1Response(res, HttpStatus.BAD_REQUEST, error.message);
    res.status(HttpStatus.BAD_REQUEST).json({ message: error.message });
  }
};
const createProduct = async (req, res) => {
  try {
    const productData = { ...req.body };
    if (req.user?.userRole === "supplier") {
      if (!req.user.supplierId)
        return res.status(HttpStatus.FORBIDDEN).json({ message: "Your account is not linked to a supplier record." });
      productData.supplierId = req.user.supplierId;
    }
    const product = await Product.create(productData);
    if (isV1Request(req)) {
      const data = await populateProduct(Product.findById(product._id), true);
      return sendV1Response(
        res,
        HttpStatus.CREATED,
        "Product created successfully.",
        data,
      );
    }
    res.status(HttpStatus.CREATED).json(product);
  } catch (error) {
    if (isV1Request(req))
      return sendV1Response(res, HttpStatus.BAD_REQUEST, error.message);
    res.status(HttpStatus.BAD_REQUEST).json({ message: error.message });
  }
};
const updateProduct = async (req, res) => {
  try {
    const versionOne = isV1Request(req);
    if (req.user.userRole === "supplier" && !req.user.supplierId)
      return versionOne
        ? sendV1Response(res, HttpStatus.FORBIDDEN, "Your account is not linked to a supplier record.")
        : res.status(HttpStatus.FORBIDDEN).json({ message: "Your account is not linked to a supplier record." });
    const filter = req.user.userRole === "supplier"
      ? { _id: req.params.id, supplierId: req.user.supplierId }
      : { _id: req.params.id };
    const updates = { ...req.body };
    if (req.user.userRole === "supplier") delete updates.supplierId;
    const product = await Product.findOneAndUpdate(filter, updates, {
      new: true,
      runValidators: true,
    });
    if (!product) {
      if (versionOne)
        return sendV1Response(res, HttpStatus.NOT_FOUND, "Product not found.");
      return res
        .status(HttpStatus.NOT_FOUND)
        .json({ message: "Product not found." });
    }
    if (versionOne) {
      const data = await populateProduct(Product.findById(product._id), true);
      return sendV1Response(
        res,
        HttpStatus.OK,
        "Product updated successfully.",
        data,
      );
    }
    res.json(product);
  } catch (error) {
    if (isV1Request(req))
      return sendV1Response(res, HttpStatus.BAD_REQUEST, error.message);
    res.status(HttpStatus.BAD_REQUEST).json({ message: error.message });
  }
};
const deleteProduct = async (req, res) => {
  try {
    const versionOne = isV1Request(req);
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      if (versionOne)
        return sendV1Response(res, HttpStatus.NOT_FOUND, "Product not found.");
      return res
        .status(HttpStatus.NOT_FOUND)
        .json({ message: "Product not found." });
    }
    if (versionOne)
      return sendV1Response(
        res,
        HttpStatus.OK,
        "Product deleted successfully.",
        product,
      );
    res.json({ message: "Product deleted." });
  } catch (error) {
    if (isV1Request(req))
      return sendV1Response(res, HttpStatus.BAD_REQUEST, error.message);
    res.status(HttpStatus.BAD_REQUEST).json({ message: error.message });
  }
};
module.exports = {
  getProducts,
  getAdminProducts,
  getSupplierProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
};
