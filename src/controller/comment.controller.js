const db = require('../models');
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');
const { CustomError, TypeError } = require('../models/customError.model');
const moment = require('moment/moment');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { currencyFormat } = require('../utils/currencyFormat');
const Comment = db.comment;

class CommentController {
  async createComment(req, res) {
    const { text, like, gameId } = req.body;
    await Comment.create({ text, like, gameId, userId: res.locals.userData.id });
    res.json({ success: true });
  }

  async getCommentList(req, res) {
    const commentList = await Comment.findAll({
      where: {
        moderate: true,
      },
      include: [{ model: Game }, { model: User }],
    });

    res.json(commentList);
  }
}

module.exports = new CommentController();
