module.exports = (sequelize, Sequelize) => {
  const OrderGameInput = sequelize.define('orderGameInput', {
    value: {
      type: Sequelize.STRING,
      allowNull: true,
    },
  });
  return OrderGameInput;
};
