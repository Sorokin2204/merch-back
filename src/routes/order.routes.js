const Router = require('express');

const router = new Router();
const auth = require('../middleware/auth');
const { errorWrapper } = require('../middleware/customError');
const orderController = require('../controller/order.controller');

router.post('/create', errorWrapper(auth), errorWrapper(orderController.createOrder));
router.get('/list', errorWrapper(auth), errorWrapper(orderController.getOrderList));
router.get('/single/:id', errorWrapper(auth), errorWrapper(orderController.getOrderSingle));
router.post('/change-payment', errorWrapper(auth), errorWrapper(orderController.changeTypePaymentOrder));
module.exports = router;
