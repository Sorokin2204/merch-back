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
    order: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  });
  return Support;
};
