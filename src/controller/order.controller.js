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
    const { orderId } = req.body;

    const tokenHeader = req.headers['auth-token'];
    const tokenData = jwt.verify(tokenHeader, process.env.SECRET_TOKEN, (err, tokenData) => {
      if (err) {
        throw new CustomError(400);
      }
      return tokenData;
    });
    const findOrderSingle = await Order.findOne({
      where: { userId: res.locals.userData.id, id: orderId },
      include: [{ model: OrderPackage, include: Package }],
    });
    const totalAmount = findOrderSingle?.orderPackages
      ?.map((itemPack) => itemPack?.package.price)
      .reduce((accumulator, currentValue) => {
        return accumulator + currentValue;
      }, 0);
    console.log({ amount: totalAmount, orderId, userId: tokenData?.id });
    res.json(true);
    // try {
    //   const url = await createPaymentUrl({amount: totalAmount, orderId, userId: tokenData?.id });
    //   res.json({ url });
    // } catch (error) {
    //   throw new CustomError(400);
    // }
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
    const { orderId, userId } = req.body;
    const findOrderSingle = await Order.findOne({
      where: { userId, id: orderId },
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
          userId,
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
    res.json({ success: true });
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

module.exports = new OrderController();
