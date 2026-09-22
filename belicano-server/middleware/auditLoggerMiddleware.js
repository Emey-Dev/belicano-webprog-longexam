const Log = require("../models/logModel");
const AUDITED_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const isAuditedRequest = (req) =>
  AUDITED_METHODS.has(req.method) ||
  (req.method === "GET" && req.get("X-Audit-Action") === "true");

const writeLog = async (level, message, metadata) => {
  try {
    await Log.create({ level, message, metadata });
  } catch (error) {
    console.error("Failed to write audit log:", error.message);
  }
};

const auditLoggerMiddleware = (req, res, next) => {
  if (!isAuditedRequest(req)) return next();

  const startedAt = Date.now();

  res.on("finish", () => {
    const metadata = {
      method: req.method,
      path: req.originalUrl,
      ip: req.ip || req.socket.remoteAddress || null,
      userId: req.user?._id || null,
      statusCode: res.statusCode,
      durationMs: Date.now() - startedAt,
      userAction: req.get("X-Audit-Action") === "true",
    };
    const message = `${req.method} ${req.originalUrl} - ${res.statusCode}`;
    const level =
      res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info";
    void writeLog(level, message, metadata);
  });

  next();
};

module.exports = { auditLoggerMiddleware };
