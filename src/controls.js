const create = (el, actions) => {
  const container = document.createElement('div');
  container.className = 'controls';
  const play = document.createElement('button');
  play.innerText = 'Play/pause';
  play.addEventListener('click', actions.play);
  container.appendChild(play);
  el.appendChild(container);
};

export default create;
