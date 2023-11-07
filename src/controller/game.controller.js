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
const Comment = db.comment;
const Order = db.order;

class GameController {
  async createGame(req, res) {
    const { name, fullName, preview, slug, shortDesc, iconValute, nameValute, textWarning, desc, instruction, advList, filterGameId, countryId, parentGameId, packages, isMomentDelivery, whereImage } = req.body;
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
      whereImage,
      advList: advListString,
      order: 0,
    };

    const createdGame = await Game.create(createData);
    if (packages?.length !== 0) {
      let createDataPackage = packages?.map((pack) => ({ gameId: createdGame.id, ...pack, id: undefined }));
      await Package.bulkCreate(createDataPackage);
    }

    res.json(true);
  }
  async updateSingleGame(req, res) {
    const { id, name, fullName, preview, slug, shortDesc, iconValute, nameValute, textWarning, desc, instruction, advList, filterGameId, countryId, parentGameId, packages, isMomentDelivery, whereImage } = req.body;
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
      whereImage,
      advList: advListString,
    };

    await Game.update(updateData, { where: { id } });
    let packagesUpdate = packages?.map((pack) => ({ ...pack, id: pack?.packId }));
    await Package.bulkCreate(packagesUpdate, { updateOnDuplicate: ['name', 'icon', 'price', 'discountPrice', 'disabled', 'deleted'] });

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
        console.log(findParentBySlug);
        if (!findParentBySlug) {
          throw new CustomError(404, TypeError.NOT_FOUND);
        }
      }
      let findGame = await Game.findOne({
        where: {
          [propName]: slug,
          ...(findParentBySlug && parentSlug ? { parentGameId: findParentBySlug.id } : { parentGameId: null }),
        },
        order: [
          [GameInput, 'order', 'ASC'],
          [Package, 'order', 'DESC'],
        ],
        include: [
          { model: Package, where: { deleted: false }, required: false },
          { model: GameInput, include: { model: GameInputOption } },
          { model: ParentGame, attributes: ['slug', 'name'] },
          { model: Order, attributes: ['id'], include: [{ model: Comment, where: { moderate: true }, required: false, attributes: ['like'] }] },
        ],
      });
      const comments = findGame?.orders?.filter((com) => com.comment)?.map((com) => com.comment.like);
      const rating = calcRating(comments?.filter((com) => !com)?.length, comments?.filter((com) => com)?.length);
      const commentsCount = comments?.length;
      if (findGame) {
        findGame.advList = findGame.advList.split(',');
        res.json({ type: 'game', ...findGame.toJSON(), orders: undefined, commentsCount, rating });
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
        include: { model: Package, order: [['order', 'DESC']], where: { deleted: false }, required: false },
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
      const data = await Game.findAll({ order: [['order', 'DESC']] });
      res.json(data);
    }
  }
}

function calcRating(like, dislike) {
  let stars = [like, 0, 0, 0, dislike],
    count = 0,
    sum = stars.reduce(function (sum, item, index) {
      count += item;
      return sum + item * (index + 1);
    }, 0);
  return sum / count;
}

module.exports = new GameController();
