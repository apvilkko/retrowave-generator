export default node => params => {
  Object.keys(params).forEach(key => {
    node.setParam(key, params[key]);
  });
};
