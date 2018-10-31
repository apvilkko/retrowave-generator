const BASS = 'BS';

const DRUMS = 'DR';
const BD = 'BD';
const SN = 'SN';
const HC = 'HC'

export const all = [BASS, DRUMS];
export const CHILDREN = {
  [DRUMS]: [BD, SN, HC]
};

export default {
  BASS,
  DRUMS,
  BD,
  SN,
  HC,
};
