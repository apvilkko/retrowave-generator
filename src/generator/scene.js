import instruments, {all, CHILDREN} from './instruments';
import {sample, rand, randFloat, randWeighted} from '../utils';
import retrosynth from '../retrosynth';
import setParams from '../audio-components/setParams';
import sampler from '../audio-components/sampler';
import compressor from '../audio-components/compressor';
import reverb from '../audio-components/reverb';
import stereoDelay from '../audio-components/stereoDelay';
import catalog from './catalog';

const ROOT_NOTE = 36;
const {BASS, DRUMS, LEAD1} = instruments;

const styles = {
  [BASS]: [
    '16th', // single note 16ths
    // '16thOct', // like 16th but octave is changed
    // 'arp', // like 16th but variation in notes
    // 'offbeat', // 8th on the offbeat only
    // '8th', // single note 8ths
    // 'ifeellove', // note changes on 8th, 16ths
  ],
};


const quarter = 8;
const bar = quarter * 4;
const fourBars = bar * 4;
const eighth = quarter / 2;
const sixteenth = eighth / 2;
const octave = 12;

const AEOLIAN = [0, 2, 3, 5, 7, 8, 10];
const weights = [4, 0.5, 1.5, 1, 2, 0.5, 2];
const wSum = weights.reduce((a,b) => a+b);
const WEIGHTS = weights.map(x => x / wSum);

const CHORD_PRESETS = [
  [0, 0, -2, -4],
  [-4, -2, 0, 0],
];

const generators = {
  [BASS]: style => function* bassGenerator(scene) {
    let currentNote = 0;
    const patLength = fourBars;
    const pattern = Array.from({length: patLength}, () => null);
    while (true) {
      let note = {note: 'OFF'};
      const position = currentNote % patLength;
      if (pattern[position] === null) {
        if (currentNote % sixteenth === 0) {
          note = {
            note: ROOT_NOTE + scene.rootNoteOffset +
              scene.chords[Math.floor(position / bar) % scene.chords.length],
            velocity: scene.instruments[BASS].volume,
          };
        }
        pattern[position] = note;
      } else {
        note = pattern[position];
      }
      currentNote = yield note;
    }
  },
  [LEAD1]: style => function* bassGenerator(scene) {
    let currentNote = 0;
    const patLength = bar * 2;
    const pattern = Array.from({length: patLength}, () => null);
    while (true) {
      let note = {note: 'OFF'};
      if (pattern[currentNote % patLength] === null) {
        if (currentNote % sixteenth === 0 && rand(1, 100) > 50) {
          note = {
            note: ROOT_NOTE + rand(1, 2) * octave + scene.rootNoteOffset +
              randWeighted(AEOLIAN, WEIGHTS),
            velocity: scene.instruments[LEAD1].volume,
          };
        }
        pattern[currentNote % patLength] = note;
      } else {
        const index = currentNote % patLength;
        note = pattern[index];
      }
      currentNote = yield note;
    }
  },
  [DRUMS]: style => function* drumsGenerator(scene) {
    const children = CHILDREN[DRUMS]
      .map(child => generators[child](style)(scene));
    let currentNote = 0;
    currentNote = yield;
    while (true) {
      currentNote = yield children.map(child => child.next(currentNote).value);
    }
  },
  [instruments.BD]: style => function* bdGenerator(scene) {
    let currentNote = 0;
    const spec = scene.instruments[DRUMS].specs[instruments.BD];
    const common = {instrument: instruments.BD, note: spec.pitch};
    currentNote = yield;
    while (true) {
      if (currentNote % quarter === 0) {
        currentNote = yield ({
          ...common,
          velocity: spec.volume,
        });
      } else if ((currentNote + eighth) % fourBars === 0) {
        currentNote = yield ({
          ...common,
          velocity: spec.volume * 0.8,
        });
      }
      currentNote = yield;
    }
  },
  [instruments.SN]: style => function* bdGenerator(scene) {
    let currentNote = 0;
    const spec = scene.instruments[DRUMS].specs[instruments.SN];
    currentNote = yield;
    while (true) {
      if (currentNote % (2*quarter) === 8) {
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
    const spec = scene.instruments[DRUMS].specs[instruments.HC];
    currentNote = yield;
    while (true) {
      if (currentNote % sixteenth === 0) {
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

const getChoices = max => Array.from({length: max}, (_, i) => i + 1);

const randomizers = {
  [BASS]: () => {
    const style = sample(styles[BASS]);
    return {
      style,
      volume: 0.5,
    };
  },
  [LEAD1]: () => {
    return {
      volume: 0.55,
    };
  },
  [DRUMS]: () => {
    const specs = {};
    CHILDREN[DRUMS].forEach(child => {
      const max = catalog.samples[child];
      const choices = getChoices(max);
      specs[child] = {
        sample: sample(choices),
        volume: 0.6,
        pitch: randFloat(-3, 3)
      };
    });
    specs[instruments.HC].volume = randFloat(0.1, 0.2);
    specs[instruments.BD].volume = randFloat(0.95, 1.05);
    specs[instruments.SN].volume = randFloat(0.95, 1.05);
    const reverbImpulse = sample(getChoices(catalog.samples.impulse));
    return {
      specs,
      reverbImpulse,
      volume: 0.8,
    };
  },
};

const createInstrumentInstance = (context, instrument, specs) => {
  switch (instrument) {
    case BASS:
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
    case LEAD1:
      {
        const synth = retrosynth(context.mixer.ctx);
        setParams(synth)({
          oscType0: 'sawtooth',
          oscType1: 'sawtooth',
          oscDetune0: randFloat(1, 10),
          oscDetune1: randFloat(-10, -1),
          oscOn0: true,
          oscOn1: true,
          filterFreq: 1000,
          filterQ: 2,
          aEnvAttack: 0.010,
          aEnvRelease: 0.1,
          aEnvDecay: 0.1,
        });
        return synth;
      }
    case DRUMS:
      {
        const children = {};
        CHILDREN[DRUMS].forEach(child => {
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
    chords: sample(CHORD_PRESETS),
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
    const sends = [];
    if (instrument == LEAD1) {
      sends.push(stereoDelay(context.mixer.ctx, {
        delayL: 60 / scene.tempo / 2,
        delayR: 60 / scene.tempo / 4 * 3,
        filterFrequency: 4000,
        gain: 0.25,
        feedback: 0.7,
      }));
    }
    if (instrument === DRUMS) {
      const impulse = `impulse${scene.instruments[DRUMS].reverbImpulse}`;
      inserts.push(reverb(context.mixer.ctx, {
        impulse,
        dry: 1,
        wet: 0.15,
      }));
      inserts.push(compressor(context.mixer.ctx, {
        threshold: -10, ratio: 4, attack: 0.004, release: 0.100
      }));
    }
    for (let i = 0; i < inserts.length; ++i) {
      inserts[i].output.connect((i < inserts.length - 1) ? inserts[i+1].input : track.gain);
    }
    const instance = scene.instances[instrument];
    for (let i = 0; i < sends.length; ++i) {
      instance.output.connect(sends[i].input);
      sends[i].output.connect(track.gain);
    }
    const dest = inserts.length ? inserts[0].input : track.gain;
    if (instance.output) {
      instance.output.connect(dest);
    }
    if (instance.children) {
      Object.values(instance.children).forEach(child => {
        child.output.connect(dest)
      });
      track.gain.gain.value = scene.instruments[instrument].volume;
    }
    track.gain.connect(context.mixer.input);
  });

  return scene;
};

export {
  randomize
};
