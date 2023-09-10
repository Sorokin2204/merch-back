module.exports = (sequelize, Sequelize) => {
  const FilterGame = sequelize.define('filterGame', {
    name: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    slug: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    color: {
      type: Sequelize.STRING,
      allowNull: false,
    },

    icon: {
      type: Sequelize.STRING,
      allowNull: false,
    },
  });
  return FilterGame;
};
