const db = require('../models');
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');
const { CustomError, TypeError } = require('../models/customError.model');
const moment = require('moment/moment');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { currencyFormat } = require('../utils/currencyFormat');
const Support = db.support;

class SupportController {
  async createSupport(req, res) {
    const { name, slug, desc } = req.body;
    let createData = {
      name,
      slug,
      desc,
    };

    await Support.create(createData);
    res.json(true);
  }
  async updateSingleSupport(req, res) {
    const { id, name, slug, desc } = req.body;
    const findGame = await Support.findOne({
      where: {
        id,
      },
    });
    if (!findGame) {
      throw new CustomError(404, TypeError.NOT_FOUND);
    }
    let updateData = {
      name,
      slug,
      desc,
    };

    await Support.update(updateData, { where: { id } });
    res.json(true);
  }
  async getSupportSingle(req, res) {
    const { slug } = req.params;
    let findGame = await Support.findOne({
      where: {
        slug,
      },
    });
    if (findGame) {
      res.json(findGame);
    } else {
      throw new CustomError(404, TypeError.NOT_FOUND);
    }
  }
  async getListSupport(req, res) {
    const data = await Support.findAll();
    res.json(data);
  }
}

module.exports = new SupportController();
