import createMixer from '../core/mixer';
import retroSynth from '../retrosynth';
import loop from '../core/loop';
import processAnalyserFrame, {OSC_WIDTH, OSC_HEIGHT} from '../visualization/processAnalyserFrame';

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
  const canvas = document.createElement('canvas');
  root.appendChild(canvas);

  canvas.width = OSC_WIDTH;
  canvas.height = OSC_HEIGHT;

  const mixer = createMixer();
  context.mixer = mixer;
  context.drawContext = canvas.getContext('2d');
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
