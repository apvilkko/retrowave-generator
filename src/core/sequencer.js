const create = () => {
  return {
    playing: false,
    lastTickTime: 0,
    currentNote: 0,
    noteLength: 0.125, // 32th
  };
};

const play = seq => {
  seq.playing = true;
}

export {
  create as default,
  play,
};
