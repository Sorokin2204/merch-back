const db = require('../models');
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');
const { CustomError, TypeError } = require('../models/customError.model');
const moment = require('moment/moment');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { currencyFormat } = require('../utils/currencyFormat');
const Banner = db.banner;
const Game = db.game;
const ParentGame = db.parentGame;
const Support = db.support;

class BannerController {
  async createBanner(req, res) {
    const { name, slug, preview, desc, link } = req.body;
    let createData = {
      name,
      slug,
      desc,
      preview,
    };

    const linkFormat = link.split('_');
    if (linkFormat[0] == 'game') {
      createData = { ...createData, gameId: linkFormat[1], parentGameId: null, supportId: null };
    } else if (linkFormat[0] == 'parentGame') {
      createData = { ...createData, gameId: null, parentGameId: linkFormat[1], supportId: null };
    } else if (linkFormat[0] == 'support') {
      createData = { ...createData, gameId: null, parentGameId: null, supportId: linkFormat[1] };
    }
    await Banner.create(createData);
    res.json(true);
  }
  async updateSingleBanner(req, res) {
    const { id, name, slug, desc, preview, link } = req.body;
    const findGame = await Banner.findOne({
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
      preview,
    };
    const linkFormat = link.split('_');
    if (linkFormat[0] == 'game') {
      updateData = { ...updateData, gameId: linkFormat[1], parentGameId: null, supportId: null };
    } else if (linkFormat[0] == 'parentGame') {
      updateData = { ...updateData, gameId: null, parentGameId: linkFormat[1], supportId: null };
    } else if (linkFormat[0] == 'support') {
      updateData = { ...updateData, gameId: null, parentGameId: null, supportId: linkFormat[1] };
    }
    await Banner.update(updateData, { where: { id } });
    res.json(true);
  }
  async getBannerSingle(req, res) {
    const { slug } = req.params;
    let findGame = await Banner.findOne({
      where: {
        id: slug,
      },
    });
    if (findGame) {
      let link;
      if (findGame.gameId) {
        link = `game_${findGame.gameId}`;
      } else if (findGame.gameId) {
        link = `parentGame_${findGame.parentGameId}`;
      } else if (findGame.supportId) {
        link = `support_${findGame.parentGameId}`;
      }

      res.json({ link, ...findGame.toJSON() });
    } else {
      throw new CustomError(404, TypeError.NOT_FOUND);
    }
  }
  async getListBanner(req, res) {
    const data = await Banner.findAll({
      order: [['order', 'DESC']],
      include: [
        { model: Game, attributes: ['slug'] },
        { model: ParentGame, attributes: ['slug'] },
        { model: Support, attributes: ['slug'] },
      ],
    });
    res.json(data);
  }
}

module.exports = new BannerController();
