const BASS = 'BS';
const LEAD1 = 'LEAD1';

const DRUMS = 'DR';
const BD = 'BD';
const SN = 'SN';
const HC = 'HC';
const TM = 'TM';

export const all = [BASS, DRUMS, LEAD1];
export const CHILDREN = {
  [DRUMS]: [BD, SN, HC, TM]
};

export default {
  BASS,
  DRUMS,
  BD,
  SN,
  HC,
  TM,
  LEAD1,
};
