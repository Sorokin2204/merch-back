module.exports = (sequelize, Sequelize) => {
  const ParentGame = sequelize.define('parentGame', {
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
      type: Sequelize.TEXT('long'),
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
    isMomentDelivery: {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
    order: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  });
  return ParentGame;
};
