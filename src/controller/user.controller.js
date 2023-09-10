const db = require('../models');
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');
const { CustomError, TypeError } = require('../models/customError.model');
const moment = require('moment/moment');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const bcrypt = require('bcrypt');
const generator = require('generate-password');
const mailService = require('../services/mail-service');
const { currencyFormat } = require('../utils/currencyFormat');
const randomIntFromInterval = require('../utils/randomIntFromInterval');

const User = db.user;
const Image = db.image;
const Advert = db.advert;
const Category = db.category;

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
    const findUser = await User.findOne({ where: { id: tokenData.id } });
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

    if (findUserEmail) {
      throw new CustomError(400, TypeError.USER_EXIST);
    }
    let colorList = ['red', 'yellow', 'dblue', 'pink', 'green', 'mint', 'black', 'olive', 'pumpkin', 'onyx'];
    let color = colorList[randomIntFromInterval(0, 9)];

    const newUser = await User.create({
      name: email.split('@')[0].slice(0, 8),
      type: 'mail',
      email,
      color,
    });
    const tokenPassword = jwt.sign({ id: newUser.id, email: newUser.email }, process.env.SECRET_TOKEN_PASSWORD, { expiresIn: '1d' });
    console.log('Отправка password token на почту', `http://localhost:3000/do?e=${email}&s=${tokenPassword}`);
    const tokenOrder = jwt.sign({ id: newUser.id, email: newUser.email }, process.env.SECRET_TOKEN, { expiresIn: '1m' });
    if (order) {
      try {
        await axios.post(`http://localhost:8080/api/order/create`, order, { headers: { 'auth-token': tokenOrder } });
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