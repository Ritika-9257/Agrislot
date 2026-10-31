const express = require('express');
const MandiController = require('../controllers/mandi.controller');
const { authenticate, requireRole } = require('../middleware/authenticate');

const router = express.Router();

router.get('/', MandiController.getAllMandis);
router.get('/:id', MandiController.getMandiById);
router.get('/:id/slots', MandiController.getMandiSlots);

// Administrative CRUD operations
router.post('/', authenticate, requireRole('Admin', 'Mandi_Officer'), MandiController.createMandi);
router.patch('/:id', authenticate, requireRole('Admin', 'Mandi_Officer'), MandiController.updateMandi);
router.delete('/:id', authenticate, requireRole('Admin'), MandiController.deleteMandi);

module.exports = router;
