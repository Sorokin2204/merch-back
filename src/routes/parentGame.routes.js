const Router = require('express');
const gametController = require('../controller/game.controller');

const router = new Router();
const auth = require('../middleware/auth');
const { errorWrapper } = require('../middleware/customError');
const parentGameController = require('../controller/parentGame.controller');
const authAdmin = require('../middleware/authAdmin');

router.post('/create', errorWrapper(authAdmin), errorWrapper(parentGameController.createParentGame));
router.get('/single/:slug', errorWrapper(parentGameController.getParentGameSingle));
router.post('/update', errorWrapper(authAdmin), errorWrapper(parentGameController.updateSingleParentGame));
router.get('/list', errorWrapper(parentGameController.getListParentGame));

module.exports = router;
