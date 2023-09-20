const Router = require('express');
const gametController = require('../controller/game.controller');

const router = new Router();
const auth = require('../middleware/auth');
const { errorWrapper } = require('../middleware/customError');
const bannerController = require('../controller/banner.controller');
const authAdmin = require('../middleware/authAdmin');

router.post('/create', errorWrapper(authAdmin), errorWrapper(bannerController.createBanner));
router.get('/single/:slug', errorWrapper(bannerController.getBannerSingle));
router.post('/update', errorWrapper(authAdmin), errorWrapper(bannerController.updateSingleBanner));
router.get('/list', errorWrapper(bannerController.getListBanner));

module.exports = router;
