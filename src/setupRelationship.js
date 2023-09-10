const setupRelationship = (db) => {
  db.country.hasMany(db.game);
  db.game.belongsTo(db.country);

  db.filterGame.hasMany(db.game);
  db.game.belongsTo(db.filterGame);

  db.parentGame.hasMany(db.game);
  db.game.belongsTo(db.parentGame);

  db.game.hasMany(db.package);
  db.package.belongsTo(db.game);

  db.country.hasMany(db.parentGame);
  db.parentGame.belongsTo(db.country);

  db.filterGame.hasMany(db.parentGame);
  db.parentGame.belongsTo(db.filterGame);

  db.parentGame.hasMany(db.banner);
  db.banner.belongsTo(db.parentGame);

  db.game.hasMany(db.banner);
  db.banner.belongsTo(db.game);

  db.support.hasMany(db.banner);
  db.banner.belongsTo(db.support);

  db.game.hasMany(db.gameInput);
  db.gameInput.belongsTo(db.game);

  db.game.hasMany(db.gameInput);
  db.gameInput.belongsTo(db.game);

  db.gameInput.hasMany(db.gameInputOption);
  db.gameInputOption.belongsTo(db.gameInput);

  db.game.hasMany(db.order);
  db.order.belongsTo(db.game);

  db.user.hasMany(db.order);
  db.order.belongsTo(db.user);

  db.order.hasMany(db.orderPackage);
  db.orderPackage.belongsTo(db.order);

  db.typePayment.hasMany(db.order);
  db.order.belongsTo(db.typePayment);

  db.package.hasMany(db.orderPackage);
  db.orderPackage.belongsTo(db.package);

  db.order.hasMany(db.orderGameInput);
  db.orderGameInput.belongsTo(db.order);

  db.gameInput.hasMany(db.orderGameInput);
  db.orderGameInput.belongsTo(db.gameInput);

  db.gameInputOption.hasMany(db.orderGameInput);
  db.orderGameInput.belongsTo(db.gameInputOption);

  db.game.hasMany(db.comment);
  db.comment.belongsTo(db.game);

  db.user.hasMany(db.comment);
  db.comment.belongsTo(db.user);
};

module.exports = setupRelationship;
