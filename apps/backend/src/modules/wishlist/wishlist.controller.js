const { supabaseAdmin } = require('../../config/supabase');

const getWishlist = async (req, res, next) => {
  try {
    const { data: wishlists, error } = await supabaseAdmin
      .from('wishlists')
      .select('*, listing:listings!wishlists_listing_id_fkey(*)')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      // Fallback query if foreign key join is named differently
      const { data: rawWishlists } = await supabaseAdmin
        .from('wishlists')
        .select('*')
        .eq('user_id', req.user.id);

      if (!rawWishlists || rawWishlists.length === 0) {
        return res.json({ success: true, wishlist: [] });
      }

      const listingIds = rawWishlists.map((w) => w.listing_id);
      const { data: listings } = await supabaseAdmin
        .from('listings')
        .select('*')
        .in('id', listingIds);

      const listingMap = new Map((listings || []).map((l) => [l.id, l]));
      const combined = rawWishlists.map((w) => ({
        ...w,
        listing: listingMap.get(w.listing_id) || null,
      })).filter((w) => w.listing !== null);

      return res.json({ success: true, wishlist: combined });
    }

    res.json({
      success: true,
      wishlist: (wishlists || []).filter((w) => w.listing !== null),
    });
  } catch (error) {
    next(error);
  }
};

const addToWishlist = async (req, res, next) => {
  try {
    const { listing_id } = req.body;
    if (!listing_id) {
      return res.status(400).json({ success: false, error: 'listing_id is required' });
    }

    // Check if listing exists
    const { data: listing } = await supabaseAdmin
      .from('listings')
      .select('id')
      .eq('id', listing_id)
      .single();

    if (!listing) {
      return res.status(404).json({ success: false, error: 'Listing not found' });
    }

    // Upsert wishlist
    const { data, error } = await supabaseAdmin
      .from('wishlists')
      .upsert({
        user_id: req.user.id,
        listing_id,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    res.status(201).json({
      success: true,
      message: 'Added to wishlist',
      wishlist: data,
    });
  } catch (error) {
    next(error);
  }
};

const removeFromWishlist = async (req, res, next) => {
  try {
    const { listingId } = req.params;

    const { error } = await supabaseAdmin
      .from('wishlists')
      .delete()
      .eq('user_id', req.user.id)
      .eq('listing_id', listingId);

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    res.json({
      success: true,
      message: 'Removed from wishlist',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
};
