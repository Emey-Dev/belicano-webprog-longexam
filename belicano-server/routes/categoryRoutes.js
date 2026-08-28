const router = require("express").Router();
const controller = require("../controllers/catergoryController");
const { protect, authorize } = require("../middleware/authMiddleware");
router.route("/").get(controller.getCategories).post(protect, authorize("admin"), controller.createCategory);
router
  .route("/:id")
  .get(controller.getCategory)
  .put(protect, authorize("admin"), controller.updateCategory)
  .delete(protect, authorize("admin"), controller.deleteCategory);
module.exports = router;
