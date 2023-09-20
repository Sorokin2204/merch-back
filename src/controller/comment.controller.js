const db = require('../models');
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');
const { CustomError, TypeError } = require('../models/customError.model');
const moment = require('moment/moment');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { currencyFormat } = require('../utils/currencyFormat');
const Comment = db.comment;
const Game = db.game;
const Order = db.order;
const User = db.user;
const Transaction = db.transaction;

class CommentController {
  async createComment(req, res) {
    const { text, like, orderId } = req.body;

    const findOrderUser = await Order.findOne({
      where: {
        id: orderId,
        userId: res.locals.userData.id,
        status: { [Op.not]: 'wait' },
      },
      include: [{ model: Comment, include: Transaction }],
    });
    console.log(findOrderUser);
    if (!findOrderUser || findOrderUser?.comment) {
      throw new CustomError(400, TypeError.COMMENT_EXIST);
    }

    const createComment = await Comment.create({ text, like, orderId, userId: res.locals.userData.id });
    await Transaction.create({ type: 1, sum: 5, userId: res.locals.userData.id, commentId: createComment.id });
    let updateBalance = parseInt(res.locals.userData.balance) + 5;
    await User.update(
      { balance: updateBalance },
      {
        where: {
          id: res.locals.userData.id,
        },
      },
    );
    res.json({ success: true });
  }
  async updateComment(req, res) {
    const { commentId, answer, moderate } = req.body;
    console.log(moderate);
    await Comment.update(
      {
        answer,
        moderate,
      },
      {
        where: {
          id: commentId,
        },
      },
    );
    res.json(true);
  }
  async getCommentList(req, res) {
    const commentList = await Comment.findAll({
      where: {
        moderate: true,
      },
      order: [['createdAt', 'DESC']],
      include: [{ model: Order, include: Game }, { model: User }],
    });

    res.json(commentList);
  }
  async getCommentListAdmin(req, res) {
    const commentList = await Comment.findAll({
      include: [{ model: Order, include: Game }, { model: User }],
      order: [['createdAt', 'DESC']],
    });

    res.json(commentList);
  }
}

module.exports = new CommentController();
