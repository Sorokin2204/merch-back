const Router = require('express');
const gametController = require('../controller/game.controller');

const router = new Router();
const auth = require('../middleware/auth');
const { errorWrapper } = require('../middleware/customError');
const parentGameController = require('../controller/parentGame.controller');

router.post('/create', errorWrapper(parentGameController.createParentGame));
router.get('/single/:slug', errorWrapper(parentGameController.getParentGameSingle));
router.post('/update', errorWrapper(parentGameController.updateSingleParentGame));
router.get('/list', errorWrapper(parentGameController.getListParentGame));

module.exports = router;
