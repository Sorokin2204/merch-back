const Router = require('express');
const pageController = require('../controller/user.controller');

const router = new Router();
const auth = require('../middleware/auth');
const { errorWrapper } = require('../middleware/customError');
const authAdmin = require('../middleware/authAdmin');

router.post('/file/upload', errorWrapper(pageController.uploadFile));
router.post('/user/create', errorWrapper(pageController.createUser));
router.get('/user/auth', errorWrapper(pageController.auth));
router.get('/user/auth-admin', errorWrapper(authAdmin), errorWrapper(pageController.authAdmin));
router.get('/user/login/mail', errorWrapper(pageController.loginByMail));

module.exports = router;
