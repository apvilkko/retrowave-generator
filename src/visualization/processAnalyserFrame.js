export const OSC_WIDTH = 640;
export const OSC_HEIGHT = 240;

export default context => () => {
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
    drawContext.fillStyle = 'yellow';
    drawContext.fillRect(i * barWidth, offset, 1, 1);
  }
};
