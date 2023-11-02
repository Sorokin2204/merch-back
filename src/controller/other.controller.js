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
        await paymentOrderUser({ orderId: body.MERCHANT_ORDER_ID });
      } else {
        await topUpBalanceUser({ email: body.P_EMAIL, amount: body.AMOUNT });
      }

      res.json('YES');
    } else {
      throw new CustomError(400);
    }
  }

  async paymentSecond(req, res) {
    const secretKey = 'cb07e454e08ddf1f9033e1668de9d0e3e2b74032';

    let postDataSort = Object.keys(req.body)
      .sort()
      .reduce((obj, key) => {
        obj[key] = req.body[key];
        return obj;
      }, {});
    console.log(req.body);
    const signature = crypto.createHmac('sha256', secretKey).update(JSON.stringify(postDataSort)).digest('hex');

    if (signature == req.headers['authorization']) {
      const customFields = req.body.custom_fields.split('=');

      if (customFields[0] == 'userId') {
        await topUpBalanceUser({ userId: customFields[1], amount: body.amount });
        res.json('OK');
      } else if (customFields[0] == 'orderId') {
        await paymentOrderUser({ orderId: customFields[1] });
        res.json('OK');
      } else {
        throw new CustomError(400);
      }
    }
  }
}

async function topUpBalanceUser({ email, userId, amount }) {
  let condUser;

  if (email) {
    condUser = { email };
  } else {
    condUser = { id: userId };
  }

  const findUser = await User.findOne({ where: condUser });
  if (!findUser) {
    throw new CustomError(400);
  }
  const updateBalance = parseInt(findUser.balance) + parseInt(amount);
  await User.update(
    {
      balance: updateBalance,
    },
    { where: { id: findUser.id } },
  );
  await Transaction.create({ type: 2, sum: amount, userId: findUser?.id });
}

async function paymentOrderUser({ orderId }) {
  const findOrderSingle = await Order.findOne({
    where: { id: orderId },
    include: [{ model: OrderPackage, include: Package }],
  });
  if (!findOrderSingle) {
    throw new CustomError(400);
  }
  await Order.update(
    { status: 'paid', saveGameInputs: true },
    {
      where: {
        id: orderId,
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
