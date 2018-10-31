import {getRateFromPitch} from '../core/math';
import loadBuffer from './loadBuffer';

const create = (ctx, sampleName) => {
  let bufferSource;
  let buffer = null;
  loadBuffer(ctx, sampleName).then(ret => {
    buffer = ret;
  });
  const gain = ctx.createGain();
  const vca = ctx.createGain();
  vca.connect(gain);
  const output = gain;

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

  const noteOff = atTime => {
    const time = atTime || ctx.currentTime;
    if (bufferSource) {
      bufferSource.stop(time);
    }
  }

  return {
    gain,
    output,

    noteOn,
    noteOff,
  }
};

export default create;
