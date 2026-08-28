const router = require("express").Router();
const controller = require("../controllers/reviewController");
const { protect, authorize } = require("../middleware/authMiddleware");
router.route("/").get(controller.getReviews).post(protect, authorize("customer", "admin"), controller.createReview);
router
  .route("/:id")
  .put(protect, authorize("customer", "admin"), controller.updateReview)
  .delete(protect, authorize("customer", "admin"), controller.deleteReview);
module.exports = router;
