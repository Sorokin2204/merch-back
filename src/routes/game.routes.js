const Router = require('express');
const gametController = require('../controller/game.controller');

const router = new Router();
const auth = require('../middleware/auth');
const { errorWrapper } = require('../middleware/customError');

router.post('/create', errorWrapper(gametController.createGame));
router.get('/single/:slug', errorWrapper(gametController.getGameSingle));
router.post('/update', errorWrapper(gametController.updateSingleGame));
router.get('/list', errorWrapper(gametController.getListGame));

module.exports = router;
