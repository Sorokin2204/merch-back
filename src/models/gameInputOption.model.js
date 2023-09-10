module.exports = (sequelize, Sequelize) => {
  const GameInputOption = sequelize.define('gameInputOption', {
    label: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    value: {
      type: Sequelize.STRING,
      allowNull: false,
    },
  });
  return GameInputOption;
};
