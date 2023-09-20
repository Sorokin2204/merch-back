module.exports = (sequelize, Sequelize) => {
  const Transaction = sequelize.define('transaction', {
    type: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    sum: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
  });
  return Transaction;
};
