const express = require('express');
const Lab10Controller = require('../controllers/lab10.controller');

const router = express.Router();

// 1. Data Manipulation Stored Procedures
router.post('/procedures/farmer/insert', Lab10Controller.insertFarmerProcedure);
router.put('/procedures/farmer/update', Lab10Controller.updateFarmerProcedure);
router.delete('/procedures/farmer/:id', Lab10Controller.deleteFarmerProcedure);

// 3. User Login Procedures
router.post('/procedures/login/insert', Lab10Controller.insertLoginProcedure);
router.get('/procedures/login/check', Lab10Controller.checkLoginProcedure);

// 4. Cursor Procedures
router.get('/cursors/farmers/all', Lab10Controller.cursorDisplayAll);
router.get('/cursors/farmers/first-five', Lab10Controller.cursorDisplayFirstFive);

// 5. Paginated Search Procedures
router.get('/search/paginated', Lab10Controller.searchPaginated);
router.get('/search/filtered', Lab10Controller.searchFiltered);

// 6. Column Sum Numeric Functions
router.get('/functions/total-weight', Lab10Controller.getTotalBookingWeight);
router.get('/procedures/weight-by-farmer', Lab10Controller.getTotalWeightByFarmer);

// 9. Audit Logs
router.get('/audit-logs', Lab10Controller.getAuditLogs);

module.exports = router;
