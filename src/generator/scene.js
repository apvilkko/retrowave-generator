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
    '16thOct', // like 16th but octave is changed
    // 'arp', // like 16th but variation in notes
    'offbeat', // 8th on the offbeat only
    '8th', // single note 8ths
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
  [0, 0, 5, 7],
  [0, 0, -4, 7],
  [-4, 5, 0, -2],
  [0, 0, -4, 5],
];

const createArray = length => Array.from({length}, () => null);

const createPatternGenerator = (patLength, pre, noteGetter) => style => function* patternGenerator(scene) {
  let currentNote = 0;
  const pattern = createArray(patLength);
  const data = pre({style, scene});
  while (true) {
    let note;
    const position = currentNote % patLength;
    if (pattern[position] === null) {
      note = noteGetter({currentNote, position, patLength, pattern, scene, style, data}) ||
        {note: 'OFF'};
      pattern[position] = note;
    } else {
      note = pattern[position];
    }
    currentNote = yield note;
  }
};

const createDrumGenerator = (instrument, noteGetter) => style => function* drumGenerator(scene) {
  let currentNote = 0;
  const spec = scene.instruments[DRUMS].specs[instrument];
  const common = {instrument, note: spec.pitch};
  currentNote = yield;
  while (true) {
    currentNote = yield noteGetter({currentNote, spec, common, style});
  }
};

const BASS_MOVEMENT_PRESETS = [
  [0, 0, 0, 2],
  [0, 0, -3, -1],
  [0, 0, 3, 2],
  [0, 0, 0, -1],
];

const mod = (n, m) => (((n % m) + m) % m);

const generators = {
  [BASS]: createPatternGenerator(fourBars, () => null, ({currentNote, position, scene, style}) => {
    if (style === '16th' || style === '8th' || style === '16thOct' || style === 'offbeat') {
      const movement = scene.instruments[BASS].movement;
      const movementSpeed = scene.instruments[BASS].movementSpeed;
      const cycle = (style === '8th' ? eighth : (style === 'offbeat' ? quarter : sixteenth));
      if (currentNote % cycle === (style === 'offbeat' ? eighth : 0)) {
        const root = ROOT_NOTE + scene.rootNoteOffset;
        const currentChord = scene.chords[Math.floor(position / bar) % scene.chords.length];
        let pitch = root + currentChord;
        if (movement) {
          const currentChordIndex = AEOLIAN.findIndex(x => mod(currentChord, 12) === x);
          let indexDelta = movement[Math.floor(position / (movementSpeed/4)) % movement.length];
          if (currentChordIndex === 5 && indexDelta === 3) {
            // avoid sharp 4 on VI chord
            indexDelta = 4;
          }
          if (currentChordIndex === 6 && indexDelta === -1) {
            // avoid seventh flavor on VII chord
            indexDelta = -2;
          }
          if (currentChordIndex === 5 && indexDelta === 2) {
            // avoid third on VI chord
            indexDelta = 0;
          }
          if (currentChordIndex === 6 && indexDelta === 2) {
            // avoid third on VII chord
            indexDelta = 3;
          }
          const pitchOffset = currentChordIndex + indexDelta;
          const newChordTone = AEOLIAN[mod(pitchOffset, AEOLIAN.length)];
          pitch = root + newChordTone;
          // console.log(root, currentChord, currentChordIndex, indexDelta, pitchOffset, newChordTone, pitch);
        }
        if (pitch - ROOT_NOTE >= 8) {
          pitch -= 12;
        }
        if (style === '16thOct') {
          pitch += (currentNote % eighth === 0) ? 0 : 12;
        }
        let velocity = scene.instruments[BASS].volume;
        if (style !== '8th' && (currentNote % quarter === 0)) {
          velocity *= 0.7;
        }
        return {note: pitch, velocity};
      }
    }
    return null;
  }),
  [LEAD1]: createPatternGenerator(2 * bar, () => null, ({currentNote, scene}) => {
    if (currentNote % sixteenth === 0 && rand(1, 100) > 60) {
      return {
        note: ROOT_NOTE + rand(1, 2) * octave + scene.rootNoteOffset +
          randWeighted(AEOLIAN, WEIGHTS),
        velocity: scene.instruments[LEAD1].volume,
      };
    }
    return null;
  }),
  [DRUMS]: style => function* drumsGenerator(scene) {
    const children = CHILDREN[DRUMS]
      .map(child => generators[child](style)(scene));
    let currentNote = 0;
    currentNote = yield;
    while (true) {
      currentNote = yield children.map(child => child.next(currentNote).value);
    }
  },
  [instruments.BD]: createDrumGenerator(instruments.BD, ({currentNote, spec, common}) => {
    if (currentNote % quarter === 0) {
      return {...common, velocity: spec.volume};
    } else if ((currentNote + eighth) % fourBars === 0) {
      return {...common, velocity: spec.volume * 0.8};
    }
    return null;
  }),
  [instruments.SN]: createDrumGenerator(instruments.SN, ({currentNote, spec, common}) => {
    if (currentNote % (2 * quarter) === 8) {
      return {...common, velocity: spec.volume};
    }
    return null;
  }),
  [instruments.HC]: createDrumGenerator(instruments.HC, ({currentNote, spec, common}) => {
    if (currentNote % sixteenth === 0) {
      return {...common, velocity: spec.volume};
    }
    return null;
  }),
  [instruments.TM]: createDrumGenerator(instruments.TM, ({currentNote, spec, common}) => {
    if (currentNote % sixteenth === 0 && rand(1, 100) > 95) {
      return {...common, note: common.note + rand(-6,6), velocity: spec.volume};
    }
    return null;
  }),
};

const getChoices = max => Array.from({length: max}, (_, i) => i + 1);

const randomizers = {
  [BASS]: () => {
    const style = sample(styles[BASS]);
    const isEighth = style === 'offbeat' || style === '8th';
    const movement = rand(0, 100) > 50 ? sample(BASS_MOVEMENT_PRESETS) : null;
    const movementSpeed = sample([bar, bar / 2]);
    return {
      style,
      movement,
      movementSpeed,
      volume: 0.55,
      aEnvRelease: isEighth ? randFloat(0.3, 0.4) : randFloat(0.9, 0.14),
      oscType: sample(['sawtooth', 'square']),
    };
  },
  [LEAD1]: () => {
    return {
      volume: 0.55,
      oscType: sample(['sawtooth', 'square', 'triangle']),
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
    specs[instruments.TM].volume = randFloat(0.4, 0.5);
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
          oscType0: specs.oscType,
          oscOn0: true,
          oscOn1: false,
          filterFreq: 800,
          filterQ: 1,
          aEnvAttack: 0.005,
          aEnvRelease: specs.aEnvRelease,
          aEnvDecay: 0.2,
          eqFrequency: 100,
          eqGain: 6,
          eqQ: 2,
        })
        return synth;
      }
    case LEAD1:
      {
        const synth = retrosynth(context.mixer.ctx);
        setParams(synth)({
          oscType0: specs.oscType,
          oscType1: specs.oscType,
          oscDetune0: randFloat(1, 10),
          oscDetune1: randFloat(-10, -1),
          oscOn0: true,
          oscOn1: true,
          filterFreq: 1000,
          filterQ: 2,
          aEnvAttack: 0.010,
          aEnvRelease: 0.1,
          aEnvDecay: 0.1,
          eqFrequency: 250,
          eqType: 'lowshelf',
          eqGain: -6,
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
    case instruments.TM:
      {
        const sampleName = `${instrument}${specs.specs[instrument].sample}`;
        const inserts = (instrument === instruments.SN || instrument === instruments.TM) ? [
          reverb(context.mixer.ctx, {
            impulse: `impulse${specs.reverbImpulse}`,
            dry: 1,
            wet: 0.3,
          }),
          compressor(context.mixer.ctx, {
            threshold: -15, ratio: 6, attack: 0.004, release: 0.180
          })
        ] : [];
        const synth = sampler(context.mixer.ctx, sampleName, inserts);
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
      inserts.push(compressor(context.mixer.ctx, {
        threshold: -8, ratio: 4, attack: 0.010, release: 0.100
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
