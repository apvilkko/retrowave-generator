import retrosynth from './index';
const POLYPHONY = 3;

const oldest = (a, b) => {
  if (a.atTime < b.atTime) {
    return -1;
  }
  if (a.atTime > b.atTime) {
    return -1;
  }
  return 0;
}

const create = ctx => {
  const output = ctx.createGain();
  output.gain.value = 0.6;

  const POOL_SIZE = POLYPHONY * 2;
  const instances = Array.from({length: POOL_SIZE}).map(() => retrosynth(ctx));
  instances.map(x => x.output.connect(output));
  const tracker = Array.from({length: POOL_SIZE}).map(() => null);

  const getFreeIndex = () => {
    const found = tracker.findIndex(x => !x);
    if (found !== -1) {
      return found;
    }
    const sorted = [...tracker].sort(oldest);
    return sorted[0].index;
  };

  const noteOn = (note, atTime) => {
    const index = getFreeIndex();
    instances[index].noteOn(note, atTime);
    const data = {index, atTime, note};
    tracker[index] = data;
    return data;
  };

  const noteOff = (note, atTime) => {
    const found = Object.values(tracker)
      .find(x => (x && note && x.note.note === note.note));
    if (found) {
      instances[found.index].noteOff(atTime);
      tracker[found.index] = null;
    }
  };

  const setParam = (param, value, atTime) => {
    instances.map(x => x.setParam(param, value, atTime));
  };

  return {
    output,
    instances,

    noteOn,
    noteOff,
    setParam,
  };
};

export default create;
