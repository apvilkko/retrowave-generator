import {OSC_WIDTH, OSC_HEIGHT} from './constants';

export default (context, el) => {
  const canvas = document.createElement('canvas');
  el.appendChild(canvas);

  canvas.width = OSC_WIDTH;
  canvas.height = OSC_HEIGHT;

  context.drawContext = canvas.getContext('2d');
};
