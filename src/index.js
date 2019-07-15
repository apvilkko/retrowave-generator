import createMixer from "./core/mixer";
import createSequencer, { play } from "./core/sequencer";
import loop from "./core/loop";
import { randomize } from "./generator/scene";
import createAnalyserCanvas from "./visualization/createAnalyserCanvas";
import processAnalyserFrame from "./visualization/processAnalyserFrame";
import setupGrid from "./visualization/grid";
import setupControls from "./controls";

import "./style.scss";

const context = {};

const randomizeScene = () => {
  context.scene = randomize(context);
};

const processFrame = processAnalyserFrame(context);

const frame = () => {
  processFrame();
  requestAnimationFrame(frame);
};

const setupAnalyser = root => {
  createAnalyserCanvas(context, root);
  requestAnimationFrame(frame);
};

const createActions = context => ({
  play: () => {
    play(context.sequencer);
  },
  randomize: () => {
    randomizeScene();
  }
});

const setup = () => {
  const root = document.getElementById("app");
  context.mixer = createMixer();
  setupAnalyser(root);
  setupGrid(root);
  randomizeScene();
  context.sequencer = createSequencer();
  context.actions = createActions(context);
  setupControls(root, context.actions);
  loop(context);
  play(context.sequencer);
};

const hideStart = () => {
  const btn = document.getElementById("start");
  btn.style.display = "none";
};

const setupStart = () => {
  const btn = document.getElementById("start");
  btn.addEventListener("click", () => {
    setup();
    hideStart();
  });
};

if (process.env.NODE_ENV === "production") {
  setupStart();
} else {
  hideStart();
  setup();
}
