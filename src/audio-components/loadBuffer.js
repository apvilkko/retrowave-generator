const cache = {};
const doRequest = url => fetch(url).then(response => response.arrayBuffer());

export default (ctx, name) => {
  return new Promise(resolve => {
    if (cache[name]) {
      resolve(cache[name]);
      return;
    }
    doRequest(`samples/${name.toLowerCase()}.ogg`).then(rawBuffer => {
      ctx.decodeAudioData(rawBuffer, buffer => {
        cache[name] = buffer;
        resolve(buffer);
      }, err => console.log(err));
    });
  });
};
