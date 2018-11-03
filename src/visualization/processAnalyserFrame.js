import {OSC_WIDTH, OSC_HEIGHT} from './constants';
import colors from './colors';

let flag = 0;

export default context => () => {
  if (flag) {
    const {mixer, drawContext} = context;
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
      drawContext.fillStyle = colors.PINK_DARK;
      drawContext.fillRect(i * barWidth, offset - 3, 1, 7);
      drawContext.fillStyle = colors.PINK_LIGHT;
      drawContext.fillRect(i * barWidth, offset - 1, 1, 3);
    }
  }
  flag = ++flag % 2;
};
