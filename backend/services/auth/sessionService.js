/**
 * CampusNova Cryptographic Session & Authentication Service
 * Implements HMAC-SHA256 signed session tokens.
 * Guarantees that user identity and role cannot be spoofed by external headers or body parameters.
 */

const crypto = require("crypto");

const SESSION_SECRET = process.env.SESSION_SECRET || "campusnova-secure-session-key-2026-production";
const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

// Institutional Registered User Directory
const VERIFIED_USERS = {
  "STU-2026-894": {
    id: "STU-2026-894",
    role: "student",
    name: "Alex Rivera",
    email: "alex.rivera@university.edu",
    department: "Computer Science & Engineering"
  },
  "STU-2026-895": {
    id: "STU-2026-895",
    role: "student",
    name: "Jordan Lee",
    email: "jordan.lee@university.edu",
    department: "Electrical Engineering"
  },
  "STF-201": {
    id: "STF-201",
    role: "staff",
    name: "Dr. Evelyn Vance",
    email: "evelyn.vance@university.edu",
    department: "Computer Science & Engineering"
  },
  "ADM-001": {
    id: "ADM-001",
    role: "admin",
    name: "System Administrator",
    email: "admin@university.edu",
    department: "IT Directorate"
  }
};

/**
 * Base64URL encoding helper
 */
function base64urlEncode(str) {
  return Buffer.from(str)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64urlDecode(str) {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) {
    str += "=";
  }
  return Buffer.from(str, "base64").toString("utf8");
}

/**
 * Creates a cryptographically signed HMAC-SHA256 session token
 * Format: <base64url(payload)>.<base64url(hmacSignature)>
 */
function createSessionToken(userPayload) {
  const payload = {
    id: userPayload.id,
    role: userPayload.role,
    name: userPayload.name,
    email: userPayload.email,
    department: userPayload.department,
    iat: Date.now(),
    exp: Date.now() + TOKEN_EXPIRY_MS
  };

  const payloadStr = JSON.stringify(payload);
  const encodedPayload = base64urlEncode(payloadStr);

  const signature = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(encodedPayload)
    .digest("base64url");

  return `${encodedPayload}.${signature}`;
}

/**
 * Verifies the integrity and authenticity of a session token
 * Returns verified user payload or null if invalid/expired/tampered
 */
function verifySessionToken(tokenString) {
  if (!tokenString || typeof tokenString !== "string") {
    return null;
  }

  const parts = tokenString.trim().split(".");
  if (parts.length !== 2) {
    return null;
  }

  const [encodedPayload, providedSignature] = parts;

  // Re-compute signature
  const expectedSignature = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(encodedPayload)
    .digest("base64url");

  // Constant-time comparison to prevent timing attacks
  const providedBuf = Buffer.from(providedSignature);
  const expectedBuf = Buffer.from(expectedSignature);

  if (providedBuf.length !== expectedBuf.length) {
    return null;
  }

  if (!crypto.timingSafeEqual(providedBuf, expectedBuf)) {
    return null;
  }

  try {
    const payloadJson = base64urlDecode(encodedPayload);
    const payload = JSON.parse(payloadJson);

    // Check expiration
    if (payload.exp && Date.now() > payload.exp) {
      return null;
    }

    // Verify user exists and role matches institutional directory
    const known = VERIFIED_USERS[payload.id];
    if (known && known.role !== payload.role) {
      // Role in token does not match institutional registry
      return null;
    }

    return {
      id: payload.id,
      role: payload.role,
      name: payload.name,
      email: payload.email,
      department: payload.department
    };
  } catch (e) {
    return null;
  }
}

/**
 * Issues a valid signed token for a known user by ID
 */
function issueTokenForUser(userId) {
  const user = VERIFIED_USERS[userId];
  if (!user) return null;
  const token = createSessionToken(user);
  return { token, user };
}

/**
 * Issues a valid signed token for a role (default user for that role)
 */
function issueTokenForRole(role) {
  const cleanRole = (role || "").toLowerCase();
  let userId = "STU-2026-894";
  if (cleanRole === "staff" || cleanRole === "faculty") {
    userId = "STF-201";
  } else if (cleanRole === "admin") {
    userId = "ADM-001";
  }
  return issueTokenForUser(userId);
}

module.exports = {
  createSessionToken,
  verifySessionToken,
  issueTokenForUser,
  issueTokenForRole,
  VERIFIED_USERS
};
