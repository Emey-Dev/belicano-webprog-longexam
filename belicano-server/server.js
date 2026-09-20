const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const { PORT } = require("./config/config");
const { HttpStatus } = require("./config/constants");
const Product = require("./models/productModel");
const Order = require("./models/orderModel");
const Review = require("./models/reviewModel");
const User = require("./models/userModel");
const { protect, authorize } = require("./middleware/authentication");

const productRoutes = require("./routes/productRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const userRoutes = require("./routes/userRoutes");
const supplierRoutes = require("./routes/supplierRoutes");

const app = express();
const adminOnly = [protect, authorize("admin")];

const mountRoutes = (paths, router) => {
  paths.forEach((path) => app.use(path, router));
};

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => res.json({ message: "BulldogEx API is running." }));
mountRoutes(["/api/products", "/api/product"], productRoutes);
mountRoutes(["/api/category"], categoryRoutes);
mountRoutes(["/api/cart"], cartRoutes);
mountRoutes(["/api/order"], orderRoutes);
mountRoutes(["/api/review"], reviewRoutes);
mountRoutes(["/api/user"], userRoutes);

const getStats = async (_req, res) => {
  try {
    const [products, reviewedItems, activeUsers, orderedItems, sales] = await Promise.all([
      Product.countDocuments({ $or: [{ isActive: true }, { isActive: { $exists: false } }] }),
      Review.countDocuments(),
      User.countDocuments({ isActive: true }),
      Order.aggregate([
        { $match: { orderStatus: "Completed" } },
        { $unwind: "$orderItems" },
        { $group: { _id: null, total: { $sum: "$orderItems.quantity" } } },
      ]),
      Order.aggregate([
        { $match: { orderStatus: "Completed" } },
        { $unwind: "$orderItems" },
        { $group: { _id: null, total: { $sum: { $multiply: ["$orderItems.productPrice", "$orderItems.quantity"] } } } },
      ]),
    ]);
    res.json({ products, orderedItems: orderedItems[0]?.total || 0, reviewedItems, activeUsers, totalSales: sales[0]?.total || 0 });
  } catch (_error) {
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: "Unable to load store statistics." });
  }
};

const getPublicStats = async (_req, res) => {
  try {
    const [products, reviewedItems, activeUsers, orderedItems] = await Promise.all([
      Product.countDocuments({ $or: [{ isActive: true }, { isActive: { $exists: false } }] }),
      Review.countDocuments(),
      User.countDocuments({ isActive: true }),
      Order.aggregate([
        { $match: { orderStatus: { $ne: "Cancelled" } } },
        { $unwind: "$orderItems" },
        { $group: { _id: null, total: { $sum: "$orderItems.quantity" } } },
      ]),
    ]);
    res.json({ products, orderedItems: orderedItems[0]?.total || 0, reviewedItems, activeUsers });
  } catch (_error) {
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: "Unable to load store statistics." });
  }
};

app.get("/api/stats", ...adminOnly, getStats);
app.get("/api/public-stats", getPublicStats);

mountRoutes(["/api/suppliers", "/api/supplier"], supplierRoutes);
mountRoutes(["/api/v1/product", "/api/v1/products"], productRoutes);
mountRoutes(["/api/v1/suppliers", "/api/v1/supplier"], supplierRoutes);
mountRoutes(["/api/v1/category"], categoryRoutes);
mountRoutes(["/api/v1/cart"], cartRoutes);
mountRoutes(["/api/v1/order"], orderRoutes);
mountRoutes(["/api/v1/review"], reviewRoutes);
mountRoutes(["/api/v1/user"], userRoutes);
app.get("/api/v1/stats", ...adminOnly, getStats);
app.get("/api/v1/public-stats", getPublicStats);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
    message: "Internal server error.",
  });
});

connectDB()
  .then(() =>
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`)),
  )
  .catch((error) => {
    console.error(`Database connection failed: ${error.message}`);
    process.exit(1);
  });
