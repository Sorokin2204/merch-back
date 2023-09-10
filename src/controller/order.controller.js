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
const Package = db.package;
const OrderPackage = db.orderPackage;
const OrderGameInput = db.orderGameInput;
const GameInputOption = db.gameInputOption;
const TypePayment = db.typePayment;

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
    res.json(true);
  }
  async getOrderSingle(req, res) {
    const { id } = req.params;
    const findOrderSingle = await Order.findOne({
      where: { userId: res.locals.userData.id, id },
      include: [{ model: Game, attribute: ['preview', 'name'] }, { model: OrderPackage, include: Package }, { model: OrderGameInput, include: [{ model: GameInput }, { model: GameInputOption }] }, { model: TypePayment }],
    });
    res.json(findOrderSingle);
  }
  async getOrderList(req, res) {
    const findOrderList = await Order.findAll({
      where: { userId: res.locals.userData.id },
      include: [
        { model: Game, attribute: ['preview'] },
        { model: OrderPackage, include: Package },
      ],
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
}

module.exports = new OrderController();
