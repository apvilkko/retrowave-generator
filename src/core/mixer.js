import {all} from '../generator/instruments';

const create = () => {
  const ctx = new (window.AudioContext || window.webkitAudioContext);

  const analyser = ctx.createAnalyser();
  analyser.connect(ctx.destination);

  const masterGain = ctx.createGain();
  masterGain.connect(analyser);
  masterGain.gain.value = 0.7;

  const tracks = {};
  all.forEach(instrument => {
    const gain = ctx.createGain();
    gain.value = 0.7;
    tracks[instrument] = {
      gain,
    };
  });

  return {
    ctx,
    masterGain,
    analyser,
    input: analyser,
    tracks,
  };
};

export default create;
