const express = require('express');
const SlotController = require('../controllers/slot.controller');

const router = express.Router();

router.get('/', SlotController.getAllSlots);
router.get('/utilization', SlotController.getUtilization);
router.get('/:id', SlotController.getSlotById);

module.exports = router;
