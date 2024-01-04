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
    },
    {
      // don't add the timestamp attributes (updatedAt, createdAt)
      timestamps: false,

      // If don't want createdAt
      createdAt: false,

      // If don't want updatedAt
      updatedAt: false,

      // your other configuration here
    },
  );
  return Review;
};
