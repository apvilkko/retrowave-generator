import {rand} from '../utils';

// Oscillator with built-in second order drift
const create = ctx => {
  const osc = ctx.createOscillator();
  const drift = ctx.createOscillator();
  const driftGain = ctx.createGain();
  const driftDrift = ctx.createOscillator();
  const driftDriftGain = ctx.createGain();
  let detune = 0;

  drift.frequency.value = rand(5, 12);
  driftDrift.frequency.value = rand(1, 5);
  driftGain.gain.value = rand(0.5, 2);
  driftDriftGain.gain.value = rand(5, 20);
  drift.connect(driftGain);
  driftDrift.connect(driftDriftGain);
  driftDriftGain.connect(drift.frequency);
  driftGain.connect(osc.frequency);

  const setDetune = val => {
    detune = val;
  };

  const setOscType = val => {
    osc.type = val;
  };

  const setFreq = freq => {
    osc.frequency.value = freq + detune;
  };

  const start = () => {
    drift.start();
    driftDrift.start();
    osc.start();
  };

  setFreq(1);

  return {
    osc,
    drift,
    driftDrift,
    output: osc,

    start,
    setFreq,
    setDetune,
    setOscType,
  }
};

export default create;
