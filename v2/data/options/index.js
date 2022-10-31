/* global offsets */
'use strict';

const offset = document.getElementById('offset');
const user = document.getElementById('user');
const toast = document.getElementById('toast');

const update = () => chrome.runtime.sendMessage({
  method: 'get-offset',
  value: user.value
}, offset => document.getElementById('minutes').value = offset);

offset.addEventListener('change', update);

document.addEventListener('DOMContentLoaded', () => {
  const f = document.createDocumentFragment();
  Object.keys(offsets).sort((a, b) => offsets[b].offset - offsets[a].offset).forEach(key => {
    const option = document.createElement('option');
    option.value = key;

    const of = offsets[key].offset === 0 ? 'GMT' : (
      (offsets[key].offset > 0 ? '+' : '-') +
      (Math.abs(offsets[key].offset) / 60).toString().split('.')[0].padStart(2, '0') + ':' +
      (Math.abs(offsets[key].offset) % 60).toString().padStart(2, '0')
    );
    option.textContent = `${key} (${of})`;
    f.appendChild(option);
  });
  offset.appendChild(f);
  offset.value = user.value = localStorage.getItem('location') || 'Etc/GMT';
  offset.dispatchEvent(new Event('change'));

  document.getElementById('random').checked = localStorage.getItem('random') === 'true';
  document.getElementById('update').checked = localStorage.getItem('update') === 'true';
});

offset.onchange = e => {
  if (e.target.value) {
    user.value = e.target.value;
  }
};

const date = new Date();
user.oninput = e => {
  try {
    date.toLocaleString('en', {
      timeZone: e.target.value,
      timeZoneName: 'longOffset'
    });
    update();
    offset.value = user.value;
    e.target.setCustomValidity('');
  }
  catch (ee) {
    e.target.setCustomValidity('Not a valid time zone');
  }
};

document.addEventListener('submit', e => {
  e.preventDefault();

  localStorage.setItem('location', user.value);
  localStorage.setItem('random', document.getElementById('random').checked);
  localStorage.setItem('update', document.getElementById('update').checked);

  chrome.runtime.sendMessage({
    method: 'update-offset'
  });

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
