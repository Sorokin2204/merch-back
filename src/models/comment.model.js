module.exports = (sequelize, Sequelize) => {
  const Comment = sequelize.define('comment', {
    moderate: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    text: {
      type: Sequelize.TEXT('long'),
      allowNull: false,
    },
    like: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    answer: {
      type: Sequelize.TEXT('long'),
      allowNull: true,
    },
  });
  return Comment;
};
