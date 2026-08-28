const Cart = require("../models/cartModel");
const Product = require("../models/productModel");
const { HttpStatus } = require("../config/constants");

const getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.params.userId }).populate(
      "cartItems.productId",
    );
    if (!cart)
      return res.status(HttpStatus.NOT_FOUND).json({ message: "Cart not found." });
    res.json(cart);
  } catch (error) {
    res.status(HttpStatus.BAD_REQUEST).json({ message: error.message });
  }
};
const saveCart = async (req, res) => {
  try {
    const requestedItems = Array.isArray(req.body.cartItems) ? req.body.cartItems : [];
    const productIds = requestedItems.map((item) => item.productId);
    const products = await Product.find({ _id: { $in: productIds } });
    const productsById = new Map(products.map((product) => [String(product._id), product]));
    const existingCart = await Cart.findOne({ userId: req.params.userId }).select("cartItems");
    const existingQuantities = new Map(
      (existingCart?.cartItems || []).map((item) => [String(item.productId), item.quantity]),
    );
    const cartItems = [];
    for (const item of requestedItems) {
      const quantity = Number(item.quantity);
      const product = productsById.get(String(item.productId));
      if (!product)
        return res.status(HttpStatus.BAD_REQUEST).json({ message: "One or more products are no longer available." });
      const isExistingStaleItem =
        existingQuantities.get(String(item.productId)) >= quantity &&
        (!product.isActive || quantity > product.stockQuantity);
      if (!Number.isInteger(quantity) || quantity < 1 || (!isExistingStaleItem && (!product.isActive || quantity > product.stockQuantity)))
        return res.status(HttpStatus.BAD_REQUEST).json({ message: `${product.productName} only has ${product.stockQuantity} item(s) in stock.` });
      cartItems.push({ productId: product._id, quantity });
    }
    const cart = await Cart.findOneAndUpdate(
      { userId: req.params.userId },
      { userId: req.params.userId, cartItems },
      { new: true, upsert: true, runValidators: true },
    ).populate("cartItems.productId");
    res.json(cart);
  } catch (error) {
    res.status(HttpStatus.BAD_REQUEST).json({ message: error.message });
  }
};
const deleteCart = async (req, res) => {
  try {
    await Cart.findOneAndDelete({ userId: req.params.userId });
    res.status(HttpStatus.NO_CONTENT).send();
  } catch (error) {
    res.status(HttpStatus.BAD_REQUEST).json({ message: error.message });
  }
};
module.exports = { getCart, saveCart, deleteCart };
