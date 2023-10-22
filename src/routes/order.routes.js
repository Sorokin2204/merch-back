const Router = require('express');

const router = new Router();
const auth = require('../middleware/auth');
const { errorWrapper } = require('../middleware/customError');
const orderController = require('../controller/order.controller');
const authAdmin = require('../middleware/authAdmin');

router.post('/create', errorWrapper(auth), errorWrapper(orderController.createOrder));
router.post('/create-payment', errorWrapper(auth), errorWrapper(orderController.createPayment));
router.post('/create-topup', errorWrapper(auth), errorWrapper(orderController.createTopup));
router.post('/process-payment', errorWrapper(orderController.processPaymentText));
router.post('/update', errorWrapper(authAdmin), errorWrapper(orderController.updateOrder));
router.get('/list', errorWrapper(auth), errorWrapper(orderController.getOrderList));
router.get('/list-admin', errorWrapper(authAdmin), errorWrapper(orderController.getOrderListAdmin));
router.get('/single/:id', errorWrapper(auth), errorWrapper(orderController.getOrderSingle));
router.get('/save-game-inputs', errorWrapper(auth), errorWrapper(orderController.getSaveGameInputs));
router.post('/save-game-input', errorWrapper(auth), errorWrapper(orderController.removeSaveGameInput));
router.post('/change-payment', errorWrapper(auth), errorWrapper(orderController.changeTypePaymentOrder));

module.exports = router;
