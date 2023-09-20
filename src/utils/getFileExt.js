const getFileExt = (name) => {
  return /(?:\.([^.]+))?$/.exec(name)[1];
};
module.exports = getFileExt;
