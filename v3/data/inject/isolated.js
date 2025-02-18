const port = self.port = document.getElementById('stz-obhgtd');
if (port) {
  port.dataset.timezone = 'Etc/GMT';
  port.dataset.offset = 0;
  port.remove();

  // eslint-disable-next-line no-unused-vars
  self.update = reason => {
    port.dataset.timezone = self.prefs.timezone;
    port.dataset.offset = self.prefs.offset;

    port.dispatchEvent(new Event('change'));
  };

  if (typeof self.prefs === 'undefined') {
    try {
      if (self !== parent) {
        self.prefs = parent.prefs;
      }
    }
    catch (e) {}
  }

  // ask from bg (just as a backup)
  if (typeof self.prefs === 'undefined') {
    setTimeout(() => {
      if (typeof self.prefs === 'undefined') {
        chrome.runtime.sendMessage({
          method: 'get-prefs'
        }, prefs => {
          self.prefs = prefs;
          self.update('ask from bg');
        });
      }
    }, 500);
  }
  else {
    self.update('top frame or committed');
  }

  // updates
  chrome.storage.onChanged.addListener(ps => {
    if (ps.offset) {
      self.prefs.offset = ps.offset.newValue;
    }
    if (ps.timezone) {
      self.prefs.timezone = ps.timezone.newValue;
    }
    if (ps.offset || ps.timezone) {
      self.update('updated');
    }
  });
}
// main script was not successful. Let's use the parent references for this frame element
else {
  parent.postMessage('spoof-sandbox-frame', '*');
  // backup plan
  top.postMessage('spoof-sandbox-frame', '*');
}
