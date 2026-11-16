const { supabaseAdmin } = require('../../config/supabase');

// 1. Dashboard Metrics
const getDashboardMetrics = async (req, res, next) => {
  try {
    const [
      { count: totalUsers },
      { count: totalListings },
      { count: activeListings },
      { count: pendingReports },
      { count: pendingKyc },
      { count: totalReviews },
    ] = await Promise.all([
      supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('listings').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('listings').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabaseAdmin.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }).eq('kyc_status', 'pending'),
      supabaseAdmin.from('reviews').select('*', { count: 'exact', head: true }),
    ]);

    res.json({
      success: true,
      metrics: {
        totalUsers: totalUsers || 0,
        totalListings: totalListings || 0,
        activeListings: activeListings || 0,
        pendingReports: pendingReports || 0,
        pendingKyc: pendingKyc || 0,
        totalReviews: totalReviews || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

// 2. User Management
const listUsers = async (req, res, next) => {
  try {
    const { q, role, is_banned, page = 1, limit = 25 } = req.query;
    const from = (parseInt(page) - 1) * parseInt(limit);
    const to = from + parseInt(limit) - 1;

    let query = supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact' });

    if (q) {
      query = query.or(`full_name.ilike.%${q}%,phone.ilike.%${q}%,location.ilike.%${q}%`);
    }

    if (role) {
      query = query.eq('role', role);
    }

    if (is_banned !== undefined) {
      query = query.eq('is_banned', is_banned === 'true');
    }

    query = query.order('created_at', { ascending: false }).range(from, to);

    const { data: users, count, error } = await query;

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    res.json({
      success: true,
      users: users || [],
      total: count || 0,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    next(error);
  }
};

// 3. Suspend / Reactivate User
const toggleUserBan = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { is_banned, reason } = req.body;

    const { data: user, error } = await supabaseAdmin
      .from('profiles')
      .update({ is_banned: Boolean(is_banned) })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    // If banned, pause user's listings
    if (is_banned) {
      await supabaseAdmin
        .from('listings')
        .update({ is_active: false })
        .eq('owner_id', userId);
    }

    // Log to audit log
    await supabaseAdmin
      .from('audit_log')
      .insert([{
        actor_id: req.user.id,
        action: is_banned ? 'USER_SUSPENDED' : 'USER_REINSTATED',
        entity_type: 'profile',
        entity_id: userId,
        new_data: { reason },
        created_at: new Date().toISOString(),
      }]);

    res.json({
      success: true,
      message: `User account has been ${is_banned ? 'suspended' : 'reinstated'}`,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// 4. List KYC Verification Queue
const listKycSubmissions = async (req, res, next) => {
  try {
    const { status = 'pending' } = req.query;

    const { data: users, error } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, phone, location, kyc_status, kyc_document_type, kyc_document_url, kyc_selfie_url, created_at, updated_at')
      .eq('kyc_status', status);

    if (error) {
      console.error('[listKycSubmissions Error]:', error);
      return res.status(400).json({ success: false, error: error.message });
    }

    console.log('[listKycSubmissions Success]:', users?.length, 'items found for status', status);

    // Ensure documents have valid accessible URLs
    const formatted = (users || []).map((u) => {
      let docUrl = u.kyc_document_url;
      let selfieUrl = u.kyc_selfie_url;

      if (docUrl && !docUrl.startsWith('http')) {
        const { data } = supabaseAdmin.storage.from('kyc-documents').getPublicUrl(docUrl);
        docUrl = data?.publicUrl || docUrl;
      }

      if (selfieUrl && !selfieUrl.startsWith('http')) {
        const { data } = supabaseAdmin.storage.from('kyc-documents').getPublicUrl(selfieUrl);
        selfieUrl = data?.publicUrl || selfieUrl;
      }

      return {
        ...u,
        kyc_document_url: docUrl,
        kyc_selfie_url: selfieUrl,
      };
    });

    res.json({ success: true, submissions: formatted });
  } catch (error) {
    next(error);
  }
};

// 5. Review KYC Submission
const reviewKyc = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { status, notes } = req.body; // status: 'approved' | 'rejected'

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Status must be approved or rejected' });
    }

    const isApproved = status === 'approved';

    const { data: user, error } = await supabaseAdmin
      .from('profiles')
      .update({
        kyc_status: status,
        is_verified: isApproved,
        kyc_reviewed_at: new Date().toISOString(),
        kyc_reviewer_notes: notes || '',
        trust_score: isApproved ? 85 : 40,
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    // Send in-app notification to user
    await supabaseAdmin
      .from('notifications')
      .insert([{
        user_id: userId,
        type: 'system',
        title: isApproved ? 'Identity Verification Approved!' : 'Verification Update',
        body: isApproved
          ? 'Congratulations! Your identity has been verified. A verified badge is now displayed on your profile and listings.'
          : `Your identity verification could not be approved. Reason: ${notes || 'Please resubmit clearer documents.'}`,
        is_read: false,
      }]);

    res.json({
      success: true,
      message: `KYC submission ${status}`,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// 6. Reports Management
const listReports = async (req, res, next) => {
  try {
    const { status = 'pending' } = req.query;

    const { data: reports, error } = await supabaseAdmin
      .from('reports')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    res.json({ success: true, reports: reports || [] });
  } catch (error) {
    next(error);
  }
};

// 7. Resolve Report
const resolveReport = async (req, res, next) => {
  try {
    const { reportId } = req.params;
    const { status, resolution_notes } = req.body; // 'resolved' | 'dismissed'

    const { data: report, error } = await supabaseAdmin
      .from('reports')
      .update({
        status: status || 'resolved',
      })
      .eq('id', reportId)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    res.json({
      success: true,
      message: 'Report status updated',
      report,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardMetrics,
  listUsers,
  toggleUserBan,
  listKycSubmissions,
  reviewKyc,
  listReports,
  resolveReport,
};
