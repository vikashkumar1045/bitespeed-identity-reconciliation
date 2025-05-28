const express = require('express');
const router = express.Router();
const { identifyContact } = require('../controllers/logic');

router.post('/identify', identifyContact);

module.exports = router;
