import {all} from '../generator/instruments';
import compressor from '../audio-components/compressor';

const create = () => {
  const ctx = new (window.AudioContext || window.webkitAudioContext);

  const analyser = ctx.createAnalyser();
  analyser.connect(ctx.destination);

  const masterLimiter = compressor(ctx, {ratio: 20.0, knee: 0});
  masterLimiter.output.connect(analyser);

  const masterGain = ctx.createGain();
  masterGain.connect(masterLimiter.input);
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
    input: masterGain,
    tracks,
  };
};

export default create;
