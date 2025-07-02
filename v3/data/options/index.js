/* global offsets */
'use strict';

const offset = document.getElementById('offset');
const user = document.getElementById('user');
const toast = document.getElementById('toast');

const update = () => chrome.runtime.sendMessage({
  method: 'get-offset',
  value: user.value
}, offset => {
  if (offset.error) {
    alert(offset.error);
  }
  else {
    document.getElementById('minutes').value = offset;
  }
});

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
  chrome.storage.local.get({
    timezone: 'Etc/GMT',
    random: false,
    update: false,
    scope: ['*://*/*'],
    whitelist: ['']
  }, prefs => {
    offset.value = user.value = prefs.timezone;
    offset.dispatchEvent(new Event('change'));
    document.getElementById('random').checked = prefs.random;
    document.getElementById('update').checked = prefs.update;
    document.getElementById('scope').value = prefs.scope.join(', ');
    document.getElementById('whitelist').value = prefs.whitelist.join(', ');
  });
});

offset.onchange = e => {
  if (e.target.value) {
    user.value = e.target.value;
    user.dispatchEvent(new Event('input'));
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
    e.target.setCustomValidity('Not a valid timezone');
  }
};

document.addEventListener('submit', e => {
  e.preventDefault();

  const scope = document.getElementById('scope').value.split(/\s*,\s*/).filter(a => a);
  if (scope.length === 0) {
    scope.push('*://*/*');
  }

  const whitelist = document.getElementById('whitelist').value.split(/\s*,\s*/).filter(a => a);
  if (whitelist.length === 0) {
    whitelist.push('');
  }

  chrome.storage.local.set({
    timezone: user.value,
    random: document.getElementById('random').checked,
    update: document.getElementById('update').checked,
    scope,
    whitelist
  }, () => {
    chrome.runtime.sendMessage({
      method: 'update-offset'
    });
    toast.textContent = 'Options saved';
    window.setTimeout(() => toast.textContent = '', 750);
  });
});

document.getElementById('support').addEventListener('click', () => chrome.tabs.create({
  url: chrome.runtime.getManifest().homepage_url + '?rd=donate'
}));

document.getElementById('map').addEventListener('click', () => chrome.tabs.create({
  url: 'https://webbrowsertools.com/timezone/'
}));

// reset
document.getElementById('reset').addEventListener('click', e => {
  if (e.detail === 1) {
    toast.textContent = 'Double-click to reset!';
    window.setTimeout(() => toast.textContent = '', 750);
  }
  else {
    localStorage.clear();
    chrome.storage.session.clear(() => {
      chrome.storage.local.clear(() => {
        chrome.runtime.reload();
        window.close();
      });
    });
  }
});

// links
for (const a of [...document.querySelectorAll('[data-href]')]) {
  if (a.hasAttribute('href') === false) {
    a.href = chrome.runtime.getManifest().homepage_url + '#' + a.dataset.href;
  }
}
