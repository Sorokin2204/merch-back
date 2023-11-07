const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();
const db = require('./src/models');
const bodyParser = require('body-parser');
const moment = require('moment');
const userRouter = require('./src/routes/user.routes');
const gameRouter = require('./src/routes/game.routes');
const otherRouter = require('./src/routes/other.routes');
const orderRouter = require('./src/routes/order.routes');
const parentGameRouter = require('./src/routes/parentGame.routes');
const supportRouter = require('./src/routes/support.routes');
const commentRouter = require('./src/routes/comment.routes');
const bannerRouter = require('./src/routes/banner.routes');

const reset = require('./src/setup');
const { handleError } = require('./src/middleware/customError');
const { CustomError, TypeError } = require('./src/models/customError.model');
const fileUpload = require('express-fileupload');
require('dotenv').config();

const cron = require('node-cron');
const { Op } = require('sequelize');

var corsOptions = {
  origin: '*',
};
app.use(
  fileUpload({
    createParentPath: true,
  }),
);

app.use(cors(corsOptions));
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/files', express.static('./public/files'));
app.use(express.json());

app.use(express.urlencoded({ extended: true }));

db.sequelize.sync({ alter: true }).then((se) => {
  reset(db);
});

app.use('/api', userRouter);
app.use('/api/game', gameRouter);
app.use('/api/parent-game', parentGameRouter);
app.use('/api/support', supportRouter);
app.use('/api/banner', bannerRouter);
app.use('/api/order', orderRouter);
app.use('/api/comment', commentRouter);
app.use('/api', otherRouter);

cron.schedule('0 */2 * * * *', async () => {
  try {
    await db.order.update(
      {
        status: 'expired',
      },
      {
        where: { status: 'wait', createdAt: { [Op.lt]: moment().subtract(1, 'd').toDate() } },
      },
    );
  } catch (error) {
    console.log(error);
  }
});

app.use(function (req, res, next) {
  throw new CustomError(404, TypeError.PATH_NOT_FOUND);
});
app.use(handleError);

const PORT = process.env.PORT || 80;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});
