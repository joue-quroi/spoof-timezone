/* globals webext */
'use strict';

var onCommitted = ({tabId}) => {
  const location = localStorage.getItem('location') || 'Europe/London';

  let offset = localStorage.getItem('offset') || 0;
  if (localStorage.getItem('random') === 'true') {
    offset = ['720', '660', '600', '570', '540', '480', '420', '360', '300', '240', '210', '180', '120', '60', '0',
      '-60', '-120', '-180', '-210', '-240', '-270', '-300', '-330', '-345', '-360', '-390', '-420', '-480', '-510',
      '-525', '-540', '-570', '-600', '-630', '-660', '-720', '-765', '-780', '-840'][Math.floor(Math.random() * 39)];
  }
  webext.tabs.executeScript(tabId, {
    runAt: 'document_start',
    allFrames: true,
    code: `document.documentElement.appendChild(Object.assign(document.createElement('script'), {
      textContent: \`{
        const intl = Intl.DateTimeFormat().resolvedOptions();

        Intl.DateTimeFormat.prototype.resolvedOptions = function() {
          return Object.assign(intl, {
            timeZone: '${location}'
          });
        };

        const {toString, toLocaleString, toLocaleTimeString, toLocaleDateString, getTimezoneOffset} = Date.prototype;

        Object.defineProperty(Date.prototype, 'nd', {
          get() {
            if (this._nd === undefined) {
              this._nd = new Date(
                this.getTime() + (this.gTmznffst - ${offset}) * 60 * 1000
              );
            }
            return this._nd;
          }
        });
        Object.defineProperty(Date.prototype, 'gTmznffst', {
          get() {
            return getTimezoneOffset.call(this);
          }
        });
        Date.prototype.toString = function() {
          const z = n => (n < 10 ? '0' : '') + n;
          const toGMT = offset => {
            const sign = offset <= 0 ? '+' : '-';
            offset = Math.abs(offset);
            return sign + z(offset / 60 | 0) + z(offset % 60);
          }
          return toString.call(this.nd).replace(
            toGMT(this.gTmznffst),
            toGMT(${offset})
          ).split('(')[0];
        };
        Date.prototype.toLocaleString = function() {
          return toLocaleString.call(this.nd);
        };
        Date.prototype.toLocaleTimeString = function() {
          return toLocaleTimeString.call(this.nd);
        };
        Date.prototype.toLocaleDateString = function() {
          return toLocaleDateString.call(this.nd);
        };
        Date.prototype.getTimezoneOffset = function() {
          return ${offset};
        }
      }\`
    }))`
  }, () => chrome.runtime.lastError);
};

var update = () => webext.storage.get({
  enabled: true
}).then(({enabled}) => {
  if (enabled) {
    webext.webNavigation.on('committed', onCommitted)
      .if(({frameId, url}) => frameId === 0 && url && url.startsWith('http'));
  }
  else {
    webext.webNavigation.off('committed', onCommitted);
  }
  webext.browserAction.setIcon({
    path: {
      '16': 'data/icons' + (enabled ? '' : '/disabled') + '/16.png',
      '32': 'data/icons' + (enabled ? '' : '/disabled') + '/32.png',
      '48': 'data/icons' + (enabled ? '' : '/disabled') + '/48.png',
      '64': 'data/icons' + (enabled ? '' : '/disabled') + '/64.png',
    }
  });
  webext.browserAction.setTitle({
    title: webext.runtime.getManifest().name + ` (spoofing ${enabled ? 'enabled' : 'disabled'})`
  });
});
webext.storage.on('changed', update).if(p => p.enabled);
// webext.runtime.on('start-up', update);
update();

webext.browserAction.on('clicked', () => webext.storage.get({
  enabled: true
}).then(({enabled}) => webext.storage.set({
  enabled: !enabled
})));

// context=menu
webext.runtime.on('start-up', () => webext.contextMenus.create({
  title: 'Check my current timezone',
  id: 'check-timezone',
  contexts: ['browser_action']
}));
webext.contextMenus.on('clicked', () => webext.tabs.create({
  url: 'http://browserspy.dk/date.php'
})).if(({menuItemId}) => menuItemId === 'check-timezone');
