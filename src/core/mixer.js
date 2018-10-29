const create = () => {
  const ctx = new (window.AudioContext || window.webkitAudioContext);

  const analyser = ctx.createAnalyser();
  analyser.connect(ctx.destination);

  const masterGain = ctx.createGain();
  masterGain.connect(analyser);
  masterGain.gain.value = 0.7;

  return {
    ctx,
    masterGain,
    analyser,
    input: analyser,
  };
};

export default create;
