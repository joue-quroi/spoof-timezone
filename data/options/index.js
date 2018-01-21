'use strict';

var offset = document.getElementById('offset');

var toOffset = value => {
  const [en, sign, hh, mm] = /([-+])(\d+):(\d+)/.exec(value);
  return (sign === '-' ? 1 : -1) * (Number(hh) * 60 + Number(mm));
};

offset.addEventListener('change', () => {
  const value = offset.selectedOptions[0].dataset.value;
  document.getElementById('minutes').textContent = toOffset(value);
});

document.addEventListener('DOMContentLoaded', () => {
  offset.value = localStorage.getItem('location') || 'Europe/London';
  offset.dispatchEvent(new Event('change'));
  document.getElementById('random').checked = localStorage.getItem('random') === 'true';
});

document.getElementById('save').addEventListener('click', () => {
  localStorage.setItem('location', offset.value);

  const value = offset.selectedOptions[0].dataset.value;
  localStorage.setItem('offset', toOffset(value));
  localStorage.setItem('random', document.getElementById('random').checked);

  const info = document.getElementById('info');
  info.textContent = 'Options saved';
  window.setTimeout(() => info.textContent = '', 750);
});

document.getElementById('support').addEventListener('click', () => chrome.tabs.create({
  url: chrome.runtime.getManifest().homepage_url + '?rd=donate'
}));
