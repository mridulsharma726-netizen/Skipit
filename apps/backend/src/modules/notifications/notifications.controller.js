const { supabaseAdmin } = require('../../config/supabase');

const getNotifications = async (req, res, next) => {
  try {
    const { data: notifications, error } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    res.json({
      success: true,
      notifications: notifications || [],
    });
  } catch (error) {
    next(error);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .eq('user_id', req.user.id);

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    next(error);
  }
};

const markAllAsRead = async (req, res, next) => {
  try {
    const { error } = await supabaseAdmin
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', req.user.id)
      .eq('is_read', false);

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
};

const registerDeviceToken = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, error: 'Device token is required' });
    }

    const userId = req.user.id;
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('saved_addresses')
      .eq('id', userId)
      .single();

    const currentSaved = profile?.saved_addresses || {};
    const existingTokens = new Set(Array.isArray(currentSaved.fcm_tokens) ? currentSaved.fcm_tokens : []);
    existingTokens.add(token);

    await supabaseAdmin
      .from('profiles')
      .update({
        saved_addresses: {
          ...currentSaved,
          fcm_tokens: Array.from(existingTokens),
        },
      })
      .eq('id', userId);

    res.json({ success: true, message: 'Device registered for push notifications' });
  } catch (error) {
    next(error);
  }
};

const removeDeviceToken = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, error: 'Device token is required' });
    }

    const userId = req.user.id;
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('saved_addresses')
      .eq('id', userId)
      .single();

    const currentSaved = profile?.saved_addresses || {};
    const existingTokens = new Set(Array.isArray(currentSaved.fcm_tokens) ? currentSaved.fcm_tokens : []);
    existingTokens.delete(token);

    await supabaseAdmin
      .from('profiles')
      .update({
        saved_addresses: {
          ...currentSaved,
          fcm_tokens: Array.from(existingTokens),
        },
      })
      .eq('id', userId);

    res.json({ success: true, message: 'Device token removed' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  registerDeviceToken,
  removeDeviceToken,
};
