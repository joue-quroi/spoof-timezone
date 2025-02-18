/* global offsets */

if (typeof importScripts !== 'undefined') {
  self.importScripts('/data/offsets.js');
}

const notify = message => chrome.notifications.create({
  type: 'basic',
  iconUrl: '/data/icons/48.png',
  title: chrome.runtime.getManifest().name,
  message
}, id => setTimeout(chrome.notifications.clear, 3000, id));

const once = c => {
  const run = () => {
    if (run.done) {
      return;
    }
    run.done = true;
    c();
  };
  chrome.runtime.onInstalled.addListener(run);
  chrome.runtime.onStartup.addListener(run);
};

const uo = async () => {
  const prefs = await chrome.storage.local.get({
    'timezone': 'Etc/GMT'
  });
  try {
    prefs.offset = uo.engine(prefs.timezone);
    chrome.storage.local.set({
      offset: prefs.offset
    });
  }
  catch (e) {
    prefs.timezone = 'Etc/GMT';
    prefs.offset = 0;
    chrome.storage.local.set(prefs);

    notify(`Cannot detect offset for "${prefs.timezone}". Using 0 as offset`);
    console.error(e);
  }
  chrome.action.setTitle({
    title: chrome.runtime.getManifest().name + ' (' + prefs.timezone + ')'
  });
  return prefs;
};
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

once(uo);

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
      '16': '/data/icons/updating/16.png',
      '32': '/data/icons/updating/32.png'
    }
  });
  try {
    const r = await Promise.any([
      fetch('https://ipinfo.io/json').then(r => {
        if (r.ok) {
          return r;
        }
        throw Error('Failed; [' + r.status + '] ' + r.statusText);
      }),
      fetch('http://ip-api.com/json').then(r => {
        if (r.ok) {
          return r;
        }
        throw Error('Failed; [' + r.status + '] ' + r.statusText);
      })
    ]);
    const {timezone} = await r.json();

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
      '16': '/data/icons/16.png',
      '32': '/data/icons/32.png'
    }
  });
};

/* update on startup */
once(async () => {
  const prefs = await chrome.storage.local.get({
    update: false
  });
  if (prefs.update) {
    server();
  }
});

/* context menu */
once(() => {
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
  if (navigator.userAgent.includes('Firefox')) {
    chrome.contextMenus.create({
      id: 'sep',
      contexts: ['action'],
      type: 'separator'
    }, () => chrome.runtime.lastError);
    chrome.contextMenus.create({
      title: 'Options',
      id: 'open-options',
      contexts: ['action']
    }, () => chrome.runtime.lastError);
  }
});

const onClicked = ({menuItemId}) => {
  if (menuItemId === 'update-timezone') {
    server(false);
  }
  else if (menuItemId === 'check-timezone') {
    chrome.tabs.create({
      url: 'https://webbrowsertools.com/timezone/'
    });
  }
  else if (menuItemId === 'open-options') {
    chrome.runtime.openOptionsPage();
  }
};
chrome.contextMenus.onClicked.addListener(onClicked);

/* FAQs & Feedback */
{
  const {management, runtime: {onInstalled, setUninstallURL, getManifest}, storage, tabs} = chrome;
  if (navigator.webdriver !== true) {
    const {homepage_url: page, name, version} = getManifest();
    onInstalled.addListener(({reason, previousVersion}) => {
      management.getSelf(({installType}) => installType === 'normal' && storage.local.get({
        'faqs': true,
        'last-update': 0
      }, prefs => {
        if (reason === 'install' || (prefs.faqs && reason === 'update')) {
          const doUpdate = (Date.now() - prefs['last-update']) / 1000 / 60 / 60 / 24 > 45;
          if (doUpdate && previousVersion !== version) {
            tabs.query({active: true, lastFocusedWindow: true}, tbs => tabs.create({
              url: page + '?version=' + version + (previousVersion ? '&p=' + previousVersion : '') + '&type=' + reason,
              active: reason === 'install',
              ...(tbs && tbs.length && {index: tbs[0].index + 1})
            }));
            storage.local.set({'last-update': Date.now()});
          }
        }
      }));
    });
    setUninstallURL(page + '?rd=feedback&name=' + encodeURIComponent(name) + '&version=' + version);
  }
}
