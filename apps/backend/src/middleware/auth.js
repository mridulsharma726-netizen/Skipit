const jwt = require('jsonwebtoken');
const { supabaseAdmin } = require('../config/supabase');
const config = require('../config/env');

const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Authentication token is required',
      });
    }

    const token = authHeader.split(' ')[1];

    let userId = null;
    let userEmail = null;

    // First try decoding custom JWT
    try {
      const decoded = jwt.verify(token, config.jwtSecret);
      userId = decoded.id || decoded.sub;
      userEmail = decoded.email;
    } catch (e) {
      // Fallback: Verify with Supabase Auth
      const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
      if (authErr || !user) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized: Invalid or expired token',
        });
      }
      userId = user.id;
      userEmail = user.email;
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Invalid token payload',
      });
    }

    // Fetch profile
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileErr && !profile) {
      // If profile doesn't exist yet, attach basic user payload
      req.user = {
        id: userId,
        email: userEmail,
        role: 'user',
        is_banned: false,
      };
      return next();
    }

    if (profile.is_banned) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Your account has been suspended by administration',
      });
    }

    req.user = {
      id: userId,
      email: userEmail,
      ...profile,
    };

    next();
  } catch (error) {
    console.error('[Auth Middleware Error]:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error in authentication',
    });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const token = authHeader.split(' ')[1];
    let userId = null;

    try {
      const decoded = jwt.verify(token, config.jwtSecret);
      userId = decoded.id || decoded.sub;
    } catch (e) {
      const { data: { user } } = await supabaseAdmin.auth.getUser(token);
      if (user) userId = user.id;
    }

    if (userId) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      req.user = profile ? { id: userId, ...profile } : { id: userId };
    } else {
      req.user = null;
    }

    next();
  } catch (error) {
    req.user = null;
    next();
  }
};

module.exports = {
  requireAuth,
  optionalAuth,
};
