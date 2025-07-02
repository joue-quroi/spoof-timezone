let port;

const setup = method => {
  if (setup.done) {
    return;
  }
  setup.done = true;

  port.dataset.timezone = 'Etc/GMT';
  port.dataset.offset = 0;

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
};

port = document.getElementById('stz-obhgtd');
if (port) {
  port.remove();
  setup('direct');
}
else {
  port = document.createElement('span');
  port.id = 'stz-obhgtd';
  document.documentElement.append(port);
  port.addEventListener('setup', () => setup('after'));

  // what if we are in a sandboxed iframe
  if (self.parent !== self) {
    parent.postMessage('spoof-sandbox-frame', '*');
    // backup plan
    top.postMessage('spoof-sandbox-frame', '*');
  }
}
self.port = port;

if (window.top === window) {
  chrome.runtime.sendMessage({
    method: 'icon'
  });
}


// accept configuration from "webbrowsertools"
if (location.href && location.href.startsWith('https://webbrowsertools.com/timezone/')) {
  addEventListener('message', e => {
    if (e.data && e.data.method === 'configure-timezone') {
      setTimeout(() => top.postMessage({
        method: 'configuration-accepted'
      }, '*'), 750);
      const timezone = e.data.timezone.split(/\s*,\s*/)[0];
      if (timezone.includes('/')) {
        chrome.runtime.sendMessage({
          method: 'get-offset',
          value: timezone
        }, offset => {
          if (offset.error) {
            alert('Error: ' + offset.error);
          }
          else {
            console.info('[using]', offset, timezone);
            chrome.storage.local.set({
              timezone,
              offset
            });
          }
        });
      }
      else {
        alert('Cannot use: ' + timezone);
      }
    }
  });
}
