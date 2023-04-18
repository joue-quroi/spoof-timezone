{
  const port = document.getElementById('stz-obhgtd');
  port.remove();

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

  /* Date Spoofing */

  class SpoofDate extends Date {
    #ad; // adjusted date

    #sync() {
      const offset = (prefs.offset + super.getTimezoneOffset());
      this.#ad = new OriginalDate(this.getTime() + offset * 60 * 1000);
    }

    constructor(...args) {
      super(...args);

      prefs.updates.push(() => this.#sync());
      this.#sync();
    }
    getTimezoneOffset() {
      return prefs.offset;
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
