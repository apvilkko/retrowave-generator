const create = el => {
  const rows = 10;
  const cols = 20;
  const container = document.createElement('div');
  container.className = 'grid';
  const table = document.createElement('table');
  for (let i = 0; i < rows; ++i) {
    const tr = document.createElement('tr');
    for (let j = 0; j < cols; ++j) {
      const td = document.createElement('td');
      tr.appendChild(td);
    }
    table.appendChild(tr);
  }
  container.appendChild(table);
  el.appendChild(container);
};

export default create;
