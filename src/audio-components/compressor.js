const create = (ctx, {
  threshold = -3, ratio = 2.0, attack = 0.005, release = 0.050, knee = 6
}) => {
  const compressor = ctx.createDynamicsCompressor();
  compressor.threshold.value = threshold;
  compressor.knee.value = knee;
  compressor.ratio.value = ratio;
  compressor.attack.value = attack;
  compressor.release.value = release;

  const input = compressor;
  const output = compressor;

  return {
    input,
    output,
  }
};

export default create;
