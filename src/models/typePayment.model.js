module.exports = (sequelize, Sequelize) => {
  const TypePayment = sequelize.define('typePayment', {
    name: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    icon: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    comission: {
      type: Sequelize.FLOAT,
      allowNull: false,
    },
    order: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  });
  return TypePayment;
};
