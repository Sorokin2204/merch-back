module.exports = (sequelize, Sequelize) => {
  const Order = sequelize.define(
    'order',
    {
      status: {
        type: Sequelize.STRING,
        allowNull: false,
      },
    },
    {
      initialAutoIncrement: 46439,
    },
  );
  return Order;
};
