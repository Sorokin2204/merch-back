module.exports = (sequelize, Sequelize) => {
  const OrderPackage = sequelize.define('orderPackage', {
    status: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    totalPrice: {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: null,
    },
  });
  return OrderPackage;
};
