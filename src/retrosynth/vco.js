import { randFloat } from "../utils";

const NORMALIZE = Math.log(10000);

// Oscillator with built-in second order drift
const create = ctx => {
  const osc = ctx.createOscillator();
  const drift = ctx.createOscillator();
  const driftGain = ctx.createGain();
  const driftDrift = ctx.createOscillator();
  const driftDriftGain = ctx.createGain();
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();

  let detune = 0;
  let started = false;

  const driftAmount = randFloat(0.2, 2);
  drift.frequency.value = randFloat(0.5, 5);
  driftDrift.frequency.value = randFloat(2, 5);
  driftGain.gain.value = 0;
  driftDriftGain.gain.value = randFloat(5, 20);
  drift.connect(driftGain);
  driftDrift.connect(driftDriftGain);
  driftDriftGain.connect(drift.frequency);
  driftGain.connect(osc.frequency);

  let lfoAmount = randFloat(3, 8);
  lfo.frequency.value = randFloat(6, 12);
  lfo.connect(lfoGain);
  lfoGain.gain.value = 0;
  lfoGain.connect(osc.frequency);

  const setDetune = val => {
    detune = val;
  };

  const setOscType = val => {
    osc.type = val;
  };

  const setLfoAmount = val => {
    lfoAmount = val;
  };

  const setFreq = (freq, time = 0) => {
    osc.frequency.setValueAtTime(freq, time);
    const driftG = (driftAmount * Math.log(freq)) / NORMALIZE;
    const lfoG = (lfoAmount * Math.log(freq)) / NORMALIZE;
    driftGain.gain.setValueAtTime(driftG, time);
    lfoGain.gain.setValueAtTime(lfoG, time);
  };

  const start = () => {
    drift.start();
    driftDrift.start();
    osc.start();
    lfo.start();
    started = true;
  };

  const stop = () => {
    if (!started) return;
    osc.stop();
    drift.stop();
    driftDrift.stop();
    lfo.stop();
    started = false;
  };

  setFreq(1);

  return {
    osc,
    drift,
    driftDrift,
    detune,
    output: osc,

    start,
    stop,
    setFreq,
    setDetune,
    setOscType,
    setLfoAmount
  };
};

export default create;
