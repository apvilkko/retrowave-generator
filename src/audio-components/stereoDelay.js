const create = (ctx, {
  lDelay = 0.3, rDelay = 0.2, feedback = 0.6, filterFrequency = 2000, gain = 1.0
}) => {
  const output = ctx.createGain();
  output.gain.value = gain;
  const input = ctx.createGain();
  const delayL = ctx.createDelay(2);
  delayL.delayTime.value = lDelay;
  const delayR = ctx.createDelay(2);
  delayR.delayTime.value = rDelay;
  const filter = ctx.createBiquadFilter();
  filter.frequency.value = filterFrequency;
  const feedbackL = ctx.createGain();
  feedbackL.gain.value = feedback;
  const feedbackR = ctx.createGain();
  feedbackR.gain.value = feedback;
  const merger = ctx.createChannelMerger(2);

  input.connect(filter);
  filter.connect(delayL);
  filter.connect(delayR);
  delayL.connect(feedbackL);
  delayR.connect(feedbackR);
  feedbackL.connect(delayL);
  feedbackR.connect(delayR);
  delayL.connect(merger, 0, 0);
  delayR.connect(merger, 0, 1);
  merger.connect(output);

  return {
    input,
    output,
  };
};

export default create;
