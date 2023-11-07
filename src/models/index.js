const Sequelize = require('sequelize');
const reset = require('../setup');

const setupRelationship = require('../setupRelationship');
require('dotenv').config();

const config = {
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  pass: process.env.MYSQL_PASS,
  dbName: process.env.MYSQL_DB,
};

const sequelize = new Sequelize(config.dbName, config.user, config.pass, {
  host: config.host,
  dialect: 'mysql',
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  logging: false,
});

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

//MODELS
db.user = require('./user.model')(sequelize, Sequelize);
db.game = require('./game.model')(sequelize, Sequelize);
db.package = require('./package.model')(sequelize, Sequelize);
db.parentGame = require('./parentGame.model')(sequelize, Sequelize);
db.filterGame = require('./filterGame.model')(sequelize, Sequelize);
db.country = require('./country.model')(sequelize, Sequelize);
db.support = require('./support.model')(sequelize, Sequelize);
db.banner = require('./banner.model')(sequelize, Sequelize);
db.gameInput = require('./gameInput.model')(sequelize, Sequelize);
db.gameInputOption = require('./gameInputOption.model')(sequelize, Sequelize);
db.typePayment = require('./typePayment.model')(sequelize, Sequelize);
db.order = require('./order.model')(sequelize, Sequelize);
db.orderPackage = require('./orderPackage.model')(sequelize, Sequelize);
db.orderGameInput = require('./orderGameInput.model')(sequelize, Sequelize);
db.orderGameInputRelation = require('./orderGameInputRelation.model')(sequelize, Sequelize);
db.comment = require('./comment.model')(sequelize, Sequelize);
db.transaction = require('./transaction.model')(sequelize, Sequelize);

setupRelationship(db);

module.exports = db;
