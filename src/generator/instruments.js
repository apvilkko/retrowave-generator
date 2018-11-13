const BASS = 'BS';
const LEAD1 = 'LEAD1';
const LEAD2 = 'LEAD2';

const DRUMS = 'DR';
const BD = 'BD';
const SN = 'SN';
const HC = 'HC';
const TM = 'TM';
const PR = 'PR';
const CP = 'CP';
const ORCH = 'OR';

export const all = [BASS, DRUMS, LEAD1, LEAD2, ORCH];
export const CHILDREN = {
  [DRUMS]: [BD, SN, HC, TM, PR, CP]
};

export default {
  BASS,
  DRUMS,
  BD,
  SN,
  HC,
  TM,
  PR,
  CP,
  LEAD1,
  LEAD2,
  ORCH,
};
