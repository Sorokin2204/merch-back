module.exports = (sequelize, Sequelize) => {
  const Package = sequelize.define('package', {
    name: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    icon: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    price: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    discountPrice: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    disabled: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    deleted: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    order: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    innerId: {
      type: Sequelize.STRING,
      allowNull: true,
    },
  });
  return Package;
};
