const express = require('express');
const ProduceController = require('../controllers/produce.controller');

const router = express.Router();

router.get('/', ProduceController.getAllProduce);
router.get('/:id', ProduceController.getProduceById);

module.exports = router;
