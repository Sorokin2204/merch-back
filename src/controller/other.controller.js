const db = require('../models');
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');
const { CustomError, TypeError } = require('../models/customError.model');
const moment = require('moment/moment');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
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
const User = db.user;
const Transaction = db.transaction;
const Order = db.order;
const OrderPackage = db.orderPackage;

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

  async paymentFirst(req, res) {
    const body = req.body;
    console.log(body);
    const hashData = `${body.MERCHANT_ID}:${body.AMOUNT}:)8$6Fc33v}pRfQ*:${body.MERCHANT_ORDER_ID}`;
    const hash = crypto.createHash('md5').update(hashData).digest('hex');
    if (hash == body.SIGN) {
      if (body.MERCHANT_ORDER_ID) {
        const findOrderSingle = await Order.findOne({
          where: { id: body.MERCHANT_ORDER_ID },
          include: [{ model: OrderPackage, include: Package }],
        });
        if (!findOrderSingle) {
          throw new CustomError(400);
        }
        await Order.update(
          { status: 'paid', saveGameInputs: true },
          {
            where: {
              id: body.MERCHANT_ORDER_ID,
            },
          },
        );
        for (let orderPack of findOrderSingle?.orderPackages) {
          await OrderPackage.update(
            { status: 'paid', totalPrice: orderPack.package.price },
            {
              where: {
                id: orderPack.id,
              },
            },
          );
        }
      } else {
        const findUser = await User.findOne({ where: { email: body.P_EMAIL } });
        if (!findUser) {
          throw new CustomError(400);
        }
        const updateBalance = parseInt(findUser.balance) + parseInt(body.AMOUNT);
        await User.update(
          {
            balance: updateBalance,
          },
          { where: { id: findUser.id } },
        );
        await Transaction.create({ type: 2, sum: body.AMOUNT, userId: findUser?.id });
      }

      res.json('YES');
    } else {
      throw new CustomError(400);
    }
  }

  async paymentSecond(req, res) {
    console.log(req.headers);
    console.log(req.body);
    res.json(true);
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
