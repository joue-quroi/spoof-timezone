/* globals resolve, offsets */
'use strict';

var df = (new Date()).getTimezoneOffset();

var notify = message => chrome.notifications.create({
  type: 'basic',
  iconUrl: 'data/icons/48.png',
  title: chrome.runtime.getManifest().name,
  message
});

var randoms = {};
chrome.tabs.onRemoved.addListener(tabId => delete randoms[tabId]);

var onCommitted = ({url, tabId, frameId}) => {
  if (url && url.startsWith('http')) {
    let location = localStorage.getItem('location');
    const standard = localStorage.getItem('standard');
    const daylight = localStorage.getItem('daylight');

    let offset = localStorage.getItem('offset') || 0;
    let msg = localStorage.getItem('isDST') === 'false' ? standard : daylight;

    if (localStorage.getItem('random') === 'true') {
      const ofs = Object.keys(offsets);
      if (frameId === 0 || randoms[tabId] === undefined) {
        location = ofs[Math.floor(Math.random() * ofs.length)];
        randoms[tabId] = location;
      }
      else {
        location = randoms[tabId];
      }
      const o = resolve.analyze(location);
      offset = o.offset;
      msg = offset !== o.offset ? o.storage.msg.daylight : o.storage.msg.standard;
    }
    chrome.tabs.executeScript(tabId, {
      runAt: 'document_start',
      frameId,
      matchAboutBlank: true,
      code: `document.documentElement.appendChild(Object.assign(document.createElement('script'), {
        textContent: 'Date.prefs = ["${location}", ${-1 * offset}, ${df}, "${msg}"];'
      })).remove();`
    }, () => chrome.runtime.lastError);
  }
};

var update = () => chrome.storage.local.get({
  enabled: true
}, ({enabled}) => {
  if (enabled) {
    chrome.webNavigation.onCommitted.addListener(onCommitted);
  }
  else {
    chrome.webNavigation.onCommitted.removeListener(onCommitted);
  }
  chrome.browserAction.setIcon({
    path: {
      '16': 'data/icons' + (enabled ? '' : '/disabled') + '/16.png',
      '32': 'data/icons' + (enabled ? '' : '/disabled') + '/32.png',
      '48': 'data/icons' + (enabled ? '' : '/disabled') + '/48.png',
      '64': 'data/icons' + (enabled ? '' : '/disabled') + '/64.png'
    }
  });
  chrome.browserAction.setTitle({
    title: chrome.runtime.getManifest().name + ` (spoofing ${enabled ? 'enabled' : 'disabled'})`
  });
});
chrome.storage.onChanged.addListener(prefs => {
  if (prefs.enabled) {
    update();
  }
});
update();

var set = (timezone = 'Etc/GMT') => {
  const {offset, storage} = resolve.analyze(timezone);
  localStorage.setItem('offset', offset);
  localStorage.setItem('isDST', offset !== storage.offset);
  localStorage.setItem('location', timezone);
  localStorage.setItem('daylight', storage.msg.daylight);
  localStorage.setItem('standard', storage.msg.standard);
};

// browserAction
// chrome.browserAction.onClicked.addListener(() => chrome.storage.local.get({
//   enabled: true
// }, ({enabled}) => chrome.storage.local.set({
//   enabled: !enabled
// })));
chrome.browserAction.onClicked.addListener(() => {
  notify('To disable timezone spoofing, please disable this extension and refresh the page!');
});

var server = async(silent = true) => {
  try {
    const timezone = await resolve.remote();

    if (localStorage.getItem('location') !== timezone) {
      set(timezone);
      notify('Timezone is changed to ' + timezone + ' (' + localStorage.getItem('offset') + ')');
    }
    else if (silent === false) {
      notify('Already in Timezone; ' + localStorage.getItem('offset') + ' (' + timezone + ')');
    }
  }
  catch(e) {
    if (silent === false) {
      notify(e.message);
    }
  }
};

// on installed
chrome.runtime.onInstalled.addListener(() => {
  set(localStorage.getItem('location') || 'Etc/GMT');
});
// update on startup?
{
  const callback = () => {
    if (localStorage.getItem('update') === 'true') {
      server();
    }
  };
  chrome.runtime.onInstalled.addListener(callback);
  chrome.runtime.onStartup.addListener(callback);
}
// context menu
{
  const callback = () => {
    chrome.contextMenus.create({
      title: 'Check my current timezone',
      id: 'check-timezone',
      contexts: ['browser_action']
    });
    chrome.contextMenus.create({
      title: 'Update timezone from IP',
      id: 'update-timezone',
      contexts: ['browser_action']
    });
  };
  chrome.runtime.onInstalled.addListener(callback);
  chrome.runtime.onStartup.addListener(callback);
}

chrome.contextMenus.onClicked.addListener(({menuItemId}) => {
  if (menuItemId === 'update-timezone') {
    server(false);
  }
  else if (menuItemId === 'check-timezone') {
    chrome.tabs.create({
      url: 'http://browserspy.dk/date.php'
    });
  }
});

// FAQs & Feedback
chrome.storage.local.get({
  'version': null,
  'faqs': navigator.userAgent.indexOf('Firefox') === -1,
  'last-update': 0
}, prefs => {
  const version = chrome.runtime.getManifest().version;

  if (prefs.version ? (prefs.faqs && prefs.version !== version) : true) {
    const now = Date.now();
    const doUpdate = (now - prefs['last-update']) / 1000 / 60 / 60 / 24 > 45;
    chrome.storage.local.set({
      version,
      'last-update': doUpdate ? Date.now() : prefs['last-update']
    }, () => {
      // do not display the FAQs page if last-update occurred less than 45 days ago.
      if (doUpdate) {
        const p = Boolean(prefs.version);
        window.setTimeout(() => chrome.tabs.create({
          url: chrome.runtime.getManifest().homepage_url + '?version=' + version +
            '&type=' + (p ? ('upgrade&p=' + prefs.version) : 'install'),
          active: p === false
        }), 3000);
      }
    });
  }
});

{
  const {name, version} = chrome.runtime.getManifest();
  chrome.runtime.setUninstallURL(
    chrome.runtime.getManifest().homepage_url + '?rd=feedback&name=' + name + '&version=' + version
  );
}
