import instruments, {all, CHILDREN} from './instruments';
import {sample, rand, randFloat} from '../utils';
import retrosynth from '../retrosynth';
import setParams from '../audio-components/setParams';
import sampler from '../audio-components/sampler';
import compressor from '../audio-components/compressor';
import catalog from './catalog';

const ROOT_NOTE = 36;

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
  [instruments.BASS]: style => function* bassGenerator(scene) {
    let currentNote = 0;
    currentNote = yield;
    while (true) {
      if (currentNote % 2 === 0) {
        currentNote = yield ({
          note: ROOT_NOTE + scene.rootNoteOffset,
          velocity: scene.instruments[instruments.BASS].volume,
        });
      }
      currentNote = yield ({note: 'OFF'});
    }
  },
  [instruments.DRUMS]: style => function* drumsGenerator(scene) {
    const children = CHILDREN[instruments.DRUMS]
      .map(child => generators[child](style)(scene));
    let currentNote = 0;
    currentNote = yield;
    while (true) {
      currentNote = yield children.map(child => child.next(currentNote).value);
    }
  },
  [instruments.BD]: style => function* bdGenerator(scene) {
    let currentNote = 0;
    const spec = scene.instruments[instruments.DRUMS].specs[instruments.BD];
    currentNote = yield;
    while (true) {
      if (currentNote % 8 === 0) {
        currentNote = yield ({
          note: spec.pitch,
          velocity: spec.volume,
          instrument: instruments.BD
        });
      }
      currentNote = yield;
    }
  },
  [instruments.SN]: style => function* bdGenerator(scene) {
    let currentNote = 0;
    const spec = scene.instruments[instruments.DRUMS].specs[instruments.SN];
    currentNote = yield;
    while (true) {
      if (currentNote % 16 === 8) {
        currentNote = yield ({
          note: spec.pitch,
          velocity: spec.volume,
          instrument: instruments.SN
        });
      }
      currentNote = yield;
    }
  },
  [instruments.HC]: style => function* bdGenerator(scene) {
    let currentNote = 0;
    const spec = scene.instruments[instruments.DRUMS].specs[instruments.HC];
    currentNote = yield;
    while (true) {
      if (currentNote % 2 === 0) {
        currentNote = yield ({
          note: spec.pitch,
          velocity: spec.volume,
          instrument: instruments.HC,
        });
      }
      currentNote = yield;
    }
  }
};

const randomizers = {
  [instruments.BASS]: () => {
    const style = sample(styles[instruments.BASS]);
    return {
      style,
      volume: 0.4,
    };
  },
  [instruments.DRUMS]: () => {
    const specs = {};
    CHILDREN[instruments.DRUMS].forEach(child => {
      const max = catalog.samples[child]
      const choices = Array.from({length: max}, (_, i) => i + 1);
      specs[child] = {
        sample: sample(choices),
        volume: 0.6,
        pitch: randFloat(-3, 3)
      };
    });
    specs[instruments.HC].volume = randFloat(0.1, 0.2);
    specs[instruments.BD].volume = randFloat(0.95, 1.05);
    specs[instruments.SN].volume = randFloat(0.95, 1.05);
    return {specs};
  },
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
          aEnvRelease: 0.1,
          aEnvDecay: 0.2,
        })
        return synth;
      }
    case instruments.DRUMS:
      {
        const children = {};
        CHILDREN[instruments.DRUMS].forEach(child => {
          children[child] = createInstrumentInstance(context, child, specs);
        });
        return {children};
      }
    case instruments.BD:
    case instruments.SN:
    case instruments.HC:
      {
        const sampleName = `${instrument}${specs.specs[instrument].sample}`;
        const synth = sampler(context.mixer.ctx, sampleName);
        return synth;
      }
    default:
      return {
        name: instrument,
      };
  }
};

const randomize = context => {
  const scene = {
    tempo: rand(100, 125),
    instruments: {},
    generators: {},
    instances: {},
    rootNoteOffset: rand(-3, 3),
  };
  all.forEach(instrument => {
    scene.instruments[instrument] = randomizers[instrument]();
    const style = scene.instruments[instrument].style;
    scene.generators[instrument] = generators[instrument](style)(scene);
    scene.instances[instrument] = createInstrumentInstance(context, instrument,
      scene.instruments[instrument]);
    // TODO disconnect old before creating new
    const track = context.mixer.tracks[instrument];
    const inserts = [];
    if (instrument === instruments.DRUMS) {
      inserts.push(compressor(context.mixer.ctx, {
        threshold: -8, ratio: 4, attack: 0.004, release: 0.040
      }));
    }
    if (inserts.length) {
      inserts[inserts.length - 1].output.connect(track.gain);
    }
    const instance = scene.instances[instrument];
    if (instance.output) {
      const input = inserts.length ? inserts[0].input : track.gain;
      instance.output.connect(input);
    }
    if (instance.children) {
      Object.values(instance.children).forEach(child => {
        child.output.connect(track.gain)
      });
    }
    track.gain.connect(context.mixer.input);
  });

  return scene;
};

export {
  randomize
};
