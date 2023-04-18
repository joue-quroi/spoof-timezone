/* global offsets */

self.importScripts('/data/offsets.js');

const notify = message => chrome.notifications.create({
  type: 'basic',
  iconUrl: '/data/icons/48.png',
  title: chrome.runtime.getManifest().name,
  message
});

const uo = () => new Promise(resolve => chrome.storage.local.get({
  'timezone': 'Etc/GMT'
}, prefs => {
  let offset = 0;
  try {
    offset = uo.engine(prefs.timezone);
    chrome.storage.local.set({
      offset
    });
    resolve({offset, timezone: prefs.timezone});
  }
  catch (e) {
    prefs.timezone = 'Etc/GMT';
    prefs.offset = 0;
    notify(`Cannot detect offset for "${prefs.timezone}". Using 0 as offset`);
    chrome.storage.local.set(prefs);
    console.error(e);
    resolve(prefs);
  }
  chrome.action.setTitle({
    title: chrome.runtime.getManifest().name + ' (' + prefs.timezone + ')'
  });
}));
uo.engine = timeZone => {
  const value = 'GMT' + uo.date.toLocaleString('en', {
    timeZone,
    timeZoneName: 'longOffset'
  }).split('GMT')[1];


  if (value === 'GMT') {
    return 0;
  }
  const o = /(?<hh>[-+]\d{2}):(?<mm>\d{2})/.exec(value);
  return Number(o.groups.hh) * 60 + Number(o.groups.mm);
};
uo.date = new Date();

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
    chrome.storage.local.get({
      random: false,
      timezone: 'Etc/GMT',
      offset: 0
    }, prefs => {
      console.log(prefs);

      if (prefs.random) {
        const key = 'random.' + sender.tab.id;
        chrome.storage.session.get({
          [key]: false
        }, ps => {
          if (ps[key]) {
            response(ps[key]);
          }
          else {
            response(prefs);
          }
        });
      }
      else {
        response(prefs);
      }
    });
    return true;
  }
});

chrome.tabs.onRemoved.addListener(tabId => chrome.storage.session.remove('random.' + tabId));

const onCommitted = ({url, tabId, frameId}) => {
  const send = o => chrome.scripting.executeScript({
    target: {
      tabId,
      frameIds: [frameId]
    },
    injectImmediately: true,
    func: o => {
      self.prefs = o;
      try {
        self.update('committed');
      }
      catch (e) {}
    },
    args: [o]
  }).catch(() => {});

  if (url && url.startsWith('http')) {
    chrome.storage.local.get({
      random: false,
      timezone: 'Etc/GMT',
      offset: 0
    }, prefs => {
      if (prefs.random) {
        const key = 'random.' + tabId;

        chrome.storage.session.get({
          [key]: false
        }, ps => {
          if (frameId === 0 || !ps[key]) {
            const ofs = Object.keys(offsets);
            const n = ofs[Math.floor(Math.random() * ofs.length)];

            try {
              ps[key] = {
                offset: uo.engine(n),
                timezone: n
              };
              chrome.storage.session.set({
                [key]: ps[key]
              });
            }
            catch (e) {}
          }
          send(ps[key] || prefs);
        });
      }
      else {
        send(prefs);
      }
    });
  }
};
chrome.webNavigation.onCommitted.addListener(onCommitted);

chrome.action.onClicked.addListener(() => {
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
  chrome.action.setIcon({
    'path': {
      '16': 'data/icons/updating/16.png',
      '32': 'data/icons/updating/32.png'
    }
  });
  try {
    const r = await fetch('http://ip-api.com/json');
    const {timezone} = await r.json();

    console.log(timezone);

    if (!timezone) {
      throw Error('cannot resolve timezone for your IP address. Use options page to set manually');
    }

    chrome.storage.local.get({
      timezone: 'Etc/GMT'
    }, prefs => {
      if (prefs.timezone !== timezone) {
        chrome.storage.local.set({
          timezone
        }, () => {
          uo().then(({timezone, offset}) => notify('New Timezone: ' + timezone + ' (' + offset + ')'));
        });
      }
      else if (silent === false) {
        notify('Already in Timezone: ' + timezone);
      }
    });
  }
  catch (e) {
    if (silent === false) {
      console.warn(e);
      notify(e.message);
    }
  }
  chrome.action.setIcon({
    'path': {
      '16': 'data/icons/16.png',
      '32': 'data/icons/32.png'
    }
  });
};

/* update on startup */
{
  const once = () => chrome.storage.local.get({
    update: false
  }, prefs => {
    if (prefs.update) {
      server();
    }
  });
  chrome.runtime.onInstalled.addListener(once);
  chrome.runtime.onStartup.addListener(once);
}

/* context menu */
{
  const once = () => {
    chrome.contextMenus.create({
      title: 'Check my Current Timezone',
      id: 'check-timezone',
      contexts: ['action']
    }, () => chrome.runtime.lastError);
    chrome.contextMenus.create({
      title: 'Update Timezone from IP',
      id: 'update-timezone',
      contexts: ['action']
    }, () => chrome.runtime.lastError);
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
