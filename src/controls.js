const create = (el, actions) => {
  const container = document.createElement('div');
  container.className = 'controls';

  const play = document.createElement('button');
  play.innerText = 'Play/pause';
  play.addEventListener('click', actions.play);
  container.appendChild(play);

  const rand = document.createElement('button');
  rand.innerText = 'Randomize';
  rand.addEventListener('click', actions.randomize);
  container.appendChild(rand);

  el.appendChild(container);
};

export default create;
