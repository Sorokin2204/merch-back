const db = require('../models');
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');
const { CustomError, TypeError } = require('../models/customError.model');
const moment = require('moment/moment');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const generator = require('generate-password');
const mailService = require('../services/mail-service');
const { currencyFormat } = require('../utils/currencyFormat');
const randomIntFromInterval = require('../utils/randomIntFromInterval');
const { default: axios } = require('axios');
const crypto = require('crypto');
const Order = db.order;
const Game = db.game;
const GameInput = db.gameInput;
const User = db.user;
const Package = db.package;
const OrderPackage = db.orderPackage;
const OrderGameInput = db.orderGameInput;
const GameInputOption = db.gameInputOption;
const TypePayment = db.typePayment;
const Comment = db.comment;

class OrderController {
  async createOrder(req, res) {
    const { gameId, typePaymentId, packageList, gameInputList } = req.body;
    const orderData = {
      status: 'wait',
      userId: res.locals.userData.id,
      gameId,
      typePaymentId,
    };
    const createOrder = await Order.create(orderData);

    const orderPackageData = packageList?.map((pack) => ({ status: 'wait', orderId: createOrder?.id, packageId: pack }));

    await OrderPackage.bulkCreate(orderPackageData);

    if (gameInputList?.length !== 0) {
      const orderGameInputData = gameInputList?.map((gameInput) => ({ gameInputId: gameInput.gameInputId, ...(gameInput?.type == 'select' ? { gameInputOptionId: gameInput.value, value: null } : { value: gameInput.value }), orderId: createOrder?.id }));
      await OrderGameInput.bulkCreate(orderGameInputData);
    }
    res.json({ orderId: createOrder.id });
  }
  async createPayment(req, res) {
    const { orderId, typePaymentId } = req.body;
    const findTypePayment = await TypePayment.findOne({ where: { id: typePaymentId } });
    if (!findTypePayment) {
      throw new CustomError(400);
    }
    const findOrderSingle = await Order.findOne({
      where: { userId: res.locals.userData.id, id: orderId },
      include: [{ model: OrderPackage, include: Package }],
    });
    const totalAmount = findOrderSingle?.orderPackages
      ?.map((itemPack) => itemPack?.package.price)
      .reduce((accumulator, currentValue) => {
        return accumulator + currentValue;
      }, 0);
    const paymentUrl = await getPaymentUrl({ amount: totalAmount, email: res.locals.userData.email, paymentId: findOrderSingle?.id, typePayment: findTypePayment?.innerId });

    res.json({ url: paymentUrl });
  }
  async createTopup(req, res) {
    const { typePaymentId, amount } = req.body;
    const findTypePayment = await TypePayment.findOne({ where: { id: typePaymentId } });
    if (!findTypePayment) {
      throw new CustomError(400);
    }

    const paymentUrl = await getPaymentUrl({ amount, email: res.locals.userData.email, typePayment: findTypePayment?.innerId });
    res.json({ url: paymentUrl });
  }
  async getSaveGameInputs(req, res) {
    const { gameId } = req.query;
    const findOrderWithSaveGameInputs = await Game.findAll({
      ...(gameId && { where: { id: gameId } }),
      include: { model: Order, where: { userId: res.locals.userData.id, saveGameInputs: true, status: { [Op.not]: 'wait' } }, include: [{ model: OrderGameInput, include: [{ model: GameInput }, { model: GameInputOption }] }], attributes: ['id'] },
      attributes: ['name', 'slug', 'preview'],
    });

    res.json(findOrderWithSaveGameInputs);
  }

  async processPaymentText(req, res) {
    const body = {
      MERCHANT_ID: '41111',
      AMOUNT: '100',
      intid: '108339384',
      MERCHANT_ORDER_ID: '',
      P_EMAIL: 'danila220096@gmail.com',
      P_PHONE: '',
      CUR_ID: '36',
      payer_account: '220024******3159',
      commission: '0',
      SIGN: '5c3bf3a5122dcc21d7a1461c88fcf04e',
    };
    const hashData = `${body.MERCHANT_ID}:${body.AMOUNT}:)8$6Fc33v}pRfQ*:${body.MERCHANT_ORDER_ID}`;
    const hash = crypto.createHash('md5').update(hashData).digest('hex');
    console.log(hash);
    if (hash == body.SIGN) {
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

      res.json('YES');
    } else {
      throw new CustomError(400);
    }
  }
  async processPayment(req, res) {
    let test = crypto
      .createHmac('sha256', 'd58604dba974bf7dd3eca910eb3b74cc0b831b3f')
      .update(
        JSON.stringify(
          Object.keys(req.body)
            .sort()
            .reduce((obj, key) => {
              obj[key] = req.body[key];
              return obj;
            }, {}),
        ),
      )
      .digest('hex');

    if (test == req.headers['x-api-sha256-signature']) {
      const { status, custom_fields, amount } = req.body;
      let customField = custom_fields;
      let userId = customField.userId;
      let orderId = customField.orderId;
      if (!req.headers['x-api-sha256-signature'] || req.headers['user-agent'] !== 'enot/1.0') {
        throw new CustomError(400);
      }
      if (status === 'success') {
        const findOrderSingle = await Order.findOne({
          where: { userId, id: orderId },
          include: [{ model: OrderPackage, include: Package }],
        });

        await Order.update(
          { status: 'paid' },
          {
            where: {
              id: orderId,
            },
          },
        );
        for (let orderPack of findOrderSingle?.orderPackages) {
          await OrderPackage.update(
            { status: 'paid', total: orderPack.package.price },
            {
              where: {
                id: orderPack.id,
              },
            },
          );
        }

        res.send('OK');
      } else {
        console.error('NOT SUCCESS PAYMENT');
        console.error(req.body);
        throw new CustomError(400);
      }
    } else {
      throw new CustomError(400);
    }
  }
  async getOrderSingle(req, res) {
    const { id } = req.params;

    const findOrderSingle = await Order.findOne({
      where: { userId: res.locals.userData.id, id },
      include: [{ model: Comment }, { model: Game, attribute: ['preview', 'name'] }, { model: OrderPackage, include: Package }, { model: OrderGameInput, include: [{ model: GameInput }, { model: GameInputOption }] }, { model: TypePayment }],
    });
    res.json(findOrderSingle);
  }
  async updateOrder(req, res) {
    const { orderId, status, orderPackages } = req.body;
    await Order.update(
      { status },
      {
        where: {
          id: orderId,
        },
      },
    );
    for (let orderPack of orderPackages) {
      await OrderPackage.update(
        { status: orderPack.status },
        {
          where: { orderId, id: orderPack.id },
        },
      );
    }
    res.json({ success: true });
  }
  async getOrderList(req, res) {
    const findOrderList = await Order.findAll({
      order: [['createdAt', 'DESC']],
      where: { userId: res.locals.userData.id },
      include: [
        { model: Game, attribute: ['preview'] },
        { model: OrderPackage, include: Package },
        { model: OrderGameInput, include: GameInput },
      ],
    });
    res.json(findOrderList);
  }
  async getOrderListAdmin(req, res) {
    const findOrderList = await Order.findAll({
      order: [['createdAt', 'DESC']],
      where: { status: { [Op.or]: ['success', 'paid'] } },
      include: [{ model: Game, attribute: ['preview', 'name'] }, { model: OrderPackage, include: Package }, { model: OrderGameInput, include: [{ model: GameInput }, { model: GameInputOption }] }, { model: TypePayment }, { model: User }],
    });
    res.json(findOrderList);
  }
  async changeTypePaymentOrder(req, res) {
    const { orderId, typePaymentId } = req.body;

    await Order.update(
      { typePaymentId },
      {
        where: {
          id: orderId,
          userId: res.locals.userData.id,
        },
      },
    );
    res.json({ success: true });
  }

  async removeSaveGameInput(req, res) {
    const { orderId } = req.body;
    await Order.update(
      { saveGameInputs: false },
      {
        where: {
          id: orderId,
          userId: res.locals.userData.id,
        },
      },
    );
    res.json({ success: true });
  }
}
const getPaymentUrl = async ({ typePayment, amount, email, paymentId = null }) => {
  let postData = {
    shopId: 41111,
    nonce: new Date().getTime(),
    i: typePayment,
    amount,
    currency: 'RUB',
    ip: '37.214.70.101',
    email,
    ...(paymentId && { paymentId }),
  };
  let postDataSort = Object.keys(postData)
    .sort()
    .reduce((obj, key) => {
      obj[key] = postData[key];
      return obj;
    }, {});

  let signature = Object.keys(postDataSort)
    .map((key) => postDataSort[key])
    .join('|');
  let signatureSha = crypto.createHmac('sha256', 'a525f3ed29f2b5f71ce31efff199a5e2').update(signature).digest('hex');
  postData['signature'] = signatureSha;
  const paymentResponse = await axios.post('https://api.freekassa.ru/v1/orders/create', postData);
  console.log(paymentResponse.data);
  return paymentResponse.data?.location;
};
module.exports = new OrderController();
