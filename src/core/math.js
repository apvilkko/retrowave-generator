const TUNING = 440;
const A4 = 69;

const noteToFreq = (note, detuneCents = 0) =>
  TUNING * Math.pow(2, (note - A4 + (detuneCents / 100.0)) / 12.0);

export {
  noteToFreq,
};
