const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const Supplier = require("../models/supplierModel");
const { SECRET_KEY } = require("../config/config");
const { HttpStatus } = require("../config/constants");

const createToken = (user) => {
  if (!SECRET_KEY)
    throw new Error("JWT_SECRET is missing from the server .env file.");
  return jwt.sign({
    userId: user._id,
    userRole: user.userRole,
    sessionVersion: user.sessionVersion || 0,
  }, SECRET_KEY, {
    expiresIn: "7d",
  });
};

const userData = (user) => ({
  _id: user._id,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  contactNumber: user.contactNumber,
  address: user.address,
  userRole: user.userRole,
  supplierId: user.supplierId || null,
  isActive: user.isActive,
});

const linkSupplierByEmail = async (user) => {
  if (user.userRole !== "supplier" || user.supplierId) return user;
  const supplier = await Supplier.findOne({ supplierEmail: user.email });
  if (!supplier) return user;
  user.supplierId = supplier._id;
  await user.save();
  return user;
};

const registerUser = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      contactNumber,
      address,
      password,
      userRole = "customer",
    } = req.body;
    if (!firstName?.trim() || !lastName?.trim() || !email?.trim() || !password)
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json({
          message: "First name, last name, email, and password are required.",
        });
    if (!["customer", "supplier"].includes(userRole))
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json({ message: "Please choose a valid account type." });
    if (!contactNumber?.trim())
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json({ message: "A contact number is required." });
    if (!/^\+639\d{9}$/.test(contactNumber.trim()))
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json({
          message: "Contact number must use Philippine format: +639XXXXXXXXX.",
        });
    if (!address?.trim())
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json({ message: "An address is required." });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json({ message: "Please provide a valid email address." });
    if (!/^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(password))
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json({
          message:
            "Password must be at least 8 characters with letters, numbers, and symbols.",
        });
    if (await User.exists({ email: email?.toLowerCase() }))
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json({ message: "An account with this email already exists." });
    let supplier = null;
    if (userRole === "supplier") {
      supplier = await Supplier.findOne({
        supplierEmail: email?.toLowerCase(),
      });
      if (!supplier) {
        supplier = await Supplier.create({
          supplierName: `${firstName} ${lastName}`.trim(),
          supplierEmail: email,
          supplierPhone: contactNumber,
          supplierAddress: address,
        });
      } else {
        supplier.supplierPhone = contactNumber;
        supplier.supplierAddress = address;
        await supplier.save();
      }
    }
    const user = await User.create({
      firstName,
      lastName,
      email,
      contactNumber,
      address,
      passwordHash: password,
      userRole,
      supplierId: supplier?._id || null,
    });
    res.status(HttpStatus.CREATED).json({
      user: userData(user),
      token: createToken(user),
    });
  } catch (error) {
    if (error.code === 11000)
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json({ message: "An account with this email already exists." });
    if (error.name === "ValidationError")
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json({ message: "Please check your details and try again." });
    res
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .json({
        message: "Unable to create your account right now. Please try again.",
      });
  }
};
const loginUser = async (req, res) => {
  try {
    const user = await User.findOne({
      email: req.body.email?.toLowerCase(),
    }).select("+passwordHash");
    if (user && !user.isActive)
      return res
        .status(HttpStatus.FORBIDDEN)
        .json({
          message:
            "Your account has been deactivated. Please contact the administrator.",
        });
    if (!user || !(await user.comparePassword(req.body.password)))
      return res
        .status(HttpStatus.UNAUTHORIZED)
        .json({ message: "Invalid username or password." });
    user.sessionVersion = (user.sessionVersion || 0) + 1;
    await user.save();
    await linkSupplierByEmail(user);
    res.json({
      user: userData(user),
      token: createToken(user),
    });
  } catch (_error) {
    res
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .json({ message: "Unable to sign in right now. Please try again." });
  }
};
const getUsers = async (_req, res) => {
  try {
    res.json(await User.find().populate("supplierId", "supplierName"));
  } catch (error) {
    res
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .json({ message: error.message });
  }
};
const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate(
      "supplierId",
      "supplierName",
    );
    if (!user)
      return res
        .status(HttpStatus.NOT_FOUND)
        .json({ message: "User not found." });
    res.json(user);
  } catch (error) {
    res.status(HttpStatus.BAD_REQUEST).json({ message: error.message });
  }
};
const updateUser = async (req, res) => {
  try {
    const updates = { ...req.body };
    delete updates.userRole;
    delete updates.supplierId;
    delete updates.isActive;
    delete updates.passwordHash;
    delete updates.email;
    const user = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });
    if (!user)
      return res
        .status(HttpStatus.NOT_FOUND)
        .json({ message: "User not found." });
    res.json(user);
  } catch (error) {
    res.status(HttpStatus.BAD_REQUEST).json({ message: error.message });
  }
};
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 8)
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json({ message: "New password must be at least 8 characters." });
    const user = await User.findById(req.user._id).select("+passwordHash");
    if (!(await user.comparePassword(currentPassword || "")))
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json({ message: "Current password is incorrect." });
    user.passwordHash = newPassword;
    user.sessionVersion = (user.sessionVersion || 0) + 1;
    await user.save();
    res.json({ message: "Password changed successfully." });
  } catch (error) {
    res.status(HttpStatus.BAD_REQUEST).json({ message: error.message });
  }
};
const forgotPassword = async (req, res) => {
  try {
    const { email, currentPassword, newPassword } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+passwordHash",
    );
    if (!user || !(await user.comparePassword(currentPassword)))
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json({ message: "Email or current password is incorrect." });
    user.passwordHash = newPassword;
    user.sessionVersion = (user.sessionVersion || 0) + 1;
    await user.save();
    res.json({ message: "Password changed successfully." });
  } catch (error) {
    res.status(HttpStatus.BAD_REQUEST).json({ message: error.message });
  }
};
const adminUpdateUser = async (req, res) => {
  try {
    const updates = {};
    for (const key of [
      "firstName",
      "lastName",
      "email",
      "contactNumber",
      "address",
      "userRole",
      "isActive",
    ])
      if (key in req.body) updates[key] = req.body[key];
    const user = await User.findById(req.params.id);
    if (!user)
      return res
        .status(HttpStatus.NOT_FOUND)
        .json({ message: "User not found." });
    const nextRole = updates.userRole || user.userRole;
    if (nextRole === "supplier") {
      const supplierId = req.body.supplierId || user.supplierId;
      if (updates.email) updates.email = updates.email.toLowerCase();
      const supplier = supplierId
        ? await Supplier.findById(supplierId)
        : await Supplier.findOne({
            supplierEmail: updates.email || user.email,
          });
      if (!supplier)
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json({
            message:
              "A valid supplier record is required for supplier accounts.",
          });
      updates.supplierId = supplier._id;
    } else {
      updates.supplierId = null;
    }
    Object.assign(user, updates);
    await user.save();
    res.json(user);
  } catch (error) {
    res.status(HttpStatus.BAD_REQUEST).json({ message: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.Id || req.params.id);
    if (!user)
      return res
        .status(HttpStatus.NOT_FOUND)
        .json({ message: "User not found." });
    res.json({ message: "User deleted successfully." });
  } catch (error) {
    res.status(HttpStatus.BAD_REQUEST).json({ message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  login: loginUser,
  getAllUsers: getUsers,
  getUserById: getUser,
  getUsers,
  getUser,
  updateUser,
  changePassword,
  forgotPassword,
  adminUpdateUser,
  deleteUser,
};
