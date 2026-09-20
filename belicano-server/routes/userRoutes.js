const router = require("express").Router();
const UserController = require("../controllers/userController");
const {
  protect,
  authorize,
  allowSelfOrAdmin,
} = require("../middleware/authentication");
router.post("/register", UserController.registerUser);
router.post("/login", UserController.login);
router.put("/me/password", protect, UserController.changePassword);
router.get("/user/", protect, authorize("admin"), UserController.getAllUsers);
router
  .route("/")
  .get(protect, authorize("admin"), UserController.getUsers);
router
  .route("/:id")
  .get(protect, allowSelfOrAdmin("id"), UserController.getUserById)
  .put(protect, allowSelfOrAdmin("id"), UserController.updateUser)
  .delete(protect, authorize("admin"), UserController.deleteUser);
router.patch(
  "/update/:Id",
  protect,
  allowSelfOrAdmin("Id"),
  UserController.updateUser,
);
router.delete(
  "/remove/:Id",
  protect,
  authorize("admin"),
  UserController.deleteUser,
);
router.put(
  "/:id/admin",
  protect,
  authorize("admin"),
  UserController.adminUpdateUser,
);
module.exports = router;
