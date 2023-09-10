module.exports = (sequelize, Sequelize) => {
  const OrderPackage = sequelize.define('orderPackage', {
    status: {
      type: Sequelize.STRING,
      allowNull: false,
    },
  });
  return OrderPackage;
};
