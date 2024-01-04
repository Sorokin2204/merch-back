const setupRelationship = (db) => {
  db.product.hasMany(db.review);
  db.review.belongsTo(db.product);
};

module.exports = setupRelationship;
