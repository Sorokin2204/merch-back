const Router = require('express');
const gametController = require('../controller/game.controller');

const router = new Router();
const auth = require('../middleware/auth');
const { errorWrapper } = require('../middleware/customError');
const commentController = require('../controller/comment.controller');

router.post('/create', errorWrapper(auth), errorWrapper(commentController.createComment));
router.get('/list', errorWrapper(commentController.getCommentList));

module.exports = router;
