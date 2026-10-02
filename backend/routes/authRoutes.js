const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middlewares/auth');
const { authLimiter } = require('../middlewares/rateLimiter');
const upload = require('../middlewares/upload');

router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);
router.get('/me', verifyToken, authController.getMe);
router.put('/profile', verifyToken, authController.updateProfile);
router.post('/upload-avatar', verifyToken, upload.single('avatar'), authController.uploadAvatar);
router.put('/change-password', verifyToken, authLimiter, authController.changePassword);

module.exports = router;
