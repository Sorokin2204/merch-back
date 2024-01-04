const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();
const db = require('./src/models');
const bodyParser = require('body-parser');
const moment = require('moment');
const mainRouter = require('./src/routes/main.routes');

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

app.use('/api', mainRouter);

app.use(function (req, res, next) {
  throw new CustomError(404, TypeError.PATH_NOT_FOUND);
});
app.use(handleError);

const PORT = process.env.PORT || 80;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});
