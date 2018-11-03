const BASS = 'BS';
const LEAD1 = 'LEAD1';

const DRUMS = 'DR';
const BD = 'BD';
const SN = 'SN';
const HC = 'HC';
const TM = 'TM';
const PR = 'PR';

export const all = [BASS, DRUMS, LEAD1];
export const CHILDREN = {
  [DRUMS]: [BD, SN, HC, TM, PR]
};

export default {
  BASS,
  DRUMS,
  BD,
  SN,
  HC,
  TM,
  PR,
  LEAD1,
};
