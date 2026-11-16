const express = require('express');
const router = express.Router();
const reportsController = require('./reports.controller');
const { requireAuth } = require('../../middleware/auth');
const { validate, reportSchema } = require('../../middleware/validate');

router.post('/', requireAuth, validate(reportSchema), reportsController.submitReport);

module.exports = router;
