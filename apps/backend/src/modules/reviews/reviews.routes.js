const express = require('express');
const router = express.Router();
const reviewsController = require('./reviews.controller');
const { requireAuth } = require('../../middleware/auth');

router.post('/', requireAuth, reviewsController.createReview);
router.get('/user/:userId', reviewsController.getReviewsForUser);

module.exports = router;
