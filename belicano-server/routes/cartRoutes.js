const router = require("express").Router();
const controller = require("../controllers/cartController");
const {
  protect,
  authorize,
  allowSelfOrAdmin,
} = require("../middleware/authentication");
router
  .route("/:userId")
  .get(
    protect,
    allowSelfOrAdmin("userId"),
    authorize("customer", "admin"),
    controller.getCart,
  )
  .put(
    protect,
    allowSelfOrAdmin("userId"),
    authorize("customer", "admin"),
    controller.saveCart,
  )
  .delete(
    protect,
    allowSelfOrAdmin("userId"),
    authorize("customer", "admin"),
    controller.deleteCart,
  );
module.exports = router;
