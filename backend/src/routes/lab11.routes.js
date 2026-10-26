const express = require('express');
const Lab11Controller = require('../controllers/lab11.controller');

const router = express.Router();

// Section A: Benchmark queries with execution timing
router.get('/query1', Lab11Controller.query1);
router.post('/query2', Lab11Controller.query2);
router.get('/query3', Lab11Controller.query3);
router.get('/query4', Lab11Controller.query4);
router.get('/query5', Lab11Controller.query5);
router.get('/query6', Lab11Controller.query6);
router.get('/query7', Lab11Controller.query7);
router.post('/query8', Lab11Controller.query8);

// Section C: Views
router.get('/views/farmer-bookings', Lab11Controller.getFarmerBookingsView);
router.get('/views/surat-operations', Lab11Controller.getSuratMandiOperationsView);

// Section E: Dashboard Table Statistics & Operational Aggregates
router.get('/dashboard/statistics', Lab11Controller.getDashboardStatistics);
router.get('/operational', async (req, res, next) => {
  try {
    const AnalyticsService = require('../services/analytics.service');
    const { successResponse } = require('../utils/apiResponse');
    const data = await AnalyticsService.getOperationalMetrics(req.query);
    return successResponse(res, {
      message: 'Live operational metrics fetched successfully',
      data
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
