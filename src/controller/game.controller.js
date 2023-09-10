const db = require('../models');
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');
const { CustomError, TypeError } = require('../models/customError.model');
const moment = require('moment/moment');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { currencyFormat } = require('../utils/currencyFormat');
const Game = db.game;
const ParentGame = db.parentGame;
const Package = db.package;
const GameInput = db.gameInput;
const GameInputOption = db.gameInputOption;

class GameController {
  async createGame(req, res) {
    const { name, fullName, preview, slug, shortDesc, iconValute, nameValute, textWarning, desc, instruction, advList, filterGameId, countryId, parentGameId, packages, isMomentDelivery } = req.body;
    const advListString = advList.join(',');
    let createData = {
      name,
      fullName,
      preview,
      slug,
      shortDesc,
      iconValute,
      nameValute,
      textWarning,
      desc,
      instruction,
      filterGameId,
      countryId,
      parentGameId,
      isMomentDelivery,
      advList: advListString,
      order: 0,
    };

    const createdGame = await Game.create(createData);

    let createDataPackage = packages?.map((pack) => ({ gameId: createdGame.id, ...pack }));
    await Package.bulkCreate(createDataPackage);
    res.json(true);
  }
  async updateSingleGame(req, res) {
    const { id, name, fullName, preview, slug, shortDesc, iconValute, nameValute, textWarning, desc, instruction, advList, filterGameId, countryId, parentGameId, packages, isMomentDelivery } = req.body;
    const findGame = await Game.findOne({
      where: {
        id,
      },
    });
    if (!findGame) {
      throw new CustomError(404, TypeError.NOT_FOUND);
    }
    const advListString = advList.join(',');
    let updateData = {
      name,
      fullName,
      preview,
      slug,
      shortDesc,
      iconValute,
      nameValute,
      textWarning,
      desc,
      instruction,
      filterGameId,
      countryId,
      parentGameId,
      isMomentDelivery,
      advList: advListString,
    };

    await Game.update(updateData, { where: { id } });

    await Package.bulkCreate(packages, { updateOnDuplicate: ['name', 'icon', 'price', 'discountPrice', 'disabled', 'deleted'] });
    res.json(true);
  }
  async getGameSingle(req, res) {
    const { slug } = req.params;
    const { client, parentSlug, byId } = req.query;

    let propName = 'slug';
    if (byId) {
      propName = 'id';
    }
    if (client) {
      let findParentBySlug;
      if (parentSlug) {
        findParentBySlug = await ParentGame.findOne({
          where: {
            [propName]: parentSlug,
          },
          attributes: ['id'],
        });
        if (!findParentBySlug) {
          throw new CustomError(404, TypeError.NOT_FOUND);
        }
      }
      let findGame = await Game.findOne({
        where: {
          [propName]: slug,
          ...(findParentBySlug && parentSlug && { parentGameId: findParentBySlug.id }),
        },
        include: [{ model: Package }, { model: GameInput, include: { model: GameInputOption } }, { model: ParentGame, attributes: ['slug', 'name'] }],
      });
      if (findGame) {
        findGame.advList = findGame.advList.split(',');
        res.json({ type: 'game', ...findGame.toJSON() });
      } else {
        let findParentGame = await ParentGame.findOne({
          where: {
            [propName]: slug,
          },
          include: Game,
        });
        if (findParentGame) {
          res.json({ type: 'parentGame', ...findParentGame.toJSON() });
        } else {
          throw new CustomError(404, TypeError.NOT_FOUND);
        }
      }
    } else {
      let findGame = await Game.findOne({
        where: {
          [propName]: slug,
        },
        include: Package,
      });
      if (findGame) {
        findGame.advList = findGame.advList.split(',');
        res.json(findGame);
      } else {
        throw new CustomError(404, TypeError.NOT_FOUND);
      }
    }
  }
  async getListGame(req, res) {
    const { client } = req.query;
    if (client) {
      let allGameList = [];
      const gameList = await Game.findAll({ where: { parentGameId: null }, raw: true });
      const parentGameList = await ParentGame.findAll({ raw: true });
      allGameList = [...gameList, ...parentGameList].sort((a, b) => a.order - b.order);
      res.json(allGameList);
    } else {
      const data = await Game.findAll();
      res.json(data);
    }
  }
}

module.exports = new GameController();
