const express = require('express');
const router = express.Router();
const chatController = require('./chat.controller');
const { requireAuth } = require('../../middleware/auth');
const { upload } = require('../../middleware/upload');
const { validate, inquirySchema } = require('../../middleware/validate');

router.get('/conversations', requireAuth, chatController.getConversations);
router.get('/messages/:peerId', requireAuth, chatController.getMessages);
router.post('/messages', requireAuth, upload.single('image'), chatController.sendMessage);
router.post('/inquiry', requireAuth, validate(inquirySchema), chatController.startListingInquiry);
router.patch('/messages/read/:peerId', requireAuth, chatController.markAsRead);

module.exports = router;
