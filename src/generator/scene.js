import instruments, {all} from './instruments';
import {sample, rand} from '../utils';
import retrosynth from '../retrosynth';

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
    while (true) {
      if (currentNote % 2 === 0) {
        currentNote = yield ({note: 'C-2'});
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
        synth.setParam('osctype0', 'sawtooth');
        synth.setParam('osctype1', 'sawtooth');
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
