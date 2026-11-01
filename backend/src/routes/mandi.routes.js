const express = require('express');
const MandiController = require('../controllers/mandi.controller');

const router = express.Router();

router.get('/', MandiController.getAllMandis);
router.get('/:id', MandiController.getMandiById);
router.get('/:id/slots', MandiController.getMandiSlots);

module.exports = router;
