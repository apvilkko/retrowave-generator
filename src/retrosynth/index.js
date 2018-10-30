import createVco from './vco';

const create = ctx => {
  const vcos = [createVco(ctx), createVco(ctx)];
  vcos.forEach(vco => vco.start());

  const vcas = [ctx.createGain(), ctx.createGain()];
  const maxGain = 0.5;

  const output = ctx.createGain();
  output.gain.value = 0.6;

  let fFrequency = 100;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.Q.value = 3;
  filter.frequency.value = fFrequency;
  filter.connect(output);

  let fEnvAttack = 0.05;
  let fEnvAmount = 1200;
  let fEnvRelease = 0.1;

  let aAttack = 0.003;
  let aRelease = 0.050;

  vcas.forEach(vca => {
    vca.gain.value = 0;
    vca.connect(filter);
  });

  for (let i = 0; i < vcos.length; ++i) {
    vcos[i].output.connect(vcas[i]);
  }

  const noteOn = (freq, atTime) => {
    const time = atTime || ctx.currentTime;
    // console.log('noteOn', time);
    vcos.forEach(vco => vco.setFreq(freq));
    vcas.forEach(vca => {
      vca.gain.cancelScheduledValues(time);
      vca.gain.linearRampToValueAtTime(maxGain, time + aAttack);
    });
    filter.frequency.cancelScheduledValues(time);
    filter.frequency.setValueAtTime(fFrequency, time);
    filter.frequency.linearRampToValueAtTime(fFrequency + fEnvAmount, time + fEnvAttack);
    filter.frequency.linearRampToValueAtTime(fFrequency, time + fEnvAttack + fEnvRelease);
  };

  const noteOff = atTime => {
    const time = atTime || ctx.currentTime;
    // console.log('noteOff', time);
    vcas.forEach(vca => {
      vca.gain.cancelScheduledValues(time);
      vca.gain.linearRampToValueAtTime(0, time + aRelease);
    });
  };

  const setParam = (param, value) => {
    let match;
    if (match = param.match(/detune(\d)/)) {
      vcos[match[1]].setDetune(value);
    }
    if (match = param.match(/osctype(\d)/)) {
      vcos[match[1]].setOscType(value);
    }
  };

  return {
    vcos,
    vcas,
    output,
    filter,

    noteOn,
    noteOff,
    setParam,
  };
}

export default create;
