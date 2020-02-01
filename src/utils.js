export const rand = (min, max) =>
  min + Math.floor(Math.random() * (max - min + 1));
export const randFloat = (min, max) => min + Math.random() * (max - min);

export const randWeighted = (choices, weights) => {
  let sum = 0;
  const r = Math.random();
  for (let i = 0; i < choices.length; ++i) {
    sum += weights[i];
    if (r <= sum) return choices[i];
  }
};

export const sample = arr =>
  arr.length > 0 ? arr[rand(0, arr.length - 1)] : undefined;

export const shuffle = arr =>
  arr
    .map(a => [Math.random(), a])
    .sort((a, b) => a[0] - b[0])
    .map(a => a[1]);

export const sampleN = n => arr => {
  const shuffled = shuffle(arr);
  return shuffled.slice(0, n);
};
