const multer = require("multer");

const storage = multer.memoryStorage();
const acceptedImageTypes = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
]);

const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
});

const validateImage = async (req, res, next) => {
    if (!req.file) return next();

    try {
        const { fileTypeFromBuffer } = await import("file-type");
        const detectedType = await fileTypeFromBuffer(req.file.buffer);

        if (!detectedType || !acceptedImageTypes.has(detectedType.mime)) {
            return res.status(415).json({
                success: false,
                message: "Choose a valid JPEG, PNG, or WebP image.",
            });
        }

        next();
    } catch (error) {
        next(error);
    }
};

module.exports = { upload, validateImage };
