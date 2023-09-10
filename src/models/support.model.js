module.exports = (sequelize, Sequelize) => {
  const Support = sequelize.define('support', {
    name: {
      type: Sequelize.STRING,
      allowNull: false,
    },

    slug: {
      type: Sequelize.STRING,
      allowNull: false,
    },

    desc: {
      type: Sequelize.TEXT('long'),
      allowNull: false,
    },
  });
  return Support;
};
