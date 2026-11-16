const express = require('express');
const router = express.Router();
const categoriesController = require('./categories.controller');
const { requireAuth } = require('../../middleware/auth');
const { requireAdmin } = require('../../middleware/rbac');

router.get('/', categoriesController.getCategories);
router.post('/', requireAuth, requireAdmin, categoriesController.createCategory);

module.exports = router;
