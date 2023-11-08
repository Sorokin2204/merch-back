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
const OrderGameInputRelation = db.orderGameInputRelation;
const GameInputOption = db.gameInputOption;
const TypePayment = db.typePayment;
const Comment = db.comment;
const ParentGame = db.parentGame;

class OrderController {
  async createOrder(req, res) {
    const { gameId, typePaymentId = null, packageList, gameInputList } = req.body;
    const createOrderId = await this.getCreatedOrderId({ gameId, typePaymentId, packageList, gameInputList, userId: res.locals.userData.id });
    res.json({ orderId: createOrderId });
  }
  async getCreatedOrderId({ gameId, typePaymentId = null, packageList, gameInputList, userId }) {
    const orderData = {
      status: 'wait',
      userId,
      gameId,
      ...(typePaymentId && { typePaymentId }),
    };
    const createOrder = await Order.create(orderData);

    const orderPackageData = packageList?.map((pack) => ({ status: 'wait', orderId: createOrder?.id, packageId: pack }));

    await OrderPackage.bulkCreate(orderPackageData);

    if (gameInputList?.length !== 0) {
      let orderGameInputData = gameInputList?.map((gameInput) => ({ gameInputId: gameInput.gameInputId, ...(gameInput?.type == 'select' ? { gameInputOptionId: gameInput.value, value: null } : { value: gameInput.value }) }));
      console.log(orderGameInputData);
      let existGameInputs = await findExistGameInputs({ orderGameInputData, userId, gameId });
      console.log(existGameInputs);
      if (existGameInputs) {
        existGameInputs = existGameInputs?.map((existGameInputId) => ({ orderGameInputId: existGameInputId, orderId: createOrder?.id }));
        console.log(existGameInputs);
        await OrderGameInputRelation.bulkCreate(existGameInputs);
      } else {
        for (let orderGameInput of orderGameInputData) {
          const createOrderGameInput = await OrderGameInput.create(orderGameInput);
          await OrderGameInputRelation.create({ orderGameInputId: createOrderGameInput.id, orderId: createOrder?.id });
        }
      }
    }
  }
  // async test(req, res) {
  //   try {
  //     const res2 = await axios.get('https://api.unisender.com/ru/api/getLists?format=json&api_key=6cc1citgcmb69bys7drtgj913fdtwqi5dzoue4fa');
  //     console.log(res2.data);
  //     // const response = await axios.get(
  //     //   encodeURI(
  //     //     `https://api.unisender.com/ru/api/sendEmail?format=json&api_key=6cc1citgcmb69bys7drtgj913fdtwqi5dzoue4fa&email=daniil.sorokin.228@gmail.com&sender_name=Donat.store&sender_email=Hi.donatstore@gmail.com&subject=Ссылкадлявхода&body=<div>Hello test message unisender</div>&lang=ru&list_id=1`,
  //     //   ),
  //     // );
  //     // console.log(response.data);
  //     res.json(true);
  //   } catch (error) {
  //     console.log(error);
  //   }
  // }

  async createPayment(req, res) {
    const { orderId, typePaymentId } = req.body;
    const findOrderSingle = await Order.findOne({
      where: { userId: res.locals.userData.id, id: orderId },
      include: [{ model: OrderPackage, include: Package }],
    });
    if (!findOrderSingle) {
      throw new CustomError(400);
    }
    const totalAmount = parseInt(
      findOrderSingle?.orderPackages
        ?.map((itemPack) => itemPack?.package.price)
        .reduce((accumulator, currentValue) => {
          return accumulator + currentValue;
        }, 0),
    );
    if (typePaymentId == null) {
      if (res.locals.userData.balance >= totalAmount) {
        const result = await db.sequelize.transaction(async (t) => {
          const updateBalance = parseInt(res.locals.userData.balance) - parseInt(totalAmount);
          await User.update(
            {
              balance: updateBalance,
            },
            {
              transaction: t,
              where: { id: res.locals.userData.id },
            },
          );
          await Order.update(
            { status: 'paid', saveGameInputs: true },
            {
              transaction: t,
              where: {
                id: orderId,
              },
            },
          );
          for (let orderPack of findOrderSingle?.orderPackages) {
            await OrderPackage.update(
              { status: 'paid', totalPrice: orderPack.package.price },
              {
                transaction: t,
                where: {
                  id: orderPack.id,
                },
              },
            );
          }
        });

        res.json({ success: true, type: 'balance' });
      } else {
        throw new CustomError(400);
      }
    } else {
      const findTypePayment = await TypePayment.findOne({ where: { id: typePaymentId } });
      if (!findTypePayment) {
        throw new CustomError(400);
      }

      let paymentUrl;
      if (findTypePayment?.variantPayment == 1) {
        paymentUrl = await getPaymentUrl({ amount: totalAmount, email: res.locals.userData.email, paymentId: findOrderSingle?.id, typePayment: findTypePayment?.innerId });
      } else {
        paymentUrl = await getPaymentUrlLava({ amount: totalAmount, orderId: findOrderSingle?.id, typePayment: findTypePayment?.innerId });
      }

      res.json({ type: 'card', success: true, url: paymentUrl });
    }
  }

  async createTopup(req, res) {
    const { typePaymentId, amount } = req.body;
    const findTypePayment = await TypePayment.findOne({ where: { id: typePaymentId } });
    if (!findTypePayment) {
      throw new CustomError(400);
    }
    let paymentUrl;
    if (findTypePayment?.variantPayment == 1) {
      paymentUrl = await getPaymentUrl({ amount, email: res.locals.userData.email, typePayment: findTypePayment?.innerId });
    } else {
      paymentUrl = await getPaymentUrlLava({ amount: amount, userId: res.locals.userData.id, typePayment: findTypePayment?.innerId });
    }

    res.json({ url: paymentUrl });
  }
  async getSaveGameInputs(req, res) {
    const { gameId } = req.query;
    let findOrderWithSaveGameInputs = await Game.findAll({
      ...(gameId && { where: { id: gameId } }),

      include: [
        {
          model: Order,
          where: { userId: res.locals.userData.id, saveGameInputs: true, status: { [Op.notIn]: ['wait', 'expired'] } },
          include: [{ model: OrderGameInput, include: [{ model: GameInput }, { model: GameInputOption }] }],
          attributes: ['id'],
        },
        { model: ParentGame, attributes: ['id', 'slug'] },
      ],
      attributes: ['name', 'slug', 'preview'],
      // include: [{ model: ParentGame, attributes: ['id', 'slug'] }],
    });

    findOrderWithSaveGameInputs = findOrderWithSaveGameInputs.map((el) => el.get({ plain: true }));
    findOrderWithSaveGameInputs = findOrderWithSaveGameInputs?.map((game) => {
      let ordersSort = game?.orders?.map((orderWithSaveGameInputs) => {
        if (orderWithSaveGameInputs.orderGameInputs?.length !== 0) {
          let sortGameInputs = [...orderWithSaveGameInputs?.orderGameInputs].sort((a, b) => a.gameInput?.order - b.gameInput?.order);

          return { ...orderWithSaveGameInputs, orderGameInputs: sortGameInputs };
        } else {
          return orderWithSaveGameInputs;
        }
      });
      ordersSort = ordersSort?.filter((order, index) => {
        const gameInputIds = order?.orderGameInputs?.map((orderGameInput) => orderGameInput?.id)?.join(',');
        return (
          ordersSort?.findIndex((item) => {
            const gameInputIdsItem = item?.orderGameInputs?.map((orderGameInput) => orderGameInput?.id)?.join(',');
            return gameInputIds == gameInputIdsItem;
          }) == index
        );
      });
      return {
        ...game,
        orders: ordersSort,
      };
    });

    res.json(findOrderWithSaveGameInputs);
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
      where: { userId: res.locals.userData.id, status: { [Op.not]: 'expired' } },
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
      where: { status: { [Op.or]: ['success', 'paid', 'incorrect', 'not-available', 'return'] } },
      include: [{ model: Game, attribute: ['preview', 'name'] }, { model: OrderPackage, include: Package }, { model: OrderGameInput, include: [{ model: GameInput }, { model: GameInputOption }] }, { model: TypePayment }, { model: User }],
    });
    res.json(findOrderList);
  }
  async changeTypePaymentOrder(req, res) {
    const { orderId, typePaymentId = null } = req.body;

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

const findExistGameInputs = async ({ gameId, userId, orderGameInputData }) => {
  let result;

  const findAllOrderGameInputs = await Game.findOne({
    where: { id: gameId },
    include: [
      {
        model: Order,
        where: { userId: userId },
        include: [
          {
            model: OrderGameInput,
            where: {
              [Op.or]: orderGameInputData,
            },
          },
        ],
        attributes: ['id'],
      },
    ],
    attributes: ['id'],
  });
  if (findAllOrderGameInputs?.orders) {
    for (let order of findAllOrderGameInputs.orders) {
      if (order?.orderGameInputs?.length == orderGameInputData?.length) {
        // result = orderGameInputData?.map(
        //   (itemGameInput) =>
        //     order?.orderGameInputs?.find((gameInput) => {
        //       Object.keys(itemGameInput).map((key) => {
        //         if (gameInput[key] != itemGameInput[key]) {
        //           return false;
        //         }
        //       });
        //       return true;
        //     })?.id || null,
        // );

        // result = result.filter((resultItem) => resultItem);

        result = order?.orderGameInputs?.map((itemGameInput) => itemGameInput.id);
        if (result?.length == orderGameInputData?.length) {
          return result;
        }
      }
    }
  }
  return false;
};

const getPaymentUrlLava = async ({ typePayment, amount, userId, orderId }) => {
  let includeServiceSingle;
  if (typePayment == '1') {
    includeServiceSingle = 'card';
  } else if (typePayment == '2') {
    includeServiceSingle = 'qiwi';
  } else if (typePayment == '3') {
    includeServiceSingle = 'sbp';
  }
  const body = {
    includeService: [includeServiceSingle],
    orderId: uuidv4(),
    shopId: '52f35990-cf15-49e0-8a8a-202c0f247b81',
    sum: amount,
    customFields: userId ? `userId=${userId}` : `orderId=${orderId}`,
  };
  const secretKey = '3550a9c781c00b6bbd444f1591a7e74d36aa1dfc';
  const signature = crypto.createHmac('sha256', secretKey).update(JSON.stringify(body)).digest('hex');

  const response = await axios.post('https://api.lava.ru/business/invoice/create', body, {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Signature: signature,
    },
  });

  console.log(response.data);
  return response.data?.data?.url;
};
module.exports = new OrderController();
