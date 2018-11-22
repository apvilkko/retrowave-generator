import {getRateFromPitch} from '../core/math';
import loadBuffer from './loadBuffer';

const create = (ctx, sampleName, inserts) => {
  let bufferSource;
  let buffer = null;
  loadBuffer(ctx, sampleName).then(ret => {
    buffer = ret;
  });
  const output = ctx.createGain();
  const vca = ctx.createGain();
  if (!inserts || inserts.length === 0) {
    vca.connect(output);
  } else {
    vca.connect(inserts[0].input);
    for (let i = 0; i < inserts.length; ++i) {
      inserts[i].output.connect((i < inserts.length - 1) ? inserts[i+1].input : output);
    }
  }

  const noteOn = (note, atTime) => {
    const pitch = note.note;
    const time = atTime || ctx.currentTime;
    if (!buffer) {
      return;
    }
    bufferSource = ctx.createBufferSource();
    bufferSource.buffer = buffer;
    bufferSource.connect(vca);
    if (pitch !== 0) {
      bufferSource.playbackRate.setValueAtTime(getRateFromPitch(pitch), time);
    }
    bufferSource.start(time);
    vca.gain.setValueAtTime(note.velocity || 1, time);
  };

  const noteOff = (note, atTime) => {
    const time = atTime || ctx.currentTime;
    if (bufferSource) {
      bufferSource.stop(time);
    }
  }

  return {
    gain: output,
    output,

    noteOn,
    noteOff,
  }
};

export default create;
