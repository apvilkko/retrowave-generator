import instruments, { all, CHILDREN } from "./instruments";
import {
  sample,
  rand,
  randFloat,
  randWeighted,
  sampleN,
  shuffle
} from "../utils";
import retrosynth from "../retrosynth";
import polysynth from "../retrosynth/polysynth";
import setParams from "../audio-components/setParams";
import sampler from "../audio-components/sampler";
import compressor from "../audio-components/compressor";
import reverb from "../audio-components/reverb";
import stereoDelay from "../audio-components/stereoDelay";
import catalog from "./catalog";

const ROOT_NOTE = 36;
const {
  BASS,
  DRUMS,
  LEAD1,
  LEAD2,
  BD,
  SN,
  HC,
  TM,
  PR,
  CP,
  ORCH,
  PAD
} = instruments;

/*const muted = {
  [BASS]: false,
  [LEAD1]: false,
  [LEAD2]: true,
  [PAD]: true,
  [DRUMS]: true,
  [ORCH]: true
};*/
const muted = {};

const styles = [
  "16th", // single note 16ths
  "16thOct", // like 16th but octave is changed
  // 'arp', // like 16th but variation in notes
  "offbeat", // 8th on the offbeat only
  "8th" // single note 8ths
  // 'ifeellove', // note changes on 8th, 16ths
];

const drumStyles = {
  [BD]: ["4x4", "breakbeat", "mixed"],
  [HC]: ["16th", "8th", "three"]
};

const quarter = 8;
const bar = quarter * 4;
const fourBars = bar * 4;
const eighth = quarter / 2;
const sixteenth = eighth / 2;
const octave = 12;

const AEOLIAN = [0, 2, 3, 5, 7, 8, 10];
const weights = [4, 0.5, 1.5, 1, 2, 0.5, 2];
const wSum = weights.reduce((a, b) => a + b);
const WEIGHTS = weights.map(x => x / wSum);

const CHORD_PRESETS = [
  [0, 0, -2, -4],
  [-4, -2, 0, 0],
  [0, 0, 5, 7],
  [0, 0, -4, 7],
  [-4, 5, 0, -2],
  [0, 0, -4, 5]
];

const getChoices = max => Array.from({ length: max }, (_, i) => i + 1);

const createArray = length => Array.from({ length }, () => null);

const createPatternGenerator = (patLength, pre, noteGetter, noOff, update) => (
  style,
  scene
) =>
  function* patternGenerator() {
    let currentNote = 0;
    const pattern = createArray(patLength);
    const data = pre({ style, scene }) || {};
    while (true) {
      let note;
      const position = currentNote % patLength;
      if (update) {
        update(data, currentNote);
      }
      if (pattern[position] === null || data.inFill) {
        note =
          noteGetter({
            currentNote,
            position,
            patLength,
            pattern,
            scene,
            style,
            data
          }) || (noOff ? {} : { action: "OFF" });
        if (!data.inFill) {
          pattern[position] = note;
        }
      } else {
        note = pattern[position];
      }
      currentNote = yield note;
    }
  };

const createDrumGenerator = (instrument, noteGetter) => (style, scene) =>
  function* drumGenerator() {
    let currentNote = 0;
    const spec = scene.instruments[DRUMS].specs[instrument];
    const common = { instrument, note: spec.pitch };
    currentNote = yield;
    const state = {};
    while (true) {
      currentNote = yield noteGetter({
        currentNote,
        spec,
        common,
        style,
        state
      });
    }
  };

const BASS_MOVEMENT_PRESETS = [
  [0, 0, 0, 2],
  [0, 0, -3, -1],
  [0, 0, 3, 2],
  [0, 0, 0, -1]
];

const LEAD_8TH_PRESETS = [
  [0, 2, 3, 7],
  [0, 3, 5, 7],
  [0, 3, 7, 8],
  [-5, -2, 2, 3],
  [0, 7, 8, 12]
];

const PAD_PRESETS = [
  [0, 2, 7],
  [0, 5, 7],
  [0, 3, 7],
  [2, 5, 10],
  [0, 5, 10],
  [2, 3, 10],
  [0, 7, 12],
  [-2, 2, 3]
];

const mod = (n, m) => ((n % m) + m) % m;

const isLastOf = (small, large) => (currentNote, exact) => {
  const modulo = currentNote % large;
  const delta = large - small;
  return exact ? modulo === delta : modulo >= delta;
};

const randomizers = {
  [BASS]: () => {
    const style = sample(styles);
    const isEighth = style === "offbeat" || style === "8th";
    const movement = rand(0, 100) > 50 ? sample(BASS_MOVEMENT_PRESETS) : null;
    const movementSpeed = style === "offbeat" ? bar : sample([bar, bar / 2]);
    return {
      style,
      movement,
      movementSpeed,
      volume: muted[BASS] ? 0.01 : 0.65,
      aEnvRelease: isEighth ? randFloat(0.3, 0.4) : randFloat(0.09, 0.2),
      oscType: sample(["sawtooth", "square"])
    };
  },
  [LEAD1]: () => {
    const style = sample(["default", "8th"]);
    let theme;
    if (style === "8th") {
      const addOctave = rand(0, 100) > 50 ? 0 : 1;
      const randomTheme =
        rand(0, 100) > 30
          ? shuffle(sample(LEAD_8TH_PRESETS))
          : sampleN(4)(AEOLIAN);
      theme = randomTheme.map(x => x + addOctave * octave);
    }
    return {
      volume: muted[LEAD1] ? 0.01 : 0.5,
      pan: randFloat(-0.75, -0.01),
      oscType:
        rand(0, 100) > 67
          ? sample(["sawtooth", "square"])
          : sample(["sawtooth", "square", "triangle"]),
      style,
      theme
    };
  },
  [LEAD2]: () => {
    return {
      volume: muted[LEAD2] ? 0.01 : randFloat(0.4, 0.5),
      pan: randFloat(0.01, 0.75),
      oscType: sample(["sawtooth", "square", "triangle", "sine"])
    };
  },
  [PAD]: () => {
    return {
      volume: muted[PAD] ? 0.01 : randFloat(0.15, 0.25),
      pan: randFloat(0.01, 0.75),
      oscType: sample(["sawtooth", "square", "triangle"])
    };
  },
  [ORCH]: () => {
    const specs = {
      [ORCH]: {
        sample: sample(getChoices(catalog.samples[ORCH]))
      }
    };
    return {
      volume: muted[ORCH] ? 0.01 : 0.6,
      specs,
      reverbImpulse: sample(getChoices(catalog.samples.impulse))
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
        pan:
          [BD, SN].findIndex(x => x === child) > -1
            ? randFloat(-0.05, 0.05)
            : randFloat(-0.5, 0.5),
        pitch: randFloat(-3, 3),
        style: sample(drumStyles[child] || [null])
      };
    });
    specs[HC].volume = muted[DRUMS] ? 0.01 : randFloat(0.1, 0.15);
    specs[BD].volume = muted[DRUMS] ? 0.01 : randFloat(0.95, 1.05);
    specs[SN].volume = muted[DRUMS] ? 0.01 : randFloat(0.95, 1.05);
    specs[TM].volume = muted[DRUMS] ? 0.01 : randFloat(0.4, 0.5);
    specs[PR].volume = muted[DRUMS] ? 0.01 : randFloat(0.5, 0.7);
    specs[CP].volume = muted[DRUMS] ? 0.01 : randFloat(0.6, 0.9);
    specs[PR].volume = muted[DRUMS] ? 0.01 : randFloat(0.3, 0.6);
    specs[PR].pitch = randFloat(-5, 5);
    const reverbImpulse = sample(getChoices(catalog.samples.impulse));
    return {
      specs,
      reverbImpulse,
      perc: rand(1, 100) > 33,
      volume: 0.8
    };
  }
};

const maybeStartFill = (state, currentNote) => {
  if (!state.inFill) {
    const cycle = sample([fourBars, 2 * fourBars, 4 * fourBars]);
    const fillLength = sample([quarter, 2 * quarter, bar, eighth]);
    if (isLastOf(fillLength, cycle)(currentNote, true) && rand(1, 100) > 50) {
      state.inFill = { fillLength, cycle };
    }
  }
};

const performFill = (state, currentNote, creator) => {
  if (state.inFill) {
    const { fillLength, cycle } = state.inFill;
    if (isLastOf(fillLength, cycle)(currentNote)) {
      return creator(fillLength, currentNote, state.common);
    } else {
      state.inFill = null;
    }
  }
};

const generators = {
  [BASS]: createPatternGenerator(
    fourBars,
    () => null,
    ({ currentNote, position, scene, style }) => {
      if (
        style === "16th" ||
        style === "8th" ||
        style === "16thOct" ||
        style === "offbeat"
      ) {
        const movement = scene.instruments[BASS].movement;
        const movementSpeed = scene.instruments[BASS].movementSpeed;
        const cycle =
          style === "8th" ? eighth : style === "offbeat" ? quarter : sixteenth;
        if (currentNote % cycle === (style === "offbeat" ? eighth : 0)) {
          const root = ROOT_NOTE + scene.rootNoteOffset;
          const currentChord =
            scene.chords[Math.floor(position / bar) % scene.chords.length];
          let pitch = root + currentChord;
          if (movement) {
            const currentChordIndex = AEOLIAN.findIndex(
              x => mod(currentChord, 12) === x
            );
            let indexDelta =
              movement[
                Math.floor(position / (movementSpeed / 4)) % movement.length
              ];
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
          if (style === "16thOct") {
            pitch += currentNote % eighth === 0 ? 0 : 12;
          }
          let velocity = scene.instruments[BASS].volume;
          if (style !== "8th" && currentNote % quarter === 0) {
            velocity *= 0.7;
          }
          return { note: pitch, velocity };
        }
      }
      return null;
    }
  ),
  [LEAD1]: (style, scene) => {
    let pos = 0;
    return createPatternGenerator(
      2 * bar,
      () => null,
      ({ currentNote, scene, style }) => {
        const theme = scene.instruments[LEAD1].theme;
        if (style === "default") {
          if (currentNote % sixteenth === 0 && rand(1, 100) > 60) {
            return {
              note:
                ROOT_NOTE +
                rand(1, 2) * octave +
                scene.rootNoteOffset +
                randWeighted(AEOLIAN, WEIGHTS),
              velocity: scene.instruments[LEAD1].volume
            };
          }
        } else if (style === "8th") {
          if (currentNote % eighth === 0) {
            const note =
              isLastOf(eighth, 8 * eighth)(currentNote, true) &&
              rand(0, 100) > 60
                ? sample(AEOLIAN)
                : theme[pos % theme.length];
            pos++;
            return {
              note: ROOT_NOTE + octave + scene.rootNoteOffset + note,
              velocity: scene.instruments[LEAD1].volume
            };
          }
        }
        return null;
      }
    )(style, scene);
  },
  [LEAD2]: (style, scene) => {
    return createPatternGenerator(
      2 * bar,
      () => null,
      ({ currentNote, scene }) => {
        if (currentNote % sixteenth === 0 && rand(1, 100) > 50) {
          const offset = rand(1, 100) > 90 ? -2 : 0;
          return {
            note:
              ROOT_NOTE + rand(1, 3) * octave + scene.rootNoteOffset + offset,
            velocity: scene.instruments[LEAD2].volume * randFloat(0.5, 1.0)
          };
        }
        return null;
      }
    )(style, scene);
  },
  [DRUMS]: (style, scene) =>
    function* drumsGenerator() {
      const children = CHILDREN[DRUMS].filter(child =>
        scene.instruments[DRUMS].perc ? child !== CP : child !== PR
      ).map(child => generators[child](style, scene)());
      let currentNote = 0;
      currentNote = yield;
      while (true) {
        currentNote = yield children.map(
          child => child.next(currentNote).value
        );
      }
    },
  [BD]: (style, scene) => {
    const spec = scene.instruments[DRUMS].specs[BD];
    const fillCreator = (fillLength, currentNote, common) => {
      const prob =
        fillLength === quarter || fillLength === eighth
          ? 25
          : fillLength === 2 * quarter
          ? 50
          : 80;
      if (currentNote % sixteenth === 0 && rand(1, 100) > prob) {
        return { ...common, velocity: spec.volume * randFloat(0.3, 0.95) };
      }
    };
    if (spec.style === "mixed") {
      const cycleLen = sample([2, 4]) * bar;
      const syncopatePosition = rand(1, 100) > 50 ? 0 : cycleLen / 2;
      const pre = ({ scene }) => {
        const spec = scene.instruments[DRUMS].specs[BD];
        const common = { instrument: BD, note: spec.pitch };
        const syncLen = rand(3 * sixteenth, 6 * sixteenth);
        return { spec, common, syncLen };
      };
      const update = (data, currentNote) => {
        maybeStartFill(data, currentNote);
      };
      return createPatternGenerator(
        cycleLen,
        pre,
        ({ currentNote, data }) => {
          const { spec, common } = data;
          const fill = performFill(data, currentNote, fillCreator);
          if (fill) {
            return fill;
          }
          if (!data.inFill) {
            const distance = Math.abs(
              (currentNote % cycleLen) - syncopatePosition
            );
            const sync = distance < data.syncLen;
            if (currentNote % quarter === 0) {
              if (!sync) {
                return { ...common, velocity: spec.volume };
              }
            } else {
              if (sync && currentNote % sixteenth === 0 && rand(1, 100) > 60) {
                return { ...common, velocity: spec.volume };
              }
            }
          }
          return null;
        },
        true,
        update
      )(style, scene);
    } else if (spec.style === "breakbeat") {
      const cycleLen = sample([1, 2]) * bar;
      const pre = ({ scene }) => {
        const spec = scene.instruments[DRUMS].specs[BD];
        const common = { instrument: BD, note: spec.pitch };
        return { spec, common };
      };
      const update = (data, currentNote) => {
        maybeStartFill(data, currentNote);
      };
      return createPatternGenerator(
        cycleLen,
        pre,
        ({ currentNote, data }) => {
          const { spec, common } = data;
          const fill = performFill(data, currentNote, fillCreator);
          if (fill) {
            return fill;
          }
          if (!data.inFill) {
            if (currentNote % sixteenth === 0) {
              if (currentNote % (2 * bar) === 0) {
                return { ...common, velocity: spec.volume };
              } else if (
                currentNote % (2 * quarter) !== quarter &&
                rand(1, 100) > 80
              ) {
                return {
                  ...common,
                  velocity: spec.volume * randFloat(0.5, 0.99)
                };
              }
            }
          }
          return null;
        },
        true,
        update
      )(style, scene);
    } else {
      return createDrumGenerator(BD, ({ currentNote, spec, common, state }) => {
        maybeStartFill(state, currentNote);
        const fill = performFill(state, currentNote, fillCreator);
        if (fill) {
          return fill;
        }
        if (!state.inFill) {
          if (spec.style === "4x4") {
            if (currentNote % quarter === 0) {
              return { ...common, velocity: spec.volume };
            }
          } else if (spec.style === "breakbeat") {
            if (currentNote % bar === 0) {
              return { ...common, velocity: spec.volume };
            } else if (currentNote % sixteenth === 0 && rand(1, 100) > 90) {
              return { ...common, velocity: spec.volume * randFloat(0.7, 1) };
            }
          }
        }
        return null;
      })(style, scene);
    }
  },
  [SN]: createDrumGenerator(SN, ({ currentNote, spec, common, state }) => {
    if (!state.inFill) {
      const cycle = sample([fourBars, 2 * fourBars, 4 * fourBars]);
      const fillLength = sample([quarter, 2 * quarter, bar, eighth]);
      if (isLastOf(fillLength, cycle)(currentNote, true) && rand(1, 100) > 50) {
        state.inFill = { fillLength, cycle };
      }
    }
    if (state.inFill) {
      const { fillLength, cycle } = state.inFill;
      if (isLastOf(fillLength, cycle)(currentNote)) {
        const prob =
          fillLength === quarter || fillLength === eighth
            ? 25
            : fillLength === 2 * quarter
            ? 50
            : 80;
        if (currentNote % sixteenth === 0 && rand(1, 100) > prob) {
          return { ...common, velocity: spec.volume * randFloat(0.3, 0.95) };
        }
      } else {
        state.inFill = null;
      }
    }
    if (!state.inFill) {
      if (currentNote % (2 * quarter) === quarter) {
        return { ...common, velocity: spec.volume };
      }
    }
    return null;
  }),
  [HC]: createPatternGenerator(
    quarter,
    ({ scene }) => {
      const leaveOut = rand(0, 3);
      const choices = [0, 1, 2, 3].filter(x => x !== leaveOut);
      const spec = scene.instruments[DRUMS].specs[HC];
      const common = { instrument: HC, note: spec.pitch };
      return { choices, spec, common };
    },
    ({ currentNote, data: { spec, common, choices } }) => {
      const condition =
        spec.style === "8th"
          ? currentNote % eighth === 0
          : spec.style === "16th"
          ? currentNote % sixteenth === 0
          : spec.style === "three"
          ? choices
              .map(x => currentNote % quarter === x * sixteenth)
              .some(x => !!x)
          : false;
      if (condition) {
        return { ...common, velocity: spec.volume };
      }
      return null;
    }
  ),
  [TM]: createDrumGenerator(TM, ({ currentNote, spec, common, state }) => {
    if (!state.inFill) {
      const cycle = sample([fourBars, 2 * fourBars, 4 * fourBars]);
      const fillLength = sample([quarter, 2 * quarter, bar, eighth]);
      if (isLastOf(fillLength, cycle)(currentNote, true) && rand(1, 100) > 50) {
        state.inFill = { fillLength, cycle };
      }
    }
    if (state.inFill) {
      const { fillLength, cycle } = state.inFill;
      if (isLastOf(fillLength, cycle)(currentNote)) {
        const prob =
          fillLength === quarter || fillLength === eighth
            ? 25
            : fillLength === 2 * quarter
            ? 50
            : 80;
        const playedLast = state.prevFilled;
        if (playedLast && rand(1, 100) > 25 && currentNote % sixteenth !== 0) {
          // Get some 32nds in there
          return {
            ...common,
            note: playedLast.note,
            velocity: playedLast.velocity * randFloat(0.5, 0.9)
          };
        }
        state.prevFilled = null;
        if (currentNote % sixteenth === 0 && rand(1, 100) > prob) {
          const thisNote = {
            ...common,
            note: common.note + rand(-6, 6),
            velocity: spec.volume * randFloat(0.3, 0.95)
          };
          state.prevFilled = thisNote;
          return thisNote;
        }
      } else {
        state.inFill = null;
      }
    }
    if (!state.inFill) {
      if (currentNote % sixteenth === 0 && rand(1, 100) > 96) {
        return {
          ...common,
          note: common.note + rand(-6, 6),
          velocity: spec.volume
        };
      }
    }
    return null;
  }),
  [PR]: createDrumGenerator(PR, ({ currentNote, spec, common }) => {
    if (currentNote % sixteenth === 0 && rand(1, 100) > 95) {
      return { ...common, velocity: spec.volume * randFloat(0.5, 1.0) };
    }
    return null;
  }),
  [CP]: createDrumGenerator(CP, ({ currentNote, spec, common }) => {
    if (currentNote % sixteenth === 0 && rand(1, 100) > 95) {
      return { ...common, velocity: spec.volume * randFloat(0.5, 1.0) };
    }
    return null;
  }),
  [PAD]: (style, scene) => {
    let current;
    return createPatternGenerator(
      4 * bar,
      () => null,
      ({ currentNote, scene }) => {
        if (currentNote % bar === 0) {
          current = sample(PAD_PRESETS);
          return current.map(x => ({
            note: ROOT_NOTE + 2 * octave + scene.rootNoteOffset + x,
            velocity: scene.instruments[PAD].volume * randFloat(0.8, 1.0)
          }));
        } else if (currentNote % bar === bar / 2) {
          return current.map(() => ({
            action: "OFF"
          }));
        }
        return null;
      },
      true
    )(style, scene);
  },
  [ORCH]: createPatternGenerator(
    4 * bar,
    () => null,
    ({ currentNote, position, scene }) => {
      const cycleLen = 4 * bar;
      const currentChord =
        scene.chords[Math.floor(position / bar) % scene.chords.length];
      if (currentNote % cycleLen === 0) {
        return {
          note: scene.rootNoteOffset + currentChord,
          velocity: 1.0
        };
      } else if (
        currentNote % sixteenth === 0 &&
        isLastOf(sample([quarter, (quarter * 3) / 4, eighth]), cycleLen)(
          currentNote,
          true
        ) &&
        rand(1, 100) > 50
      ) {
        return {
          note: scene.rootNoteOffset + currentChord,
          velocity: randFloat(0.5, 0.9)
        };
      }
      return null;
    },
    true
  )
};

const createInstrumentInstance = (context, instrument, specs) => {
  switch (instrument) {
    case BASS: {
      const synth = retrosynth(context.mixer.ctx);
      setParams(synth)({
        oscType0: specs.oscType,
        oscOn0: true,
        oscOn1: false,
        lfoAmount0: 0.1,
        lfoAmount1: 0.1,
        filterFreq: 800,
        filterQ: 1,
        aEnvAttack: 0.005,
        aEnvRelease: specs.aEnvRelease,
        aEnvDecay: 0.2,
        eqFrequency: 100,
        eqGain: 6,
        eqQ: 2
      });
      return synth;
    }
    case LEAD1: {
      const synth = retrosynth(context.mixer.ctx);
      setParams(synth)({
        oscType0: specs.oscType,
        oscType1: specs.oscType,
        oscDetune0: randFloat(1, 10),
        oscDetune1: randFloat(-10, -1),
        oscOn0: true,
        oscOn1: true,
        filterFreq: randFloat(900, 1300),
        filterQ: randFloat(1.5, 5),
        fEnvRelease: specs.style === "8th" ? 1.4 : 0.1,
        aEnvAttack: 0.01,
        aEnvRelease: specs.style === "8th" ? 0.4 : 0.1,
        aEnvDecay: specs.style === "8th" ? 0.6 : 0.1,
        eqFrequency: 250,
        eqType: "lowshelf",
        eqGain: -6
      });
      return synth;
    }
    case LEAD2: {
      const synth = retrosynth(context.mixer.ctx);
      setParams(synth)({
        oscType0: specs.oscType,
        oscType1: specs.oscType,
        oscDetune0: randFloat(1, 10),
        oscDetune1: randFloat(-10, -1),
        oscOn0: true,
        oscOn1: rand(1, 100) > 50,
        filterFreq: rand(600, 1100),
        filterQ: randFloat(1.5, 2.5),
        fEnvRelease: randFloat(0.04, 0.09),
        aEnvAttack: 0.01,
        aEnvRelease: randFloat(0.05, 0.1),
        aEnvDecay: randFloat(0.05, 0.1),
        eqFrequency: 300,
        eqType: "lowshelf",
        eqGain: -6
      });
      return synth;
    }
    case PAD: {
      const synth = polysynth(context.mixer.ctx);
      const fEnvRelease = randFloat(0.1, 1.0);
      const fEnvAttack = randFloat(0.1, 0.6);
      const aEnvAttack = randFloat(0.2, 0.5);
      const aEnvRelease = randFloat(0.5, 1.0);
      const aEnvDecay = randFloat(0.1, 0.2);
      setParams(synth)({
        oscType0: specs.oscType,
        oscType1: specs.oscType,
        oscDetune0: randFloat(5, 12),
        oscDetune1: randFloat(-12, -5),
        oscOn0: true,
        oscOn1: true,
        filterFreq: rand(600, 3500),
        filterQ: randFloat(0.5, 5),
        fEnvAttack,
        fEnvRelease,
        aEnvAttack,
        aEnvRelease,
        aEnvDecay,
        eqFrequency: 300,
        eqType: "lowshelf",
        eqGain: -6
      });
      return synth;
    }
    case DRUMS: {
      const children = {};
      CHILDREN[DRUMS].forEach(child => {
        if (child === CP && specs.perc) {
          return;
        }
        children[child] = createInstrumentInstance(context, child, specs);
      });
      return { children };
    }
    case BD:
    case SN:
    case HC:
    case TM:
    case PR:
    case CP:
    case ORCH: {
      const sampleName = `${instrument}${specs.specs[instrument].sample}`;
      const shouldComp = [SN, TM, CP].indexOf(instrument) > -1;
      const shouldRev = [SN, TM, PR, CP, ORCH].indexOf(instrument) > -1;
      const wetRev = [CP, PR, ORCH].indexOf(instrument) > -1;
      const inserts = [];
      if (shouldRev) {
        inserts.push(
          reverb(context.mixer.ctx, {
            impulse: `impulse${specs.reverbImpulse}`,
            dry: 1,
            wet: wetRev ? randFloat(0.5, 0.7) : randFloat(0.3, 0.5)
          })
        );
      }
      if (shouldComp) {
        inserts.push(
          compressor(context.mixer.ctx, {
            threshold: -15,
            ratio: 6,
            attack: 0.004,
            release: 0.18
          })
        );
      }
      const synth = sampler(context.mixer.ctx, sampleName, inserts);
      return synth;
    }
    default:
      return {
        name: instrument
      };
  }
};

const cleanupInstance = instance => {
  if (instance.cleanup) {
    instance.cleanup();
  }
  if (instance.vcos) {
    instance.vcos.forEach(vco => {
      vco.stop();
    });
  }
  if (instance.output) {
    instance.output.disconnect();
  }
  if (instance.children) {
    Object.values(instance.children).forEach(child => {
      child.panner.disconnect();
      child.output.disconnect();
    });
  }
  if (instance.instances) {
    instance.instances.forEach(cleanupInstance);
  }
};

const cleanup = context => {
  const scene = context.scene;
  if (!scene) {
    return;
  }
  all.forEach(instrument => {
    const instance = scene.instances[instrument];
    const track = context.mixer.tracks[instrument];
    const inserts = instance.mixerInserts;
    const sends = instance.mixerSends;
    for (let i = 0; i < inserts.length; ++i) {
      inserts[i].input.disconnect();
      inserts[i].output.disconnect();
      delete inserts[i];
    }
    for (let i = 0; i < sends.length; ++i) {
      sends[i].input.disconnect();
      sends[i].output.disconnect();
      delete sends[i];
    }
    cleanupInstance(instance);
    track.panner.disconnect(context.mixer.input);
    track.gain.disconnect(track.panner);
    delete scene.instances[instrument];
  });
};

const randomize = context => {
  cleanup(context);
  const scene = {
    tempo: rand(100, 125),
    instruments: {},
    generators: {},
    instances: {},
    rootNoteOffset: rand(-3, 3),
    chords: sample(CHORD_PRESETS)
  };
  all.forEach(instrument => {
    scene.instruments[instrument] = randomizers[instrument]();
    const style = scene.instruments[instrument].style;
    scene.generators[instrument] = generators[instrument](style, scene)();
    scene.instances[instrument] = createInstrumentInstance(
      context,
      instrument,
      scene.instruments[instrument]
    );
    const track = context.mixer.tracks[instrument];
    const inserts = [];
    const sends = [];
    if (instrument == LEAD1 || instrument == LEAD2 || instrument == PAD) {
      const beatLen = 60 / scene.tempo;
      sends.push(
        stereoDelay(context.mixer.ctx, {
          delayL: (beatLen / rand(2, 4)) * randFloat(0.98, 1.02),
          delayR: (beatLen / rand(2, 4)) * randFloat(0.98, 1.02),
          filterFrequency: 4000,
          gain: 0.3,
          feedback: 0.7
        })
      );
    }
    if (instrument === DRUMS) {
      inserts.push(
        compressor(context.mixer.ctx, {
          threshold: -8,
          ratio: 4,
          attack: 0.01,
          release: 0.1
        })
      );
    }
    for (let i = 0; i < inserts.length; ++i) {
      inserts[i].output.connect(
        i < inserts.length - 1 ? inserts[i + 1].input : track.gain
      );
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
      Object.keys(instance.children).forEach(key => {
        const child = instance.children[key];
        const panner = context.mixer.ctx.createStereoPanner();
        const spec =
          instrument === DRUMS
            ? scene.instruments[DRUMS].specs[key]
            : scene.instruments[instrument];
        panner.pan.value = spec.pan || 0;
        panner.connect(dest);
        child.panner = panner;
        child.output.connect(panner);
      });
    }
    if (scene.instruments[instrument].volume) {
      track.gain.gain.value = scene.instruments[instrument].volume;
    }
    instance.mixerInserts = inserts;
    instance.mixerSends = sends;
    const panner = context.mixer.ctx.createStereoPanner();
    panner.pan.value = scene.instruments[instrument].pan || 0;
    panner.connect(context.mixer.input);
    track.gain.connect(panner);
    track.panner = panner;
  });

  return scene;
};

export { randomize };
