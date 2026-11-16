const { supabaseAdmin } = require('../../config/supabase');

/**
 * 1. User Submit a Support Ticket
 */
const createTicket = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { subject, description, priority = 'medium' } = req.body;

    if (!subject || !description) {
      return res.status(400).json({
        success: false,
        error: 'Subject and description are required for support tickets.',
      });
    }

    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    const ticketPriority = validPriorities.includes(priority) ? priority : 'medium';

    const { data: ticket, error } = await supabaseAdmin
      .from('support_tickets')
      .insert([{
        user_id: userId,
        subject,
        description,
        status: 'open',
        priority: ticketPriority,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    res.status(201).json({
      success: true,
      message: 'Support ticket submitted successfully. Our team will get back to you shortly.',
      ticket,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 2. User Get Their Own Support Tickets
 */
const getMyTickets = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const { data: tickets, error } = await supabaseAdmin
      .from('support_tickets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    res.json({
      success: true,
      count: tickets?.length || 0,
      tickets: tickets || [],
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 3. Admin / Moderator Get All Support Tickets
 */
const getAdminTickets = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'moderator') {
      return res.status(403).json({ success: false, error: 'Admin access required.' });
    }

    const { status, priority, page = 1, limit = 20 } = req.query;
    const from = (parseInt(page) - 1) * parseInt(limit);
    const to = from + parseInt(limit) - 1;

    let query = supabaseAdmin
      .from('support_tickets')
      .select(`
        *,
        user:profiles(id, full_name, email, avatar_url, phone_number, is_verified)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (status) {
      query = query.eq('status', status);
    }
    if (priority) {
      query = query.eq('priority', priority);
    }

    const { data: tickets, count, error } = await query;

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    res.json({
      success: true,
      tickets: tickets || [],
      total: count || 0,
      page: parseInt(page),
      totalPages: Math.ceil((count || 0) / parseInt(limit)),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 4. Admin / Moderator Update Support Ticket Status or Notes
 */
const updateAdminTicket = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'moderator') {
      return res.status(403).json({ success: false, error: 'Admin access required.' });
    }

    const { id } = req.params;
    const { status, priority, admin_notes } = req.body;

    const updates = {
      updated_at: new Date().toISOString(),
    };
    if (status) updates.status = status;
    if (priority) updates.priority = priority;
    if (admin_notes !== undefined) updates.admin_notes = admin_notes;

    const { data: ticket, error } = await supabaseAdmin
      .from('support_tickets')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    res.json({
      success: true,
      message: 'Support ticket updated.',
      ticket,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTicket,
  getMyTickets,
  getAdminTickets,
  updateAdminTicket,
};
