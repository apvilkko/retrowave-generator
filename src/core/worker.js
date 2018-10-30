export default (ctx, fn) => {
  const inlined = 'self.addEventListener(\'message\', function() {setInterval(function() {self.postMessage(true)}, 200)});';
  const url = window.URL || window.webkitURL;
  const blobUrl = url.createObjectURL(new Blob([inlined]));
  const worker = new Worker(blobUrl);
  worker.postMessage('start');
  worker.addEventListener('message', () => fn(ctx));
  // Store worker reference so it doesn't get nuked automatically
  window.worker = worker;
};
