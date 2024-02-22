module.exports = (sequelize, Sequelize) => {
  const Review = sequelize.define(
    'review',
    {
      text: {
        type: Sequelize.TEXT('long'),
        allowNull: false,
      },
      author: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      date: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      link: {
        type: Sequelize.STRING,
        allowNull: false,
      },
    },
    {
      timestamps: false,

      createdAt: false,

      updatedAt: false,
    },
  );
  return Review;
};
