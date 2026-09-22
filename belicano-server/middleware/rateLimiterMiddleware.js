const FAILURE_STAGES = [
  { attempts: 10, minutes: 10 },
  { attempts: 7, minutes: 5 },
  { attempts: 5, minutes: 3 },
  { attempts: 3, minutes: 1 },
];

const attemptsByIdentity = new Map();

const identityFor = (req) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  return `${ip}:${email || "missing-email"}`;
};

const getStage = (attempts) =>
  FAILURE_STAGES.find((stage) => stage.attempts === attempts) ||
  (attempts > 10 ? FAILURE_STAGES[0] : null);

const sendLockedResponse = (res, state) => {
  const retryAfterSeconds = Math.max(
    Math.ceil((state.lockedUntil - Date.now()) / 1000),
    1,
  );
  res.set("Retry-After", String(retryAfterSeconds));
  res.set("X-Auth-Failed-Attempts", String(state.attempts));
  return res.status(429).json({
    message: `Too many failed attempts. Please try again in ${Math.ceil(retryAfterSeconds / 60)} minute(s).`,
    failedAttempts: state.attempts,
    retryAfterSeconds,
  });
};

const createAuthLimiter = ({ failureStatuses, action }) => (req, res, next) => {
  const identity = identityFor(req);
  const current = attemptsByIdentity.get(identity);

  if (current?.lockedUntil && current.lockedUntil > Date.now())
    return sendLockedResponse(res, current);

  if (current?.lockedUntil && current.lockedUntil <= Date.now()) {
    current.lockedUntil = null;
    attemptsByIdentity.set(identity, current);
  }

  res.on("finish", () => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      attemptsByIdentity.delete(identity);
      return;
    }
    if (!failureStatuses.includes(res.statusCode)) return;

    const previous = attemptsByIdentity.get(identity);
    const attempts = (previous?.attempts || 0) + 1;
    const stage = getStage(attempts);
    attemptsByIdentity.set(identity, {
      attempts,
      lockedUntil: stage ? Date.now() + stage.minutes * 60 * 1000 : null,
    });
  });

  res.set("X-Auth-Action", action);
  next();
};

const loginLimiter = createAuthLimiter({
  action: "login",
  failureStatuses: [400, 401, 403],
});

const registerLimiter = createAuthLimiter({
  action: "registration",
  failureStatuses: [400, 409, 422],
});

module.exports = { loginLimiter, registerLimiter };
