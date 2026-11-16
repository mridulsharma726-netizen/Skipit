const { supabaseAdmin } = require('../../config/supabase');
const { uploadToSupabaseStorage } = require('../../middleware/upload');
const { notifyUser } = require('../notifications/fcm.service');

// 1. Get Conversation List for Current User
const getConversations = async (req, res, next) => {
  try {
    const currentUserId = req.user.id;

    // Fetch all messages where current user is sender or receiver
    const { data: messages, error } = await supabaseAdmin
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    // Group messages by peer user ID
    const peerMap = new Map();

    for (const msg of messages || []) {
      const peerId = msg.sender_id === currentUserId ? msg.receiver_id : msg.sender_id;
      if (!peerMap.has(peerId)) {
        peerMap.set(peerId, {
          peer_id: peerId,
          last_message: msg,
          unread_count: 0,
          booking_id: msg.booking_id,
        });
      }

      if (msg.receiver_id === currentUserId && !msg.is_read) {
        peerMap.get(peerId).unread_count += 1;
      }
    }

    const conversations = [];

    // Hydrate peer profiles and optional listing previews
    for (const [peerId, conv] of peerMap.entries()) {
      const { data: peerProfile } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name, avatar_url, is_verified, rating, trust_score')
        .eq('id', peerId)
        .maybeSingle();

      // Check if conversation relates to a listing (stored in booking_id or metadata)
      let listing = null;
      if (conv.booking_id) {
        const { data: listingData } = await supabaseAdmin
          .from('listings')
          .select('id, title, price_per_day, images, category, location_name')
          .eq('id', conv.booking_id)
          .maybeSingle();
        listing = listingData;
      }

      conversations.push({
        id: `conv_${[currentUserId, peerId].sort().join('_')}`,
        peer: peerProfile || { id: peerId, full_name: 'SkipIt User' },
        last_message: conv.last_message,
        unread_count: conv.unread_count,
        listing: listing,
        updated_at: conv.last_message ? conv.last_message.created_at : new Date().toISOString(),
      });
    }

    res.json({
      success: true,
      conversations,
    });
  } catch (error) {
    next(error);
  }
};

// 2. Get Messages Between Current User and Peer
const getMessages = async (req, res, next) => {
  try {
    const currentUserId = req.user.id;
    const { peerId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const from = (parseInt(page) - 1) * parseInt(limit);
    const to = from + parseInt(limit) - 1;

    const { data: messages, count, error } = await supabaseAdmin
      .from('messages')
      .select('*', { count: 'exact' })
      .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${peerId}),and(sender_id.eq.${peerId},receiver_id.eq.${currentUserId})`)
      .order('created_at', { ascending: true })
      .range(from, to);

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    // Auto mark received messages as read
    supabaseAdmin
      .from('messages')
      .update({ is_read: true })
      .eq('sender_id', peerId)
      .eq('receiver_id', currentUserId)
      .eq('is_read', false)
      .then();

    // Fetch peer profile
    const { data: peerProfile } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, avatar_url, is_verified, rating, trust_score, location')
      .eq('id', peerId)
      .maybeSingle();

    res.json({
      success: true,
      messages: messages || [],
      peer: peerProfile,
      total: count || 0,
    });
  } catch (error) {
    next(error);
  }
};

// 3. Send Message
const sendMessage = async (req, res, next) => {
  try {
    const currentUserId = req.user.id;
    const { receiver_id, content, listing_id } = req.body;

    if (!receiver_id) {
      return res.status(400).json({ success: false, error: 'Recipient ID is required' });
    }

    let finalContent = content || '';

    // Handle image upload if attached
    if (req.file) {
      const imageUrl = await uploadToSupabaseStorage(req.file, 'listing-images', 'chat');
      finalContent = finalContent ? `${finalContent} [Image: ${imageUrl}]` : imageUrl;
    }

    if (!finalContent.trim()) {
      return res.status(400).json({ success: false, error: 'Message content cannot be empty' });
    }

    const messagePayload = {
      sender_id: currentUserId,
      receiver_id,
      content: finalContent,
      booking_id: null,
      is_read: false,
      created_at: new Date().toISOString(),
    };

    const { data: message, error } = await supabaseAdmin
      .from('messages')
      .insert([messagePayload])
      .select()
      .single();

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    // Create in-app & push notification for receiver
    notifyUser(receiver_id, {
      title: `New message from ${req.user.full_name || 'SkipIt User'}`,
      body: finalContent.length > 60 ? `${finalContent.substring(0, 60)}...` : finalContent,
      data: { sender_id: currentUserId, listing_id, type: 'message' },
    }).catch((err) => console.warn('[Message Notification Error]:', err.message));

    res.status(201).json({
      success: true,
      message,
    });
  } catch (error) {
    next(error);
  }
};

// 4. Start Rental Inquiry from Listing Details
const startListingInquiry = async (req, res, next) => {
  try {
    const currentUserId = req.user.id;
    const { listing_id, initial_message } = req.body;

    if (!listing_id) {
      return res.status(400).json({ success: false, error: 'listing_id is required' });
    }

    // Fetch listing details to know the owner
    const { data: listing, error: listingErr } = await supabaseAdmin
      .from('listings')
      .select('id, owner_id, title, price_per_day, images, location_name')
      .eq('id', listing_id)
      .single();

    if (listingErr || !listing) {
      return res.status(404).json({ success: false, error: 'Listing not found' });
    }

    if (listing.owner_id === currentUserId) {
      return res.status(400).json({ success: false, error: 'You cannot send a rental inquiry to your own listing' });
    }

    const defaultInquiry = `Hi! I'm interested in renting your "${listing.title}" for ₹${listing.price_per_day}/day. Is it currently available for rental?`;
    const inquiryText = initial_message || defaultInquiry;

    // Insert the inquiry message
    const { data: msg, error: msgErr } = await supabaseAdmin
      .from('messages')
      .insert([{
        sender_id: currentUserId,
        receiver_id: listing.owner_id,
        content: `[RENTAL INQUIRY for "${listing.title}"]\n${inquiryText}`,
        booking_id: null,
        is_read: false,
        created_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (msgErr) {
      return res.status(400).json({ success: false, error: msgErr.message });
    }

    // Send notification to owner
    notifyUser(listing.owner_id, {
      title: `Rental Inquiry: ${listing.title}`,
      body: `${req.user.full_name || 'A renter'} asked about your listing: "${inquiryText.substring(0, 50)}..."`,
      data: { listing_id: listing.id, sender_id: currentUserId, type: 'inquiry' },
    }).catch((err) => console.warn('[Inquiry Notification Error]:', err.message));

    res.status(201).json({
      success: true,
      message: 'Rental inquiry sent to owner',
      chat: {
        peer_id: listing.owner_id,
        listing_id: listing.id,
        initial_message: msg,
      },
    });
  } catch (error) {
    next(error);
  }
};

// 5. Mark Messages as Read
const markAsRead = async (req, res, next) => {
  try {
    const currentUserId = req.user.id;
    const { peerId } = req.params;

    const { error } = await supabaseAdmin
      .from('messages')
      .update({ is_read: true })
      .eq('sender_id', peerId)
      .eq('receiver_id', currentUserId)
      .eq('is_read', false);

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    res.json({ success: true, message: 'Messages marked as read' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getConversations,
  getMessages,
  sendMessage,
  startListingInquiry,
  markAsRead,
};
