const router = require("express").Router();
const controller = require("../controllers/productController");
const { protect, authorize } = require("../middleware/authentication");
const { upload, validateImage } = require("../middleware/uploadImageMiddleware");
router.get("/admin", protect, authorize("admin"), controller.getAdminProducts);
router.get(
  "/supplier",
  protect,
  authorize("supplier"),
  controller.getSupplierProducts,
);
router
  .route("/")
  .get(controller.getProducts)
  .post(
    protect,
    authorize("admin", "supplier"),
    upload.single("image"),
    validateImage,
    controller.createProduct,
  );
router.post(
  "/:id/upload-image",
  protect,
  authorize("admin", "supplier"),
  upload.single("image"),
  validateImage,
  controller.uploadProductImage,
);
router
  .route("/:id")
  .get(controller.getProduct)
  .put(
    protect,
    authorize("admin", "supplier"),
    upload.single("image"),
    validateImage,
    controller.updateProduct,
  )
  .delete(protect, authorize("admin"), controller.deleteProduct);
module.exports = router;
