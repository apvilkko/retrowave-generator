const create = () => {
  return {
    playing: false,
    lastTickTime: 0,
    currentNote: 0,
    noteLength: 0.125 // 32th
  };
};

const pause = seq => {
  seq.playing = false;
};

const play = seq => {
  if (seq.playing) {
    return pause(seq);
  }
  seq.playing = true;
};

const reset = seq => {
  seq.currentNote = 0;
};

export { create as default, play, pause, reset };
