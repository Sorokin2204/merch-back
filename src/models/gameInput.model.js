module.exports = (sequelize, Sequelize) => {
  const GameInput = sequelize.define('gameInput', {
    label: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    slug: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    placeholder: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    type: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    rules: {
      type: Sequelize.TEXT('long'),
      allowNull: true,
    },
    mainInput: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    order: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  });
  return GameInput;
};
