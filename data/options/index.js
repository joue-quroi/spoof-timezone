'use strict';

var offset = document.getElementById('offset');

offset.addEventListener('change', () => {
  const value = offset.selectedOptions[0].dataset.value;
  document.getElementById('minutes').value = -1 * Number(value);
});

document.addEventListener('DOMContentLoaded', () => {
  fetch('/data/offsets.json').then(r => r.json()).then(o => {
    const f = document.createDocumentFragment();
    Object.keys(o).sort((a, b) => o[b] - o[a]).forEach(key => {
      const option = document.createElement('option');
      option.value = key;
      option.textContent = `${key} (${-1 * o[key]})`;
      option.dataset.value = o[key];
      f.appendChild(option);
    });
    offset.appendChild(f);
    offset.value = localStorage.getItem('location') || 'Etc/Greenwich';
  });

  document.getElementById('minutes').value = localStorage.getItem('offset') || 0;
  document.getElementById('random').checked = localStorage.getItem('random') === 'true';
  document.getElementById('update').checked = localStorage.getItem('update') === 'true';
});

document.getElementById('save').addEventListener('click', () => {
  localStorage.setItem('location', offset.value);

  const val1 = Number(document.getElementById('minutes').value);
  const val2 = -1 * Number(offset.selectedOptions[0].dataset.value);
  localStorage.setItem('offset', isNaN(val1) ? val2 : val1);
  localStorage.setItem('random', document.getElementById('random').checked);
  localStorage.setItem('update', document.getElementById('update').checked);

  const info = document.getElementById('info');
  info.textContent = 'Options saved';
  window.setTimeout(() => info.textContent = '', 750);
});

document.getElementById('support').addEventListener('click', () => chrome.tabs.create({
  url: chrome.runtime.getManifest().homepage_url + '?rd=donate'
}));
