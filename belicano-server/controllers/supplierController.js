const Supplier = require("../models/supplierModel");
const Product = require("../models/productModel");
const Order = require("../models/orderModel");
const Review = require("../models/reviewModel");
const { HttpStatus } = require("../config/constants");

const getSuppliers = async (_req, res) => {
  try {
    res.json(await Supplier.find());
  } catch (error) {
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: error.message });
  }
};

const getSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier)
      return res.status(HttpStatus.NOT_FOUND).json({ message: "Supplier not found." });
    res.json(supplier);
  } catch (error) {
    res.status(HttpStatus.BAD_REQUEST).json({ message: error.message });
  }
};

const createSupplier = async (req, res) => {
  try {
    res.status(HttpStatus.CREATED).json(await Supplier.create(req.body));
  } catch (error) {
    res.status(HttpStatus.BAD_REQUEST).json({ message: error.message });
  }
};

const updateSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!supplier)
      return res.status(HttpStatus.NOT_FOUND).json({ message: "Supplier not found." });
    res.json(supplier);
  } catch (error) {
    res.status(HttpStatus.BAD_REQUEST).json({ message: error.message });
  }
};

const deleteSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findByIdAndDelete(req.params.id);
    if (!supplier)
      return res.status(HttpStatus.NOT_FOUND).json({ message: "Supplier not found." });
    res.json({ message: "Supplier deleted." });
  } catch (error) {
    res.status(HttpStatus.BAD_REQUEST).json({ message: error.message });
  }
};

const getOwnedSupplierData = async (req) => {
  if (!req.user.supplierId) throw Object.assign(new Error("Your account is not linked to a supplier record."), { status: HttpStatus.FORBIDDEN });
  const supplier = await Supplier.findById(req.user.supplierId);
  if (!supplier) throw Object.assign(new Error("Your supplier record no longer exists."), { status: HttpStatus.FORBIDDEN });
  const products = await Product.find({ supplierId: supplier._id })
      .populate("categoryId", "categoryName")
      .populate("supplierId", "supplierName")
      .sort({ createdAt: -1 });
  const productIds = products.map((product) => product._id);
  const [orders, reviews] = await Promise.all([
    productIds.length
      ? Order.find({ "orderItems.productId": { $in: productIds } })
        .populate("userId", "firstName lastName email contactNumber address")
        .sort({ orderedAt: -1 })
      : [],
    productIds.length
      ? Review.find({ productId: { $in: productIds } })
        .populate("productId", "productName productImage")
        .populate("userId", "firstName lastName")
        .sort({ createdAt: -1 })
      : [],
  ]);
  const totalSales = orders
    .filter((order) => order.orderStatus === "Completed")
    .reduce((total, order) => total + order.orderItems
      .filter((item) => productIds.some((id) => String(id) === String(item.productId)))
      .reduce((subtotal, item) => subtotal + item.productPrice * item.quantity, 0), 0);
  return { supplier, products, orders, reviews, totalSales };
};

const getSupplierDashboard = async (req, res) => {
  try {
    res.json(await getOwnedSupplierData(req));
  } catch (error) {
    res.status(error.status || HttpStatus.BAD_REQUEST).json({ message: error.message });
  }
};

const getSupplierOrders = async (req, res) => {
  try {
    res.json((await getOwnedSupplierData(req)).orders);
  } catch (error) {
    res.status(error.status || HttpStatus.BAD_REQUEST).json({ message: error.message });
  }
};

const getSupplierProducts = async (req, res) => {
  try {
    res.json((await getOwnedSupplierData(req)).products);
  } catch (error) {
    res.status(error.status || HttpStatus.BAD_REQUEST).json({ message: error.message });
  }
};

const getSupplierReviews = async (req, res) => {
  try {
    res.json((await getOwnedSupplierData(req)).reviews);
  } catch (error) {
    res.status(error.status || HttpStatus.BAD_REQUEST).json({ message: error.message });
  }
};

module.exports = {
  getSuppliers,
  getSupplier,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getSupplierDashboard,
  getSupplierOrders,
  getSupplierProducts,
  getSupplierReviews,
};
