const Review = require("../models/reviewModel");
const Order = require("../models/orderModel");
const { HttpStatus } = require("../config/constants");

const getReviews = async (req, res) => {
  try {
    const filter = req.query.productId
      ? { productId: req.query.productId }
      : {};
    res.json(
      await Review.find(filter)
        .populate("userId", "firstName lastName")
        .populate("productId", "productName"),
    );
  } catch (error) {
    res.status(HttpStatus.BAD_REQUEST).json({ message: error.message });
  }
};
const createReview = async (req, res) => {
  try {
    const completedOrder = await Order.exists({
      _id: req.body.orderId,
      userId: req.user._id,
      orderStatus: "Completed",
      "orderItems.productId": req.body.productId,
    });
    if (!completedOrder)
      return res.status(HttpStatus.FORBIDDEN).json({ message: "You can review a product only after receiving a completed order." });
    res.status(HttpStatus.CREATED).json(await Review.create({ ...req.body, userId: req.user._id }));
  } catch (error) {
    res.status(HttpStatus.BAD_REQUEST).json({ message: error.message });
  }
};
const updateReview = async (req, res) => {
  try {
    const existingReview = await Review.findById(req.params.id);
    if (!existingReview)
      return res.status(HttpStatus.NOT_FOUND).json({ message: "Review not found." });
    if (req.user.userRole !== "admin" && String(existingReview.userId) !== String(req.user._id))
      return res.status(HttpStatus.FORBIDDEN).json({ message: "You can only update your own reviews." });
    const updates = { ...req.body };
    delete updates.userId;
    const review = await Review.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });
    if (!review)
      return res.status(HttpStatus.NOT_FOUND).json({ message: "Review not found." });
    res.json(review);
  } catch (error) {
    res.status(HttpStatus.BAD_REQUEST).json({ message: error.message });
  }
};
const deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review)
      return res.status(HttpStatus.NOT_FOUND).json({ message: "Review not found." });
    if (req.user.userRole !== "admin" && String(review.userId) !== String(req.user._id))
      return res.status(HttpStatus.FORBIDDEN).json({ message: "You can only delete your own reviews." });
    await review.deleteOne();
    res.json({ message: "Review deleted." });
  } catch (error) {
    res.status(HttpStatus.BAD_REQUEST).json({ message: error.message });
  }
};
module.exports = { getReviews, createReview, updateReview, deleteReview };
