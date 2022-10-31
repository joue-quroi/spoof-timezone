/* eslint-disable no-extend-native */
const OriginalDate = Date;

const prefs = {
  offset: 390,
  timezone: 'Asia/Rangoon'
};

// const prefs = {
//   offset: -300,
//   timezone: 'America/Toronto'
// };


const fixed = {};
{
  const d = new Date();
  fixed.name = d.toLocaleString('en', {
    timeZone: prefs.timezone,
    timeZoneName: 'long'
  }).split(/(AM |PM )/i).pop();

  fixed.value = 'GMT' + d.toLocaleString('en', {
    timeZone: prefs.timezone,
    timeZoneName: 'longOffset'
  }).split('GMT')[1].replace(':', '');
}

const map = new WeakMap();

{
  class SpoofDate extends Date {
    constructor(...args) {
      super(...args);

      const v = OriginalDate.prototype.getTimezoneOffset.call(this);
      const offset = (prefs.offset + v) * 60 * 1000;

      map.set(this, offset);

      super.setTime(super.getTime() + offset);
    }
  }
  /* override */
  self.Date = SpoofDate;
  self.Date = new Proxy(Date, {
    apply(target, self, args) {
      return new SpoofDate(...args);
    }
  });
}

Date.prototype.getTimezoneOffset = new Proxy(Date.prototype.getTimezoneOffset, {
  apply(target, self, args) {
    return isNaN(self) ? Reflect.apply(target, self, args) : -1 * prefs.offset;
  }
});
Date.prototype.toTimeString = new Proxy(Date.prototype.toTimeString, {
  apply(target, self, args) {
    const r = Reflect.apply(target, self, args);

    if (isNaN(self)) {
      return r;
    }

    return r.split(' GMT')[0] + ' ' + fixed.value + ' (' + fixed.name + ')';
  }
});
Date.prototype.toString = new Proxy(Date.prototype.toString, {
  apply(target, self, args) {
    if (isNaN(self)) {
      return Reflect.apply(target, self, args);
    }
    return self.toDateString() + ' ' + self.toTimeString();
  }
});

Date.prototype.getTime = new Proxy(Date.prototype.getTime, {
  apply(target, self, args) {
    const r = Reflect.apply(target, self, args);
    if (isNaN(self)) {
      return r;
    }
    return r - map.get(self);
  }
});

const locale = (target, self, args) => {
  if (isNaN(self)) {
    return Reflect.apply(target, self, args);
  }

  args[1] = args[1] || {};
  args[1].timeZone = args[1].timeZone || prefs.timezone;

  const n = self.getTime();
  const d = new OriginalDate(n);

  return Reflect.apply(target, d, args);
};

Date.prototype.toLocaleTimeString = new Proxy(Date.prototype.toLocaleTimeString, {
  apply(target, self, args) {
    return locale(target, self, args);
  }
});
Date.prototype.toLocaleDateString = new Proxy(Date.prototype.toLocaleDateString, {
  apply(target, self, args) {
    return locale(target, self, args);
  }
});
Date.prototype.toLocaleString = new Proxy(Date.prototype.toLocaleString, {
  apply(target, self, args) {
    return locale(target, self, args);
  }
});

Date.prototype.setHours = new Proxy(Date.prototype.setHours, {
  apply(target, self, args) {
    Reflect.apply(target, self, args);

    return self.getTime();
  }
});
Date.prototype.setMinutes = new Proxy(Date.prototype.setMinutes, {
  apply(target, self, args) {
    Reflect.apply(target, self, args);

    return self.getTime();
  }
});
Date.prototype.setSeconds = new Proxy(Date.prototype.setSeconds, {
  apply(target, self, args) {
    Reflect.apply(target, self, args);

    return self.getTime();
  }
});
Date.prototype.setMilliseconds = new Proxy(Date.prototype.setMilliseconds, {
  apply(target, self, args) {
    Reflect.apply(target, self, args);

    return self.getTime();
  }
});
Date.prototype.setMonth = new Proxy(Date.prototype.setMonth, {
  apply(target, self, args) {
    Reflect.apply(target, self, args);

    return self.getTime();
  }
});
Date.prototype.setDate = new Proxy(Date.prototype.setDate, {
  apply(target, self, args) {
    Reflect.apply(target, self, args);

    return self.getTime();
  }
});
Date.prototype.setYear = new Proxy(Date.prototype.setYear, {
  apply(target, self, args) {
    Reflect.apply(target, self, args);

    return self.getTime();
  }
});
Date.prototype.setFullYear = new Proxy(Date.prototype.setFullYear, {
  apply(target, self, args) {
    Reflect.apply(target, self, args);

    return self.getTime();
  }
});

Date.prototype.setTime = new Proxy(Date.prototype.setTime, {
  apply(target, self, args) {
    const n = Reflect.apply(target, self, args);

    const v = OriginalDate.prototype.getTimezoneOffset.call(self);
    const offset = (prefs.offset + v) * 60 * 1000;

    map.set(self, offset);

    OriginalDate.prototype.setTime.call(self, n + offset);

    return n;
  }
});

Date.prototype.getUTCDate = new Proxy(Date.prototype.getUTCDate, {
  apply(target, self, args) {
    return locale(target, self, args);
  }
});
Date.prototype.getUTCDay = new Proxy(Date.prototype.getUTCDay, {
  apply(target, self, args) {
    return locale(target, self, args);
  }
});
Date.prototype.getUTCFullYear = new Proxy(Date.prototype.getUTCFullYear, {
  apply(target, self, args) {
    return locale(target, self, args);
  }
});
Date.prototype.getUTCHours = new Proxy(Date.prototype.getUTCHours, {
  apply(target, self, args) {
    return locale(target, self, args);
  }
});
Date.prototype.getUTCMilliseconds = new Proxy(Date.prototype.getUTCMilliseconds, {
  apply(target, self, args) {
    return locale(target, self, args);
  }
});
Date.prototype.getUTCMinutes = new Proxy(Date.prototype.getUTCMinutes, {
  apply(target, self, args) {
    return locale(target, self, args);
  }
});
Date.prototype.getUTCMonth = new Proxy(Date.prototype.getUTCMonth, {
  apply(target, self, args) {
    return locale(target, self, args);
  }
});
Date.prototype.getUTCSeconds = new Proxy(Date.prototype.getUTCSeconds, {
  apply(target, self, args) {
    return locale(target, self, args);
  }
});
Date.prototype.toISOString = new Proxy(Date.prototype.toISOString, {
  apply(target, self, args) {
    return locale(target, self, args);
  }
});
Date.prototype.toGMTString = new Proxy(Date.prototype.toGMTString, {
  apply(target, self, args) {
    return locale(target, self, args);
  }
});
Date.prototype.toJSON = new Proxy(Date.prototype.toJSON, {
  apply(target, self, args) {
    return locale(target, self, args);
  }
});
Date.prototype.toUTCString = new Proxy(Date.prototype.toUTCString, {
  apply(target, self, args) {
    return locale(target, self, args);
  }
});

const set = (target, self, args) => {
  const d = new OriginalDate(self.getTime());
  const n = Reflect.apply(target, d, args);

  const v = OriginalDate.prototype.getTimezoneOffset.call(self);
  const offset = (prefs.offset + v) * 60 * 1000;

  map.set(self, offset);

  OriginalDate.prototype.setTime.call(self, n + offset);

  return n;
};

Date.prototype.setUTCDate = new Proxy(Date.prototype.setUTCDate, {
  apply(target, self, args) {
    return set(target, self, args);
  }
});
Date.prototype.setUTCFullYear = new Proxy(Date.prototype.setUTCFullYear, {
  apply(target, self, args) {
    return set(target, self, args);
  }
});
Date.prototype.setUTCHours = new Proxy(Date.prototype.setUTCHours, {
  apply(target, self, args) {
    return set(target, self, args);
  }
});
Date.prototype.setUTCMilliseconds = new Proxy(Date.prototype.setUTCMilliseconds, {
  apply(target, self, args) {
    return set(target, self, args);
  }
});
Date.prototype.setUTCMinutes = new Proxy(Date.prototype.setUTCMinutes, {
  apply(target, self, args) {
    return set(target, self, args);
  }
});
Date.prototype.setUTCMonth = new Proxy(Date.prototype.setUTCMonth, {
  apply(target, self, args) {
    return set(target, self, args);
  }
});
Date.prototype.setUTCSeconds = new Proxy(Date.prototype.setUTCSeconds, {
  apply(target, self, args) {
    return set(target, self, args);
  }
});


// {
//   const d = new Date('Sat Dec 31 2022 23:00:00 GMT');
//   d.setFullYear(0);
//   console.log(d);
//   console.log('toTimeString', d.toTimeString());
//   console.log('toString', d.toString());
// }

// {
//   const d = new Date(NaN);
//   console.log('toString', d.toString());
//   console.log('getTimezoneOffset', d.getTimezoneOffset());
//   console.log('toLocaleTimeString', d.toLocaleTimeString());
//   console.log('toLocaleDateString', d.toLocaleDateString());
//   console.log('toLocaleString', d.toLocaleString());
//   console.log('getDate', d.getDate());
//   console.log('getDay', d.getDay());
//   console.log('getHours', d.getHours());
//   console.log('getMinutes', d.getMinutes());
//   console.log('getMonth', d.getMonth());
//   console.log('getYear', d.getYear());
//   console.log('getFullYear', d.getFullYear());
// }


const d = new Date('Sat Dec 31 2022 23:00:00 GMT');
console.log('toString', d.toString());
console.log('getTimezoneOffset', d.getTimezoneOffset());
console.log('toLocaleTimeString', d.toLocaleTimeString());
console.log('toLocaleDateString', d.toLocaleDateString());
console.log('toLocaleString', d.toLocaleString());
console.log('getDate', d.getDate());
console.log('getDay', d.getDay());
console.log('getHours', d.getHours());
console.log('getMinutes', d.getMinutes());
console.log('getMonth', d.getMonth());
console.log('getYear', d.getYear());
console.log('getFullYear', d.getFullYear());

console.log(d.getUTCHours() === 23);

console.log(d.setUTCHours(22) === d.getTime());
console.log(d);

const n = d.getTime() + 10 * 60 * 1000;
console.log(d.setTime(n) === n);
console.log(d, d.toString());

console.log(d.getTime() === d.setHours(4));

console.log('---');
d.setHours(24);
console.log('toString', d.toString());

// console.log('---');
// d.setFullYear(0);
// console.log('toTimeString', d.toTimeString());
// console.log('toString', d.toString());

{
  const d = new Date();
  console.log('Diff (ms)', d.getTime() - Date.now());
}

const i = new Intl.DateTimeFormat('en', {
  dateStyle: 'full',
  timeStyle: 'long'
}).format(d);
console.log('Intl.DateTimeFormat', i);


