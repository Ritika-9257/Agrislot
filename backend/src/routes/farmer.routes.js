const express = require('express');
const FarmerController = require('../controllers/farmer.controller');
const validateRequest = require('../middleware/validateRequest');
const { authenticate, enforceFarmerIsolation } = require('../middleware/authenticate');
const { registerFarmerSchema, farmerIdParamSchema } = require('../validators/farmer.validator');

const router = express.Router();

router.get('/', FarmerController.getAllFarmers);
router.post('/', validateRequest({ body: registerFarmerSchema }), FarmerController.registerFarmer);
router.get('/me', authenticate, FarmerController.getMyProfile);
router.get('/me/bookings', authenticate, FarmerController.getMyBookings);
router.get('/:id', validateRequest({ params: farmerIdParamSchema }), authenticate, enforceFarmerIsolation, FarmerController.getFarmerById);
router.get('/:id/bookings', validateRequest({ params: farmerIdParamSchema }), authenticate, enforceFarmerIsolation, FarmerController.getFarmerBookings);

module.exports = router;
