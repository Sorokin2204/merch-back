require('dotenv').config();
const jwt = require('jsonwebtoken');
const { CustomError, TypeError } = require('../models/customError.model');
const db = require('../models');
const User = db.user;
async function authAdmin(req, res, next) {
  try {
  } catch (error) {}
  const authHeader = req.headers['auth-token'];
  if (!authHeader) {
    throw new CustomError(401, TypeError.PROBLEM_WITH_TOKEN);
  }
  const tokenData = jwt.verify(authHeader, process.env.SECRET_TOKEN, (err, tokenData) => {
    if (err) {
      throw new CustomError(403, TypeError.PROBLEM_WITH_TOKEN);
    }
    return tokenData;
  });
  const findUser = await User.findOne({ where: { id: tokenData.id, role: 'admin' }, exclude: ['password'] });
  if (!findUser) {
    throw new CustomError(403, TypeError.PROBLEM_WITH_TOKEN);
  }
  res.locals.userData = findUser;
  next();
}
module.exports = authAdmin;
