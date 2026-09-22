const { body, validationResult } = require("express-validator");

const reportValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({
      message: "Please check the submitted details.",
      errors: errors
        .array()
        .map(({ path, msg }) => ({ field: path, message: msg })),
    });
  next();
};

const registerValidation = [
  body("firstName")
    .trim()
    .isLength({ min: 1, max: 80 })
    .withMessage("First name is required."),
  body("lastName")
    .trim()
    .isLength({ min: 1, max: 80 })
    .withMessage("Last name is required."),
  body("email")
    .trim()
    .isEmail()
    .withMessage("Please provide a valid email address."),
  body("contactNumber")
    .trim()
    .matches(/^\+639\d{9}$/)
    .withMessage("Contact number must use Philippine format: +639XXXXXXXXX."),
  body("address")
    .trim()
    .isLength({ min: 1, max: 300 })
    .withMessage("Address is required."),
  body("password")
    .isString()
    .matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/)
    .withMessage(
      "Password must be at least 8 characters with letters, numbers, and symbols.",
    ),
  body("userRole")
    .optional()
    .isIn(["customer", "supplier"])
    .withMessage("Please choose a valid account type."),
  reportValidationErrors,
];

const loginValidation = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("Please provide a valid email address."),
  body("password")
    .isString()
    .isLength({ min: 1 })
    .withMessage("Password is required."),
  reportValidationErrors,
];

const changePasswordValidation = [
  body("currentPassword")
    .isString()
    .isLength({ min: 1 })
    .withMessage("Current password is required."),
  body("newPassword")
    .isString()
    .matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/)
    .withMessage(
      "New password must be at least 8 characters with letters, numbers, and symbols.",
    ),
  reportValidationErrors,
];

const forgotPasswordValidation = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("Please provide a valid email address."),
  body("currentPassword")
    .isString()
    .isLength({ min: 1 })
    .withMessage("Current password is required."),
  body("newPassword")
    .isString()
    .matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/)
    .withMessage(
      "New password must be at least 8 characters with letters, numbers, and symbols.",
    ),
  body("confirmPassword")
    .isString()
    .custom((value, { req }) => value === req.body.newPassword)
    .withMessage("New passwords do not match."),
  reportValidationErrors,
];

module.exports = {
  registerValidation,
  loginValidation,
  changePasswordValidation,
  forgotPasswordValidation,
};
