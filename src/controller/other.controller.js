const db = require('../models');
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');
const { CustomError, TypeError } = require('../models/customError.model');
const moment = require('moment/moment');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { currencyFormat } = require('../utils/currencyFormat');
const FilterGame = db.filterGame;
const Country = db.country;
const TypePayment = db.typePayment;

class OtherController {
  async getFilterGameList(req, res) {
    const data = await FilterGame.findAll();
    res.json(data);
  }
  async getContryList(req, res) {
    const data = await Country.findAll();
    res.json(data);
  }
  async getTypePaymentList(req, res) {
    const data = await TypePayment.findAll();
    res.json(data);
  }
}

module.exports = new OtherController();
