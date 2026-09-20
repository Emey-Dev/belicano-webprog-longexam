const router = require("express").Router();
const controller = require("../controllers/supplierController");
const { protect, authorize } = require("../middleware/authentication");

router.get(
  "/dashboard",
  protect,
  authorize("supplier"),
  controller.getSupplierDashboard,
);
router.get(
  "/me",
  protect,
  authorize("supplier"),
  controller.getSupplierDashboard,
);
router.get(
  "/orders",
  protect,
  authorize("supplier"),
  controller.getSupplierOrders,
);
router.get(
  "/products",
  protect,
  authorize("supplier"),
  controller.getSupplierProducts,
);
router.get(
  "/reviews",
  protect,
  authorize("supplier"),
  controller.getSupplierReviews,
);
router
  .route("/")
  .get(controller.getSuppliers)
  .post(protect, authorize("admin"), controller.createSupplier);
router
  .route("/:id")
  .get(controller.getSupplier)
  .put(protect, authorize("admin"), controller.updateSupplier)
  .delete(protect, authorize("admin"), controller.deleteSupplier);

module.exports = router;
