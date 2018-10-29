import createMixer from '../core/mixer';
import retroSynth from '../retrosynth';

const OSC_WIDTH = 640;
const OSC_HEIGHT = 240;

let mixer;
let synth;
let drawContext;
let start = null;
let playing = false;
let notes = [110, 220, 196];
let noteIndex = 0;
const cycle = 1200;

const frame = timestamp => {
  if (!start) start = timestamp;
  const elapsed = (timestamp - start) % cycle;
  if (elapsed < (cycle*0.15) && !playing) {
    synth.noteOn(notes[++noteIndex%notes.length]);
    playing = true;
  }
  if (elapsed > (cycle*0.7) && playing) {
    synth.noteOff();
    playing = false;
  }
  let values = new Uint8Array(mixer.analyser.frequencyBinCount);
  mixer.analyser.getByteTimeDomainData(values);
  for (let i = 0; i < values.length; ++i) {
    const value = values[i];
    const percent = value / 256;
    const height = OSC_HEIGHT * percent;
    const offset = OSC_HEIGHT - height - 1;
    const barWidth = OSC_WIDTH / values.length;
    drawContext.fillStyle = 'black';
    drawContext.fillRect(i * barWidth, 0, 1, OSC_HEIGHT);
    drawContext.fillStyle = 'yellow';
    drawContext.fillRect(i * barWidth, offset, 1, 1);
  }
  requestAnimationFrame(frame);
}

const setupView = () => {
  const root = document.createElement('div');
  document.body.appendChild(root);
  const canvas = document.createElement('canvas');
  root.appendChild(canvas);

  canvas.width = OSC_WIDTH;
  canvas.height = OSC_HEIGHT;
  drawContext = canvas.getContext('2d');

  mixer = createMixer();
  synth = retroSynth(mixer.ctx);
  synth.setParam('osctype0', 'sawtooth');
  synth.setParam('osctype1', 'sawtooth');
  synth.setParam('detune0', 1);
  synth.setParam('detune1', -1);
  synth.output.connect(mixer.input);

  requestAnimationFrame(frame);
};

setupView();
