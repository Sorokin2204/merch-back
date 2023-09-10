const Router = require('express');
const gametController = require('../controller/game.controller');

const router = new Router();
const auth = require('../middleware/auth');
const { errorWrapper } = require('../middleware/customError');
const supportController = require('../controller/support.controller');

router.post('/create', errorWrapper(supportController.createSupport));
router.get('/single/:slug', errorWrapper(supportController.getSupportSingle));
router.post('/update', errorWrapper(supportController.updateSingleSupport));
router.get('/list', errorWrapper(supportController.getListSupport));

module.exports = router;
