const { supabaseAdmin } = require('../../config/supabase');

const submitReport = async (req, res, next) => {
  try {
    const { reported_user_id, listing_id, reason, description } = req.body;

    if (!reason) {
      return res.status(400).json({ success: false, error: 'Reason for reporting is required' });
    }

    const { data: report, error } = await supabaseAdmin
      .from('reports')
      .insert([{
        reporter_id: req.user.id,
        reported_user_id: reported_user_id || null,
        listing_id: listing_id || null,
        reason,
        description: description || '',
        status: 'pending',
        created_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    res.status(201).json({
      success: true,
      message: 'Report submitted. Our moderation team will investigate promptly.',
      report,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitReport,
};
