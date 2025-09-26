import jwt from "jsonwebtoken";

/**
 * verifyToken middleware
 * Accepts JWT in either:
 *  - Authorization: Bearer <token>
 *  - Query string ?token= (useful for EventSource /realtime where setting headers is awkward)
 *  - (Future) Cookie (not implemented yet)
 */
export const verifyToken = async (req, res, next) => {
  try {
    let token = req.header("Authorization");
    if (!token) {
      // Fallback to query parameter for SSE compatibility
      if (req.query && typeof req.query.token === 'string') {
        token = `Bearer ${req.query.token}`;
      }
    }

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    if (token.startsWith("Bearer ")) {
      token = token.slice(7).trim();
    }

    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }
};
