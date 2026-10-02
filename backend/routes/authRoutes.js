const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', verifyToken, authController.getMe);
router.put('/profile', verifyToken, authController.updateProfile);
router.post('/upload-avatar', verifyToken, upload.single('avatar'), authController.uploadAvatar);
router.put('/change-password', verifyToken, authController.changePassword);

module.exports = router;
