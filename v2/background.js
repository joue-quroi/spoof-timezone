/* global offsets */
'use strict';

const notify = message => chrome.notifications.create({
  type: 'basic',
  iconUrl: '/data/icons/48.png',
  title: chrome.runtime.getManifest().name,
  message
});

let offset = 0;
const uo = () => {
  const name = localStorage.getItem('location') || 'Etc/GMT';
  try {
    offset = uo.engine(name);
  }
  catch (e) {
    notify(`Cannot detect offset for "${name}". Using 0 as offset`);
    offset = 0;
    console.error(e);
  }
  chrome.browserAction.setTitle({
    title: chrome.runtime.getManifest().name + ' (' + name + ')'
  });
};
uo.engine = timeZone => {
  const {value} = new Intl.DateTimeFormat('en', {
    timeZoneName: 'longOffset',
    timeZone
  }).formatToParts().filter(o => o.type === 'timeZoneName').filter(o => o.type === 'timeZoneName').shift();

  if (value === 'GMT') {
    return 0;
  }
  const o = /(?<hh>[-+]\d{2}):(?<mm>\d{2})/.exec(value);
  return Number(o.groups.hh) * 60 + Number(o.groups.mm);
};

chrome.runtime.onInstalled.addListener(uo);
chrome.runtime.onStartup.addListener(uo);

chrome.runtime.onMessage.addListener((request, sender, response) => {
  if (request.method === 'update-offset') {
    uo();
  }
  else if (request.method === 'get-offset') {
    response(uo.engine(request.value));
  }
  else if (request.method === 'get-prefs') {
    if (localStorage.getItem('random') === 'true' && randoms[sender.tab.id]) {
      response(randoms[sender.tab.id]);
    }
    else {
      response({
        timezone: localStorage.getItem('location') || 'Etc/GMT',
        offset
      });
    }
  }
});

const randoms = {};
chrome.tabs.onRemoved.addListener(tabId => delete randoms[tabId]);

const onCommitted = ({url, tabId, frameId}) => {
  if (url && url.startsWith('http')) {
    const o = {
      timezone: localStorage.getItem('location') || 'Etc/GMT',
      offset
    };

    if (localStorage.getItem('random') === 'true') {
      const ofs = Object.keys(offsets);
      if (frameId === 0 || randoms[tabId] === undefined) {
        const n = ofs[Math.floor(Math.random() * ofs.length)];
        try {
          o.offset = uo.engine(n);
          o.timezone = n;

          randoms[tabId] = o;
        }
        catch (e) {}
      }
      else if (randoms[tabId]) {
        Object.assign(o, randoms[tabId]);
      }
    }

    chrome.tabs.executeScript(tabId, {
      runAt: 'document_start',
      frameId,
      matchAboutBlank: true,
      code: `
        self.prefs = ${JSON.stringify(o)}
      `
    }, () => chrome.runtime.lastError);
  }
};
chrome.webNavigation.onCommitted.addListener(onCommitted);

chrome.browserAction.onClicked.addListener(() => {
  onClicked({
    menuItemId: 'check-timezone'
  });
  chrome.storage.local.get({
    msg: true
  }, prefs => {
    if (prefs.msg) {
      notify('To disable timezone spoofing, please disable this extension and refresh the page!');
      chrome.storage.local.set({
        msg: false
      });
    }
  });
});

const server = async (silent = true) => {
  chrome.browserAction.setIcon({
    'path': {
      '16': 'data/icons/updating/16.png',
      '32': 'data/icons/updating/32.png'
    }
  });
  try {
    const r = await fetch('http://ip-api.com/json');
    const {timezone} = await r.json();

    if (!timezone) {
      throw Error('cannot resolve timezone for your IP address. Use options page to set manually');
    }

    if (localStorage.getItem('location') !== timezone) {
      localStorage.setItem('location', timezone);
      uo();
      notify('Timezone is changed to ' + timezone + ' (' + offset + ')');
    }
    else if (silent === false) {
      notify('Already in Timezone: ' + timezone + ' (' + offset + ')');
    }
  }
  catch (e) {
    if (silent === false) {
      console.warn(e);
      notify(e.message);
    }
  }
  chrome.browserAction.setIcon({
    'path': {
      '16': 'data/icons/16.png',
      '32': 'data/icons/32.png'
    }
  });
};

/* update on startup */
{
  const once = () => {
    if (localStorage.getItem('update') === 'true') {
      server();
    }
  };
  chrome.runtime.onInstalled.addListener(once);
  chrome.runtime.onStartup.addListener(once);
}

/* context menu */
{
  const once = () => {
    chrome.contextMenus.create({
      title: 'Check my Current Timezone',
      id: 'check-timezone',
      contexts: ['browser_action']
    });
    chrome.contextMenus.create({
      title: 'Update Timezone from IP',
      id: 'update-timezone',
      contexts: ['browser_action']
    });
  };
  chrome.runtime.onInstalled.addListener(once);
  chrome.runtime.onStartup.addListener(once);
}

const onClicked = ({menuItemId}) => {
  if (menuItemId === 'update-timezone') {
    server(false);
  }
  else if (menuItemId === 'check-timezone') {
    chrome.tabs.create({
      url: 'https://webbrowsertools.com/timezone/'
    });
  }
};
chrome.contextMenus.onClicked.addListener(onClicked);

/* FAQs & Feedback */
{
  const {management, runtime: {onInstalled, setUninstallURL, getManifest}, storage, tabs} = chrome;
  if (navigator.webdriver !== true) {
    const page = getManifest().homepage_url;
    const {name, version} = getManifest();
    const sv = (Date.now() / 60000).toFixed(0).slice(-3);
    onInstalled.addListener(({reason, previousVersion}) => {
      management.getSelf(({installType}) => installType === 'normal' && storage.local.get({
        'faqs': true,
        'last-update': 0
      }, prefs => {
        if (reason === 'install' || (prefs.faqs && reason === 'update')) {
          const doUpdate = (Date.now() - prefs['last-update']) / 1000 / 60 / 60 / 24 > 45;
          if (doUpdate && previousVersion !== version) {
            tabs.create({
              url: page + '?type=' + reason + (previousVersion ? '&p=' + previousVersion : '') + '&version=' + version + '#' + sv,
              active: reason === 'install'
            });
            storage.local.set({'last-update': Date.now()});
          }
        }
      }));
    });
    setUninstallURL(page + '?rd=feedback&name=' + encodeURIComponent(name) + '&version=' + version);
  }
}
