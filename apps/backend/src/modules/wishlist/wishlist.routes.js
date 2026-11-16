const express = require('express');
const router = express.Router();
const wishlistController = require('./wishlist.controller');
const { requireAuth } = require('../../middleware/auth');

router.get('/', requireAuth, wishlistController.getWishlist);
router.post('/', requireAuth, wishlistController.addToWishlist);
router.delete('/:listingId', requireAuth, wishlistController.removeFromWishlist);

module.exports = router;
