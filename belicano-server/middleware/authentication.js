const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const { SECRET_KEY } = require("../config/config");
const { HttpStatus } = require("../config/constants");

const protect = async (req, res, next) => {
  try {
    const authorization = req.headers.authorization || "";
    const token = authorization.startsWith("Bearer ")
      ? authorization.slice(7)
      : null;

    if (!token)
      return res
        .status(HttpStatus.UNAUTHORIZED)
        .json({ message: "Authentication is required." });
    if (!SECRET_KEY)
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: "JWT_SECRET is missing from the server .env file." });

    const payload = jwt.verify(token, SECRET_KEY);
    const user = await User.findById(payload.userId);
    if (!user)
      return res
        .status(HttpStatus.UNAUTHORIZED)
        .json({ message: "User account no longer exists." });
    if (
      payload.sessionVersion === undefined ||
      payload.sessionVersion !== (user.sessionVersion || 0)
    )
      return res
        .status(HttpStatus.UNAUTHORIZED)
        .json({ message: "Your session has ended. Please sign in again." });
    if (!user.isActive)
      return res
        .status(HttpStatus.FORBIDDEN)
        .json({
          message: "This account is inactive. Please contact an administrator.",
        });

    req.user = user;
    next();
  } catch (_error) {
    res
      .status(HttpStatus.UNAUTHORIZED)
      .json({ message: "Invalid or expired authentication token." });
  }
};

const authorize =
  (...roles) =>
  (req, res, next) => {
    if (!req.user || !roles.includes(req.user.userRole))
      return res
        .status(HttpStatus.FORBIDDEN)
        .json({
          message: "You do not have permission to perform this action.",
        });
    next();
  };

const allowSelfOrAdmin =
  (paramName = "userId") =>
  (req, res, next) => {
    if (
      req.user.userRole === "admin" ||
      String(req.user._id) === req.params[paramName]
    )
      return next();
    res
      .status(HttpStatus.FORBIDDEN)
      .json({ message: "You can only access your own account data." });
  };

module.exports = { protect, authorize, allowSelfOrAdmin };
