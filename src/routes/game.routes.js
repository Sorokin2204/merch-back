const Router = require('express');
const gametController = require('../controller/game.controller');

const router = new Router();
const auth = require('../middleware/auth');
const { errorWrapper } = require('../middleware/customError');
const authAdmin = require('../middleware/authAdmin');

router.post('/create', errorWrapper(authAdmin), errorWrapper(gametController.createGame));
router.get('/single/:slug', errorWrapper(gametController.getGameSingle));
router.post('/update', errorWrapper(authAdmin), errorWrapper(gametController.updateSingleGame));
router.get('/list', errorWrapper(gametController.getListGame));

module.exports = router;
