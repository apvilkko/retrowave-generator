const BASS = 'BS';
const LEAD1 = 'LEAD1';

const DRUMS = 'DR';
const BD = 'BD';
const SN = 'SN';
const HC = 'HC'

export const all = [BASS, DRUMS, LEAD1];
export const CHILDREN = {
  [DRUMS]: [BD, SN, HC]
};

export default {
  BASS,
  DRUMS,
  BD,
  SN,
  HC,
  LEAD1,
};
