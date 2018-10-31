import createMixer from '../core/mixer';
import retroSynth from '../retrosynth';
import loop from '../core/loop';
import processAnalyserFrame from '../visualization/processAnalyserFrame';
import createAnalyserCanvas from '../visualization/createAnalyserCanvas';

let synth;
let start = null;
let playing = false;
let notes = [110, 220, 196];
let noteIndex = 0;
const cycle = 1200;

const PLAY_TEST = false;

const context = {};

const processFrame = processAnalyserFrame(context);

const frame = timestamp => {
  if (!start) start = timestamp;
  const elapsed = (timestamp - start) % cycle;
  if (PLAY_TEST) {
    if (elapsed < (cycle*0.15) && !playing) {
      synth.noteOn(notes[++noteIndex%notes.length]);
      playing = true;
    }
    if (elapsed > (cycle*0.7) && playing) {
      synth.noteOff();
      playing = false;
    }
  }
  processFrame();
  requestAnimationFrame(frame);
}

const setupView = () => {
  const root = document.createElement('div');
  document.body.appendChild(root);
  createAnalyserCanvas(context, root);
  const mixer = createMixer();
  context.mixer = mixer;
  loop(context);

  if (PLAY_TEST) {
    synth = retroSynth(mixer.ctx);
    synth.setParam('osctype0', 'sawtooth');
    synth.setParam('osctype1', 'sawtooth');
    synth.setParam('detune0', 1);
    synth.setParam('detune1', -1);
    synth.output.connect(mixer.input);
  }

  requestAnimationFrame(frame);
};

setupView();
