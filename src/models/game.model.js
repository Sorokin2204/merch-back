module.exports = (sequelize, Sequelize) => {
  const Game = sequelize.define('game', {
    name: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    fullName: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    preview: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    slug: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    shortDesc: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    iconValute: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    nameValute: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    textWarning: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    desc: {
      type: Sequelize.TEXT('long'),
      allowNull: false,
    },
    instruction: {
      type: Sequelize.TEXT('long'),
      allowNull: false,
    },
    advList: {
      type: Sequelize.TEXT('long'),
      allowNull: false,
    },
    isMomentDelivery: {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
    order: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
  });
  return Game;
};
