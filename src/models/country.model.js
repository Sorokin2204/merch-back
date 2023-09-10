module.exports = (sequelize, Sequelize) => {
  const Country = sequelize.define('country', {
    name: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    icon: {
      type: Sequelize.STRING,
      allowNull: false,
    },
  });
  return Country;
};
