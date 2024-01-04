const Router = require('express');
const mainController = require('../controller/main.controller');

const router = new Router();
const auth = require('../middleware/auth');
const { errorWrapper } = require('../middleware/customError');
const authAdmin = require('../middleware/authAdmin');

router.get('/post/country-list', errorWrapper(mainController.getPostCountryList));
router.get('/post/find-addresses', errorWrapper(mainController.findPostAddresses));
router.post('/post/calculate-cost', errorWrapper(mainController.calculatePostCost));
router.get('/review/list', errorWrapper(mainController.getProductReviews));

module.exports = router;
