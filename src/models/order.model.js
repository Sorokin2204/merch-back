module.exports = (sequelize, Sequelize) => {
  const Order = sequelize.define(
    'order',
    {
      status: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      saveGameInputs: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },

    {
      initialAutoIncrement: 46439,
    },
  );
  return Order;
};
