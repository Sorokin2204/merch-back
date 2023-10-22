const db = require('../models');
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');
const { CustomError, TypeError } = require('../models/customError.model');
const moment = require('moment/moment');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const bcrypt = require('bcrypt');
const generator = require('generate-password');
const { currencyFormat } = require('../utils/currencyFormat');
const randomIntFromInterval = require('../utils/randomIntFromInterval');
const mailService = require('../utils/mainSend');

const User = db.user;
const Image = db.image;
const Advert = db.advert;
const Category = db.category;
const Transaction = db.transaction;
const createPaymentUrl = async ({ amount, userId }) => {
  let postData = {
    amount,
    order_id: uuidv4(),
    shop_id: 'ae732cda-b91d-4fd4-b60b-bf407ba51e7c',
    custom_fields: JSON.stringify({ userId }),
    include_service: ['card', 'qiwi', 'yoomoney'],
  };
  const response = await axios.post('https://api.mivion.com/invoice/create', postData, { headers: { 'x-api-key': 'ed692d0bb9fea7c49d40fc4873e5c2a45ff5dcfb' } });
  return response.data.data.url;
};
class PageController {
  async uploadFile(req, res) {
    if (!req.files) {
      res.send({
        status: 'failed',
      });
    } else {
      let file = req.files.file;
      const newUuid = uuidv4();

      const newFileName = `${newUuid}.${getFileExt(file.name)}`;
      file.mv('./public/files/' + newFileName);
      res.send({
        status: 'success',
        path: newFileName,
      });
    }
  }

  async auth(req, res) {
    const authHeader = req.headers['auth-token'];
    if (!authHeader) {
      throw new CustomError();
    }
    const tokenData = jwt.verify(authHeader, process.env.SECRET_TOKEN, (err, tokenData) => {
      if (err) {
        throw new CustomError();
      }
      return tokenData;
    });
    const findUser = await User.findOne({ where: { id: tokenData.id }, include: Transaction });
    res.json({ ...findUser.toJSON() });
  }
  async authAdmin(req, res) {
    const authHeader = req.headers['auth-token'];
    if (!authHeader) {
      throw new CustomError();
    }
    const tokenData = jwt.verify(authHeader, process.env.SECRET_TOKEN, (err, tokenData) => {
      if (err) {
        throw new CustomError();
      }
      return tokenData;
    });
    const findUser = await User.findOne({ where: { id: tokenData.id, role: 'admin' }, include: Transaction });
    res.json({ ...findUser.toJSON() });
  }
  async loginByMail(req, res) {
    const { e, s } = req.query;

    const findExistUser = await User.findOne({ where: { email: e } });

    if (!findExistUser) {
      throw new CustomError(400);
    }

    const tokenData = jwt.verify(s, process.env.SECRET_TOKEN_PASSWORD, (err, tokenData) => {
      if (err) {
        throw new CustomError();
      }
      return tokenData;
    });
    if (tokenData.email != e) {
      throw new CustomError(400);
    }
    const token = jwt.sign({ id: findExistUser.id, email: findExistUser.email }, process.env.SECRET_TOKEN, { expiresIn: '30d' });
    res.json({ token });
  }

  async createUser(req, res) {
    const { email, order } = req.body;
    const findUserEmail = await User.findOne({ where: { email } });
    let userEmail;
    let userId;
    if (findUserEmail) {
      userEmail = findUserEmail.email;
      userId = findUserEmail.id;
    } else {
      let colorList = ['red', 'yellow', 'dblue', 'pink', 'green', 'mint', 'black', 'olive', 'pumpkin', 'onyx'];
      let color = colorList[randomIntFromInterval(0, 9)];

      const newUser = await User.create({
        name: email.split('@')[0].slice(0, 8),
        type: 'mail',
        email,
        color,
      });
      userEmail = newUser.email;
      userId = newUser.id;
    }

    const tokenPassword = jwt.sign({ id: userId, email: userEmail }, process.env.SECRET_TOKEN_PASSWORD, { expiresIn: '1d' });
    await mailService.sendMailPassword(email, `${process.env.DOMAIN}/do?e=${email}&s=${tokenPassword}`);
    const tokenOrder = jwt.sign({ id: userId, email: userEmail }, process.env.SECRET_TOKEN, { expiresIn: '1m' });
    if (order) {
      try {
        await axios.post(`${process.env.DOMAIN}/api/order/create`, order, { headers: { 'auth-token': tokenOrder } });
      } catch (error) {
        console.log(error);
        throw new CustomError();
      }
    }

    res.json({ success: true });
  }
}

function getFileExt(name) {
  return /(?:\.([^.]+))?$/.exec(name)[1];
}

module.exports = new PageController();
