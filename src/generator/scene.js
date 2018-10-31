import instruments, {all} from './instruments';
import {sample, rand} from '../utils';
import retrosynth from '../retrosynth';
import setParams from '../audio-components/setParams';

const styles = {
  [instruments.BASS]: [
    '16th', // single note 16ths
    // '16thOct', // like 16th but octave is changed
    // 'arp', // like 16th but variation in notes
    // 'offbeat', // 8th on the offbeat only
    // '8th', // single note 8ths
    // 'ifeellove', // note changes on 8th, 16ths
  ],
};

const generators = {
  [instruments.BASS]: style => function* bassGenerator() {
    let currentNote = 0;
    currentNote = yield;
    while (true) {
      if (currentNote % 2 === 0) {
        currentNote = yield ({note: 32});
      }
      currentNote = yield ({note: 'OFF'});
    }
  }
};

const randomizers = {
  [instruments.BASS]: () => {
    const style = sample(styles[instruments.BASS]);
    return {
      style,
    };
  }
};

const createInstrumentInstance = (context, instrument, specs) => {
  switch (instrument) {
    case instruments.BASS:
      {
        const synth = retrosynth(context.mixer.ctx);
        setParams(synth)({
          oscType0: 'sawtooth',
          oscOn0: true,
          oscOn1: false,
          filterFreq: 800,
          filterQ: 1,
          aEnvAttack: 0.005,
          aEnvRelease: 0.2,
          aEnvDecay: 0.2,
        })
        return synth;
      }
    default:
      break;
  }
};

const randomize = context => {
  const scene = {
    tempo: rand(100, 125),
    instruments: {},
    generators: {},
    instances: {},
  };
  all.forEach(instrument => {
    scene.instruments[instrument] = randomizers[instrument]();
    const style = scene.instruments[instrument].style;
    scene.generators[instrument] = generators[instrument](style)();
    scene.instances[instrument] = createInstrumentInstance(context, instrument,
      scene.instruments[instrument]);
    // TODO disconnect old before creating new
    const track = context.mixer.tracks[instrument];
    scene.instances[instrument].output.connect(track.gain);
    track.gain.connect(context.mixer.input);
  });

  return scene;
};

export {
  randomize
};
