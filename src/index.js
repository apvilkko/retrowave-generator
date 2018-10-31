import createMixer from './core/mixer';
import createSequencer, {play} from './core/sequencer';
import loop from './core/loop';
import {randomize} from './generator/scene';
import createAnalyserCanvas from './visualization/createAnalyserCanvas';
import processAnalyserFrame from './visualization/processAnalyserFrame';

const context = {};

const randomizeScene = () => {
  context.scene = randomize(context);
};

const processFrame = processAnalyserFrame(context);

const frame = () => {
  processFrame();
  requestAnimationFrame(frame);
}

const setupAnalyser = root => {
  createAnalyserCanvas(context, root);
  requestAnimationFrame(frame);
}

const setup = () => {
  const root = document.createElement('div');
  document.body.appendChild(root);
  context.mixer = createMixer();
  setupAnalyser(root);
  randomizeScene();
  context.sequencer = createSequencer();
  loop(context);
  play(context.sequencer);
};

setup();
