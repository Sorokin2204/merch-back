const db = require('../models');
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');
const { CustomError, TypeError } = require('../models/customError.model');
const moment = require('moment/moment');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { currencyFormat } = require('../utils/currencyFormat');
const { packageParser } = require('../utils/packageParser');
const { default: axios } = require('axios');
const fs = require('fs');
var FormData = require('form-data');
const getFileExt = require('../utils/getFileExt');
// var FormData = require('file');
const FilterGame = db.filterGame;
const Country = db.country;
const TypePayment = db.typePayment;
const Game = db.game;
const ParentGame = db.parentGame;
const Package = db.package;

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

  async startParser(req, res) {
    const gameList = await Game.findAll({
      include: [{ model: ParentGame }],
    });
    for (let game of gameList) {
      let gameUrl = `https://donatov.net/${game?.parentGameId ? `${game?.parentGame?.slug}/${game?.slug}` : game?.slug}`;
      const currentPackList = await packageParser(gameUrl);
      let orderPack = 0;
      for (let { imageFull, imageName, name, price, disabled, priceDiscount, order } of currentPackList) {
        const findPack = await Package.findOne({
          where: {
            innerId: imageName,
            gameId: game.id,
          },
        });
        if (findPack) {
          await Package.update(
            { name, price, discountPrice: priceDiscount, disabled, order: orderPack },
            {
              where: {
                id: findPack.id,
              },
            },
          );
        } else {
          const iconPack = await uploadImage(imageFull);
          await Package.create({ icon: iconPack, name, price, discountPrice: priceDiscount, innerId: imageName, gameId: game.id, disabled, order: orderPack });
        }
        orderPack++;
      }
    }
    res.json({ success: true });
  }
}

async function uploadImage(url) {
  const ext = getFileExt(url);
  const downloadFile = await axios.get(url, { responseType: 'arraybuffer' });
  const newUuid = uuidv4();
  const fileName = `${newUuid}.${ext}`;
  fs.writeFileSync(`./public/files/${fileName}`, downloadFile.data);
  return fileName;
}

module.exports = new OtherController();
