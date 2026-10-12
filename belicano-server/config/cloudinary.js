const { CLOUDINARY_URL } = require("./config");
const cloudinary = require("cloudinary").v2;

if (CLOUDINARY_URL) cloudinary.config();

module.exports = cloudinary;
