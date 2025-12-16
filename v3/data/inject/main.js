/*
  Test pages:
    https://webbrowsertools.com/timezone/
    https://greenwichmeantime.com/time-zone/gmt-plus-0/
    https://demo.immich.app/photos -> if new Date is not correct, album is not being loaded
*/

{
  let port = document.getElementById('stz-obhgtd');
  if (port) {
    port.remove();
    port.dispatchEvent(new Event('setup'));
  }
  else {
    port = document.createElement('span');
    port.id = 'stz-obhgtd';
    document.documentElement.append(port);
  }

  const OriginalDate = Date;

  // prefs
  const prefs = {
    updates: [] // update this.#ad of each Date object
  };
  Object.defineProperties(prefs, {
    'offset': {
      get() {
        return parseInt(port.dataset.offset);
      }
    },
    'timezone': {
      get() {
        return port.dataset.timezone;
      }
    }
  });
  port.addEventListener('change', () => prefs.updates.forEach(c => c()));

  // ISO date-time with Z or offset → UTC
  const isoDatetimeWithOffset = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?([.,]\d+)?([Zz]|[+-]\d{2}:?\d{2})$/;
  // ISO date-only → UTC
  const isoDateOnly = /^\d{4}-\d{2}-\d{2}$/;
  const isLocalDateArgs = args => {
    if (args.length === 0) {
      return false;
    }
    if (args.length === 1) {
      const arg = args[0];

      // already Date object → local interpretation irrelevant
      if (arg instanceof Date) {
        return false;
      }
      if (typeof arg === 'number') {
        // milliseconds timestamp
        return false;
      }
      if (typeof arg === 'string') {
        const s = arg.trim();

        if (isoDatetimeWithOffset.test(s) || isoDateOnly.test(s)) return false;
        return true; // everything else (non-ISO string) → local
      }
      return false; // other types → unlikely
    }
    // Multiple numeric arguments → always local
    return true;
  };

  /* Date Spoofing */
  class SpoofDate extends Date {
    #ad; // adjusted date
    #fixed = false;

    #sync() {
      if (isNaN(this)) {
        this.#ad = new OriginalDate('invalid date');
      }
      else {
        const offset = (prefs.offset + super.getTimezoneOffset());
        this.#ad = new OriginalDate(this.getTime() + offset * 60 * 1000);
      }
    }

    constructor(...args) {
      super(...args);

      // user's specified time string does not include timezone.
      // we need to offset it to create correct time difference from current time.
      if (isNaN(this) === false) {
        if (isLocalDateArgs(args)) {
          this.#fixed = true;

          const offset = (prefs.offset + super.getTimezoneOffset());
          this.setTime(this.getTime() - offset * 60 * 1000);
        }
      }

      prefs.updates.push(() => this.#sync());
      this.#sync();
    }
    getTimezoneOffset() {
      if (isNaN(this)) {
        return super.getTimezoneOffset();
      }
      return -1 * prefs.offset;
    }
    /* to string (only supports en locale) */
    toTimeString() {
      if (isNaN(this)) {
        return super.toTimeString();
      }

      const parts = super.toLocaleString.call(this, 'en', {
        timeZone: prefs.timezone,
        timeZoneName: 'longOffset'
      }).split('GMT');

      if (parts.length !== 2) {
        return super.toTimeString();
      }

      const a = 'GMT' + parts[1].replace(':', '');

      const b = super.toLocaleString.call(this, 'en', {
        timeZone: prefs.timezone,
        timeZoneName: 'long'
      }).split(/(AM |PM )/i).pop();

      return super.toTimeString.apply(this.#ad).split(' GMT')[0] + ' ' + a + ' (' + b + ')';
    }
    /* only supports en locale */
    toDateString() {
      return super.toDateString.apply(this.#ad);
    }
    /* only supports en locale */
    toString() {
      if (isNaN(this)) {
        return super.toString();
      }
      return this.toDateString() + ' ' + this.toTimeString();
    }
    toLocaleDateString(...args) {
      args[1] = args[1] || {};
      args[1].timeZone = args[1].timeZone || prefs.timezone;

      return super.toLocaleDateString(...args);
    }
    toLocaleTimeString(...args) {
      args[1] = args[1] || {};
      args[1].timeZone = args[1].timeZone || prefs.timezone;

      return super.toLocaleTimeString(...args);
    }
    toLocaleString(...args) {
      args[1] = args[1] || {};
      args[1].timeZone = args[1].timeZone || prefs.timezone;

      return super.toLocaleString(...args);
    }
    /* get */
    #get(name, ...args) {
      return super[name].call(this.#ad, ...args);
    }
    getDate(...args) {
      return this.#get('getDate', ...args);
    }
    getDay(...args) {
      return this.#get('getDay', ...args);
    }
    getHours(...args) {
      return this.#get('getHours', ...args);
    }
    getMinutes(...args) {
      return this.#get('getMinutes', ...args);
    }
    getMonth(...args) {
      return this.#get('getMonth', ...args);
    }
    getYear(...args) {
      return this.#get('getYear', ...args);
    }
    getFullYear(...args) {
      return this.#get('getFullYear', ...args);
    }
    /* set */
    #set(type, name, args) {
      if (type === 'ad') {
        const n = this.#ad.getTime();
        const r = this.#get(name, ...args);

        return super.setTime(this.getTime() + r - n);
      }
      else {
        const r = super[name](...args);
        this.#sync();

        return r;
      }
    }
    setHours(...args) {
      return this.#set('ad', 'setHours', args);
    }
    setMinutes(...args) {
      return this.#set('ad', 'setMinutes', args);
    }
    setSeconds(...args) {
      return this.#set('ad', 'setSeconds', args);
    }
    setMilliseconds(...args) {
      return this.#set('ad', 'setMilliseconds', args);
    }
    setMonth(...args) {
      return this.#set('ad', 'setMonth', args);
    }
    setDate(...args) {
      return this.#set('ad', 'setDate', args);
    }
    setYear(...args) {
      return this.#set('ad', 'setYear', args);
    }
    setFullYear(...args) {
      return this.#set('ad', 'setFullYear', args);
    }
    setTime(...args) {
      return this.#set('md', 'setTime', args);
    }
    setUTCDate(...args) {
      return this.#set('md', 'setUTCDate', args);
    }
    setUTCFullYear(...args) {
      return this.#set('md', 'setUTCFullYear', args);
    }
    setUTCHours(...args) {
      return this.#set('md', 'setUTCHours', args);
    }
    setUTCMinutes(...args) {
      return this.#set('md', 'setUTCMinutes', args);
    }
    setUTCSeconds(...args) {
      return this.#set('md', 'setUTCSeconds', args);
    }
    setUTCMilliseconds(...args) {
      return this.#set('md', 'setUTCMilliseconds', args);
    }
    setUTCMonth(...args) {
      return this.#set('md', 'setUTCMonth', args);
    }
  }

  /* override */
  self.Date = SpoofDate;
  self.Date = new Proxy(Date, {
    apply(target, self, args) {
      return new SpoofDate(...args);
    }
  });

  /* Intl Spoofing */
  class SpoofDateTimeFormat extends Intl.DateTimeFormat {
    constructor(...args) {
      if (!args[1]) {
        args[1] = {};
      }
      if (!args[1].timeZone) {
        args[1].timeZone = port.dataset.timezone;
      }

      super(...args);
    }
  }
  Intl.DateTimeFormat = SpoofDateTimeFormat;

  Intl.DateTimeFormat = new Proxy(Intl.DateTimeFormat, {
    apply(target, self, args) {
      return new Intl.DateTimeFormat(...args);
    }
  });
}

/* for iframe[sandbox] */
window.addEventListener('message', e => {
  if (e.data === 'spoof-sandbox-frame') {
    e.stopImmediatePropagation();
    e.preventDefault();

    // only if it is not being overwritten
    try {
      if (e.source.Date.name !== 'SpoofDate') {
        e.source.Date = Date;
        console.info('[Spoof Timezone]', 'Direct access is blocked, using parent element', e.source.document, Date, document);
      }
    }
    catch (e) {}
    try {
      if (e.source.Intl.DateTimeFormat.name !== 'SpoofDateTimeFormat') {
        e.source.Intl.DateTimeFormat = Intl.DateTimeFormat;
      }
    }
    catch (e) {}
  }
});
