const state = active => {
  if (active) {
    self.power.classList.add('on');
    self.power.classList.remove('off');
  }
  else {
    self.power.classList.add('off');
    self.power.classList.remove('on');
  }
};

chrome.storage.local.get({
  active: true
}).then(prefs => state(prefs.active));

self.power.onclick = () => {
  const active = self.power.classList.contains('on') === false;
  chrome.storage.local.set({
    active
  });
  state(active);
};

self.refresh.onclick = async () => {
  const [tab] = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true
  });
  if (tab) {
    chrome.tabs.reload(tab.id);
  }
};
