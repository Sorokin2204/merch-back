module.exports = (sequelize, Sequelize) => {
  const Banner = sequelize.define('banner', {
    name: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    preview: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    order: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  });
  return Banner;
};
