const TUNING = 440;
const A4 = 69;

const noteToFreq = (note, detuneCents = 0) =>
  TUNING * Math.pow(2, (note - A4 + (detuneCents / 100.0)) / 12.0);

const getRateFromPitch = pitch => Math.pow(2, (pitch * 1.0) / 12);

export {
  noteToFreq,
  getRateFromPitch,
};
