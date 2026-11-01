const express = require('express');

const healthRoutes = require('./health.routes');
const authRoutes = require('./auth.routes');
const mandiRoutes = require('./mandi.routes');
const produceRoutes = require('./produce.routes');
const farmerRoutes = require('./farmer.routes');
const slotRoutes = require('./slot.routes');
const bookingRoutes = require('./booking.routes');
const transactionRoutes = require('./transaction.routes');
const adminRoutes = require('./admin.routes');
const notificationRoutes = require('./notification.routes');
const automationRoutes = require('./lab10.routes');
const analyticsRoutes = require('./lab11.routes');

const router = express.Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/mandis', mandiRoutes);
router.use('/produce', produceRoutes);
router.use('/farmers', farmerRoutes);
router.use('/slots', slotRoutes);
router.use('/bookings', bookingRoutes);
router.use('/transactions', transactionRoutes);
router.use('/notifications', notificationRoutes);
router.use('/admin', adminRoutes);

// Professional Analytics and Automation Endpoints
router.use('/analytics', analyticsRoutes);
router.use('/automation', automationRoutes);

// Compatibility aliases
router.use('/lab10', automationRoutes);
router.use('/lab11', analyticsRoutes);

module.exports = router;
