const mongoose = require("mongoose");
const { MONGO_DB_URL } = require("./config");

const connectDB = async () => {
  if (!MONGO_DB_URL) {
    throw new Error("MONGODB_URI is missing from the server .env file.");
  }

  const connection = await mongoose.connect(MONGO_DB_URL, {
    dbName: "bdexchange_db",
  });

  console.log(`MongoDB connected: ${connection.connection.host}/bdexchange_db`);
};

module.exports = connectDB;
