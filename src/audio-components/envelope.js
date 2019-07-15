// one third as time constant gets to 95% target
const timeConstantMult = 0.33;

const ads = (node, time, min, max, attack, decay, sustain) => {
  node.cancelScheduledValues(time);
  const minValue = min > 0 ? min : 0.0001;
  node.setValueAtTime(minValue, time);
  node.exponentialRampToValueAtTime(max, time + attack);
  node.setValueAtTime(max, time + attack);
  node.setTargetAtTime(
    sustain,
    time + attack,
    (attack + decay) * timeConstantMult
  );
};

const r = (node, time, release, min = 0) => {
  node.cancelScheduledValues(time);
  node.setTargetAtTime(min, time, release * timeConstantMult);
  node.setValueAtTime(min, time + release);
};

export { ads, r };
