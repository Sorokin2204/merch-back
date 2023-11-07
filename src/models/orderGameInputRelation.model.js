module.exports = (sequelize, Sequelize) => {
  const OrderGameInputRelation = sequelize.define('orderGameInputRelation', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
  });
  return OrderGameInputRelation;
};
