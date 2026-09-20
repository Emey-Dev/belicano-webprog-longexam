const router = require("express").Router();
const controller = require("../controllers/orderController");
const { protect, authorize } = require("../middleware/authentication");
router
  .route("/")
  .get(protect, controller.getOrders)
  .post(protect, authorize("customer", "admin"), controller.createOrder);
router.put(
  "/:id/customer-status",
  protect,
  authorize("customer", "admin"),
  controller.updateCustomerOrderStatus,
);
router
  .route("/:id")
  .get(protect, controller.getOrder)
  .put(protect, authorize("admin"), controller.updateOrder);
module.exports = router;
