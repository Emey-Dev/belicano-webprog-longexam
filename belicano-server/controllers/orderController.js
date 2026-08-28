const Order = require("../models/orderModel");
const Product = require("../models/productModel");
const { HttpStatus } = require("../config/constants");

const restoreOrderStock = async (orderItems) => {
  await Promise.all(
    orderItems.map((item) =>
      Product.updateOne(
        { _id: item.productId },
        { $inc: { stockQuantity: item.quantity } },
      ),
    ),
  );
};

const getOrders = async (req, res) => {
  try {
    const requestedUserId = req.query.userId;
    if (requestedUserId && req.user.userRole !== "admin" && String(req.user._id) !== requestedUserId)
      return res.status(HttpStatus.FORBIDDEN).json({ message: "You can only access your own orders." });
    let filter;
    if (req.user.userRole === "supplier") {
      if (!req.user.supplierId)
        return res.status(HttpStatus.FORBIDDEN).json({ message: "Your account is not linked to a supplier record." });
      if (requestedUserId)
        return res.status(HttpStatus.FORBIDDEN).json({ message: "Suppliers can only access orders for their products." });
      const products = await Product.find({ supplierId: req.user.supplierId }).select("_id");
      filter = { "orderItems.productId": { $in: products.map((product) => product._id) } };
    } else {
      filter = req.user.userRole === "admin"
        ? (requestedUserId
          ? { userId: requestedUserId }
          : req.query.mine === "true" ? { userId: req.user._id } : {})
        : { userId: req.user._id };
    }
    res.json(
      await Order.find(filter)
        .populate("userId", "firstName lastName email contactNumber address")
        .sort({ orderedAt: -1 }),
    );
  } catch (error) {
    res.status(HttpStatus.BAD_REQUEST).json({ message: error.message });
  }
};
const getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate(
      "userId",
      "firstName lastName email contactNumber address",
    );
    if (!order)
      return res.status(HttpStatus.NOT_FOUND).json({ message: "Order not found." });
    if (req.user.userRole === "supplier") {
      if (!req.user.supplierId)
        return res.status(HttpStatus.FORBIDDEN).json({ message: "Your account is not linked to a supplier record." });
      const productIds = await Product.find({ supplierId: req.user.supplierId }).distinct("_id");
      if (!order.orderItems.some((item) => productIds.some((id) => String(id) === String(item.productId))))
        return res.status(HttpStatus.FORBIDDEN).json({ message: "You can only access orders for your products." });
    } else if (req.user.userRole !== "admin" && String(order.userId._id) !== String(req.user._id))
      return res.status(HttpStatus.FORBIDDEN).json({ message: "You can only access your own orders." });
    res.json(order);
  } catch (error) {
    res.status(HttpStatus.BAD_REQUEST).json({ message: error.message });
  }
};
const createOrder = async (req, res) => {
  try {
    if (!Array.isArray(req.body.orderItems) || req.body.orderItems.length === 0)
      return res.status(HttpStatus.BAD_REQUEST).json({ message: "At least one order item is required." });

    const quantities = new Map();
    for (const item of req.body.orderItems) {
      const quantity = Number(item.quantity);
      if (!Number.isInteger(quantity) || quantity < 1)
        return res.status(HttpStatus.BAD_REQUEST).json({ message: "Order quantities must be positive whole numbers." });
      quantities.set(String(item.productId), (quantities.get(String(item.productId)) || 0) + quantity);
    }

    const products = await Product.find({ _id: { $in: [...quantities.keys()] } });
    const productsById = new Map(products.map((product) => [String(product._id), product]));
    const orderItems = [];
    let totalAmount = 0;
    for (const [productId, quantity] of quantities) {
      const product = productsById.get(productId);
      if (!product)
        return res.status(HttpStatus.BAD_REQUEST).json({ message: "One or more products are unavailable." });
      if (!product.isActive || product.stockQuantity < quantity)
        return res.status(HttpStatus.BAD_REQUEST).json({ message: `${product.productName} does not have enough stock.` });
      orderItems.push({ productId: product._id, productName: product.productName, productPrice: product.productPrice, quantity });
      totalAmount += product.productPrice * quantity;
    }

    const reservedItems = [];
    for (const item of orderItems) {
      const reserved = await Product.updateOne(
        {
          _id: item.productId,
          $or: [{ isActive: true }, { isActive: { $exists: false } }],
          stockQuantity: { $gte: item.quantity },
        },
        { $inc: { stockQuantity: -item.quantity } },
      );
      if (reserved.modifiedCount !== 1) {
        await restoreOrderStock(reservedItems);
        return res.status(HttpStatus.BAD_REQUEST).json({ message: "Stock changed while placing your order. Please review your cart and try again." });
      }
      reservedItems.push(item);
    }

    try {
      const order = await Order.create({
        orderItems,
        totalAmount,
        pickupDetails: req.body.pickupDetails,
        userId: req.user._id,
      });
      res.status(HttpStatus.CREATED).json(order);
    } catch (error) {
      await restoreOrderStock(reservedItems);
      throw error;
    }
  } catch (error) {
    res.status(HttpStatus.BAD_REQUEST).json({ message: error.message });
  }
};
const updateOrder = async (req, res) => {
  try {
    const existingOrder = await Order.findById(req.params.id);
    if (!existingOrder)
      return res.status(HttpStatus.NOT_FOUND).json({ message: "Order not found." });
    const requestedStatus = req.body.orderStatus;
    if (!requestedStatus)
      return res.status(HttpStatus.BAD_REQUEST).json({ message: "An order status is required." });
    const transitions = {
      Pending: ["Pending", "Processing", "Cancelled"],
      Processing: ["Processing", "Ready for pickup", "Cancelled"],
      "Ready for pickup": ["Ready for pickup", "Completed", "Cancelled"],
      Completed: ["Completed"],
      Cancelled: ["Cancelled"],
    };
    if (requestedStatus && !transitions[existingOrder.orderStatus]?.includes(requestedStatus))
      return res.status(HttpStatus.BAD_REQUEST).json({ message: "That order status transition is not allowed." });
    if (["Completed", "Cancelled"].includes(existingOrder.orderStatus))
      return res.status(HttpStatus.BAD_REQUEST).json({ message: "Completed and cancelled orders cannot be edited." });
    const updates = { orderStatus: requestedStatus };
    const order = await Order.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });
    if (requestedStatus === "Cancelled" && existingOrder.orderStatus !== "Cancelled")
      await restoreOrderStock(existingOrder.orderItems);
    res.json(order);
  } catch (error) {
    res.status(HttpStatus.BAD_REQUEST).json({ message: error.message });
  }
};
const updateCustomerOrderStatus = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, userId: req.user._id });
    if (!order) return res.status(HttpStatus.NOT_FOUND).json({ message: "Order not found." });
    const { orderStatus } = req.body;
    const currentStatus = String(order.orderStatus || "").trim().toLowerCase();
    const requestedStatus = String(orderStatus || "").trim();
    const canCancel = requestedStatus === "Cancelled" && currentStatus === "pending";
    const canConfirmReceipt = requestedStatus === "Completed" && currentStatus === "ready for pickup";
    if (!canCancel && !canConfirmReceipt)
      return res.status(HttpStatus.BAD_REQUEST).json({ message: "This order cannot be updated to that status." });
    order.orderStatus = requestedStatus;
    await order.save();
    if (orderStatus === "Cancelled") await restoreOrderStock(order.orderItems);
    res.json(order);
  } catch (error) {
    res.status(HttpStatus.BAD_REQUEST).json({ message: error.message });
  }
};
module.exports = { getOrders, getOrder, createOrder, updateOrder, updateCustomerOrderStatus };
