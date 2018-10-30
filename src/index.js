import createMixer from './core/mixer';
import createSequencer, {play} from './core/sequencer';
import loop from './core/loop';
import {randomize} from './generator/scene';

const context = {};

const root = document.createElement('div');
document.body.appendChild(root);

const randomizeScene = () => {
  context.scene = randomize(context);
};

context.mixer = createMixer();
randomizeScene();
context.sequencer = createSequencer();
loop(context);
play(context.sequencer);
