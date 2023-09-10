const db = require('../models');
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');
const { CustomError, TypeError } = require('../models/customError.model');
const moment = require('moment/moment');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { currencyFormat } = require('../utils/currencyFormat');
const ParentGame = db.parentGame;

class ParentGameController {
  async createParentGame(req, res) {
    const { name, fullName, preview, slug, shortDesc, filterGameId, countryId, iconValute, nameValute, isMomentDelivery } = req.body;
    let createData = {
      name,
      fullName,
      preview,
      slug,
      shortDesc,
      filterGameId,
      countryId,
      iconValute,
      nameValute,
      isMomentDelivery,
      order: 0,
    };

    await ParentGame.create(createData);
    res.json(true);
  }
  async updateSingleParentGame(req, res) {
    const { id, name, fullName, preview, slug, shortDesc, filterGameId, countryId, iconValute, nameValute, isMomentDelivery } = req.body;
    const findGame = await ParentGame.findOne({
      where: {
        id,
      },
    });
    if (!findGame) {
      throw new CustomError(404, TypeError.NOT_FOUND);
    }
    let updateData = {
      name,
      fullName,
      preview,
      slug,
      shortDesc,
      filterGameId,
      countryId,
      iconValute,
      nameValute,
      isMomentDelivery,
    };

    await ParentGame.update(updateData, { where: { id } });
    res.json(true);
  }
  async getParentGameSingle(req, res) {
    const { slug } = req.params;
    let findGame = await ParentGame.findOne({
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
  async getListParentGame(req, res) {
    const data = await ParentGame.findAll();
    res.json(data);
  }
}

module.exports = new ParentGameController();
