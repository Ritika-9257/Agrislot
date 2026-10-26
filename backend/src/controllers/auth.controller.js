const AuthService = require('../services/auth.service');
const { successResponse } = require('../utils/apiResponse');

const AuthController = {
  async login(req, res, next) {
    try {
      const { username, password } = req.body;
      const result = await AuthService.login(username, password);
      return successResponse(res, {
        message: 'Authentication successful',
        data: result
      });
    } catch (err) {
      next(err);
    }
  },

  async register(req, res, next) {
    try {
      const { username, password, role } = req.body;
      const result = await AuthService.registerUser({ username, password, role });
      return successResponse(res, {
        statusCode: 201,
        message: 'User registered successfully',
        data: result
      });
    } catch (err) {
      next(err);
    }
  },

  async googleLogin(req, res, next) {
    try {
      const { credential, idToken, token } = req.body || {};
      const actualCredential = credential || idToken || token;
      const result = await AuthService.googleLogin({ credential: actualCredential });
      return successResponse(res, {
        message: 'Google authentication successful',
        data: result
      });
    } catch (err) {
      next(err);
    }
  },

  async getMe(req, res, next) {
    try {
      const user = await AuthService.getMe(req.user.userId);
      return successResponse(res, {
        message: 'User profile fetched successfully',
        data: user
      });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = AuthController;
