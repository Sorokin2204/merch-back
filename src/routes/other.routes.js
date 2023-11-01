const Router = require('express');
const gametController = require('../controller/game.controller');

const router = new Router();
const auth = require('../middleware/auth');
const { errorWrapper } = require('../middleware/customError');
const otherController = require('../controller/other.controller');

router.get('/country/list', errorWrapper(otherController.getContryList));
router.get('/filter-game/list', errorWrapper(otherController.getFilterGameList));
router.get('/type-payment/list', errorWrapper(otherController.getTypePaymentList));
router.get('/parser', errorWrapper(otherController.startParser));
router.post('/payment-1', errorWrapper(otherController.paymentFirst));
router.post('/payment-2', errorWrapper(otherController.paymentSecond));

module.exports = router;
