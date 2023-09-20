const Router = require('express');
const gametController = require('../controller/game.controller');

const router = new Router();
const auth = require('../middleware/auth');
const { errorWrapper } = require('../middleware/customError');
const commentController = require('../controller/comment.controller');
const authAdmin = require('../middleware/authAdmin');

router.post('/create', errorWrapper(auth), errorWrapper(commentController.createComment));
router.post('/update', errorWrapper(authAdmin), errorWrapper(commentController.updateComment));
router.get('/list', errorWrapper(commentController.getCommentList));
router.get('/list-admin', errorWrapper(authAdmin), errorWrapper(commentController.getCommentListAdmin));

module.exports = router;
