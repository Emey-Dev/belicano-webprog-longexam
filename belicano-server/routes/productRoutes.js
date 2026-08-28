const router = require("express").Router();
const controller = require("../controllers/productController");
const { protect, authorize } = require("../middleware/authMiddleware");
router.get("/admin", protect, authorize("admin"), controller.getAdminProducts);
router.get("/supplier", protect, authorize("supplier"), controller.getSupplierProducts);
router.route("/").get(controller.getProducts).post(protect, authorize("admin", "supplier"), controller.createProduct);
router
  .route("/:id")
  .get(controller.getProduct)
  .put(protect, authorize("admin", "supplier"), controller.updateProduct)
  .delete(protect, authorize("admin"), controller.deleteProduct);
module.exports = router;
