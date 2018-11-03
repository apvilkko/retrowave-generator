import createMixer from './core/mixer';
import createSequencer, {play} from './core/sequencer';
import loop from './core/loop';
import {randomize} from './generator/scene';
import createAnalyserCanvas from './visualization/createAnalyserCanvas';
import processAnalyserFrame from './visualization/processAnalyserFrame';
import setupGrid from './visualization/grid';
import setupControls from './controls';

import './style.scss';

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

const createActions = context => ({
  play: () => { play(context.sequencer); },
});

const setup = () => {
  const root = document.getElementById('app');
  context.mixer = createMixer();
  setupAnalyser(root);
  setupGrid(root);
  randomizeScene();
  context.sequencer = createSequencer();
  context.actions = createActions(context);
  setupControls(root, context.actions);
  loop(context);
  if (process.env.NODE_ENV !== 'production') {
    play(context.sequencer);
  }
};

setup();
