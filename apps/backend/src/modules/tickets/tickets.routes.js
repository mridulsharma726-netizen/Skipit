const express = require('express');
const router = express.Router();
const ticketsController = require('./tickets.controller');
const { requireAuth } = require('../../middleware/auth');

router.use(requireAuth);

// User endpoints
router.post('/', ticketsController.createTicket);
router.get('/', ticketsController.getMyTickets);

// Admin endpoints
router.get('/admin', ticketsController.getAdminTickets);
router.patch('/admin/:id', ticketsController.updateAdminTicket);

module.exports = router;
