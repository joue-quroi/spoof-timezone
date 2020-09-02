/* globals offsets */
'use strict';

const offset = document.getElementById('offset');
const toast = document.getElementById('toast');

offset.addEventListener('change', () => {
  const value = offset.selectedOptions[0].value;
  chrome.runtime.getBackgroundPage(b => {
    const {offset, storage} = b.resolve.analyze(value);
    document.getElementById('minutes').value = offset;
    document.getElementById('daylight').value = storage.msg.daylight || storage.msg.standard;
    document.getElementById('standard').value = storage.msg.standard;
  });
});

document.addEventListener('DOMContentLoaded', () => {
  const f = document.createDocumentFragment();
  Object.keys(offsets).sort((a, b) => offsets[b].offset - offsets[a].offset).forEach(key => {
    const option = document.createElement('option');
    option.value = key;
    option.textContent = `${key} (${offsets[key].offset})`;
    f.appendChild(option);
  });
  offset.appendChild(f);
  offset.value = localStorage.getItem('location') || 'Etc/GMT';

  document.getElementById('standard').value = localStorage.getItem('standard') || 'London Standard Time';
  document.getElementById('daylight').value = localStorage.getItem('daylight') || 'London Daylight Time';
  document.getElementById('minutes').value = localStorage.getItem('offset') || 0;
  document.getElementById('random').checked = localStorage.getItem('random') === 'true';
  document.getElementById('update').checked = localStorage.getItem('update') === 'true';
});

document.addEventListener('submit', e => {
  e.preventDefault();

  localStorage.setItem('location', offset.value);

  localStorage.setItem('offset', document.getElementById('minutes').value);
  localStorage.setItem('daylight', document.getElementById('daylight').value);
  localStorage.setItem('standard', document.getElementById('standard').value);
  localStorage.setItem('random', document.getElementById('random').checked);
  localStorage.setItem('update', document.getElementById('update').checked);

  toast.textContent = 'Options saved';
  window.setTimeout(() => toast.textContent = '', 750);
});

document.getElementById('support').addEventListener('click', () => chrome.tabs.create({
  url: chrome.runtime.getManifest().homepage_url + '?rd=donate'
}));

// reset
document.getElementById('reset').addEventListener('click', e => {
  if (e.detail === 1) {
    toast.textContent = 'Double-click to reset!';
    window.setTimeout(() => toast.textContent = '', 750);
  }
  else {
    localStorage.clear();
    chrome.storage.local.clear(() => {
      chrome.runtime.reload();
      window.close();
    });
  }
});
