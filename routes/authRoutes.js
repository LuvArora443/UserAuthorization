const { Router } = require("express");
const authController = require("../controllers/authController");
const { requireAuth } = require('../middleware/authMiddleware');


const router = Router();

router.get('/signup', authController.signup_get);
router.post('/signup', authController.signup_post);
router.get('/login', authController.login_get);
router.post('/login', authController.login_post);
router.get('/login2', authController.login2_get);
router.post('/login2', authController.login2_post);
router.get('/logout', authController.logout_get);
router.get('/user-info', requireAuth, authController.getUserInfo);
router.get('/details',requireAuth,authController.details_get)
router.post('/details', requireAuth, authController.details_post);



module.exports = router;
