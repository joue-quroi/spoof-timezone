'use strict';

const offset = document.getElementById('offset');
const user = document.getElementById('user');
const toast = document.getElementById('toast');

const notify = (message, timeout = 750) => {
  toast.textContent = message;
  clearTimeout(notify.id);
  notify.id = setTimeout(() => toast.textContent = '', timeout);
};

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

document.addEventListener('DOMContentLoaded', async () => {
  const f = document.createDocumentFragment();

  const prefs = await chrome.storage.local.get({
    timezone: 'Etc/GMT',
    random: false,
    update: false,
    scope: ['*://*/*'],
    whitelist: ['*://challenges.cloudflare.com/*'],
    famousTimeZones: [
      'Etc/GMT',
      'America/New_York',
      'America/Los_Angeles',
      'Europe/London',
      'Europe/Paris',
      'Asia/Dubai',
      'Asia/Kolkata',
      'Asia/Shanghai',
      'Asia/Tokyo',
      'Australia/Sydney',
      'Pacific/Auckland'
    ]
  });

  const date = new Date();
  const opt = timeZone => {
    const dtf = new Intl.DateTimeFormat('en-US', {
      timeZone,
      timeZoneName: 'shortOffset'
    });
    const parts = dtf.formatToParts(date);
    const value = parts.find(p => p.type === 'timeZoneName').value;

    const option = document.createElement('option');
    option.value = timeZone;
    option.textContent = `${timeZone} (${value})`;
    f.appendChild(option);
  };

  for (const timeZone of prefs.famousTimeZones) {
    opt(timeZone);
  }
  const hr = document.createElement('hr');
  f.appendChild(hr);

  for (const timeZone of Intl.supportedValuesOf('timeZone')) {
    if (prefs.famousTimeZones.includes(timeZone) === false) {
      opt(timeZone);
    }
  }
  offset.appendChild(f);

  offset.value = user.value = prefs.timezone;
  offset.dispatchEvent(new Event('change'));
  document.getElementById('random').checked = prefs.random;
  document.getElementById('update').checked = prefs.update;
  document.getElementById('scope').value = prefs.scope.join(', ');
  document.getElementById('whitelist').value = prefs.whitelist.join(', ');
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

document.addEventListener('submit', async e => {
  e.preventDefault();

  try {
    const scope = document.getElementById('scope').value.split(/\s*,\s*/).filter(a => a);
    if (scope.length === 0) {
      scope.push('*://*/*');
    }

    const whitelist = document.getElementById('whitelist').value.split(/\s*,\s*/).filter(a => a);

    // Test scoping
    await chrome.scripting.unregisterContentScripts({
      ids: ['test-script']
    }).catch(() => {});
    await chrome.scripting.registerContentScripts([{
      id: 'test-script',
      world: 'ISOLATED',
      matches: scope,
      excludeMatches: whitelist,
      js: ['/data/inject/test.js']
    }]);
    await chrome.scripting.unregisterContentScripts({
      ids: ['test-script']
    });

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
      notify('Options saved');
    });
  }
  catch (e) {
    console.error(e);
    notify('Issue on "Scope" or "Whitelist" patterns - ' + e.message, 10000);
  }
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
    notify('Double-click to reset!');
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
