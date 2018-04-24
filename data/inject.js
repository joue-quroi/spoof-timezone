'use strict';

var script = document.createElement('script');
script.textContent = `{
  Date.prefs = Date.prefs || ['Etc/GMT', 0, (new Date()).getTimezoneOffset()];

  const intl = Intl.DateTimeFormat().resolvedOptions();

  Intl.DateTimeFormat.prototype.resolvedOptions = function() {
    return Object.assign(intl, {
      timeZone: Date.prefs[0]
    });
  };

  const toGMT = offset => {
    const z = n => (n < 10 ? '0' : '') + n;
    const sign = offset <= 0 ? '+' : '-';
    offset = Math.abs(offset);
    return sign + z(offset / 60 | 0) + z(offset % 60);
  }

  const {getTime, getDate, getDay, getFullYear, getHours, getMilliseconds, getMinutes, getMonth, getSeconds, getYear} = Date.prototype;
  const {toDateString, toLocaleString, toString, toTimeString, toLocaleTimeString, toLocaleDateString} = Date.prototype;
  const {setYear, setHours, setTime, setFullYear, setMilliseconds, setMinutes, setMonth, setSeconds, setDate} = Date.prototype;
  const {setUTCDate, setUTCFullYear, setUTCHours, setUTCMilliseconds, setUTCMinutes, setUTCMonth, setUTCSeconds} = Date.prototype;

  Object.defineProperty(Date.prototype, 'nd', {
    get() {
      if (this._nd === undefined) {
        this._nd = new Date(
          getTime.apply(this) + (Date.prefs[2] - Date.prefs[1]) * 60 * 1000
        );
      }
      return this._nd;
    }
  });
  Date.prototype.toLocaleString = function() {
    return toLocaleString.apply(this.nd, arguments);
  };
  Date.prototype.toLocaleTimeString = function() {
    return toLocaleTimeString.apply(this.nd, arguments);
  };
  Date.prototype.toLocaleDateString = function() {
    return toLocaleDateString.apply(this.nd, arguments);
  };
  Date.prototype.toDateString = function() {
    return toDateString.apply(this.nd, arguments);
  };
  Date.prototype.toString = function() {
    return toString.call(this.nd).replace(/([T\\(])[\\+-]\\d+/g, '$1' + toGMT(Date.prefs[1]));
  };
  Date.prototype.toTimeString = function() {
    return toTimeString.call(this.nd).replace(/([T\\(])[\\+-]\\d+/g, '$1' + toGMT(Date.prefs[1]));
  };
  Date.prototype.getDate = function() {
    return getDate.apply(this.nd, arguments);
  };
  Date.prototype.getDay = function() {
    return getDay.apply(this.nd, arguments);
  };
  Date.prototype.getFullYear = function() {
    return getFullYear.apply(this.nd, arguments);
  };
  Date.prototype.getHours = function() {
    return getHours.apply(this.nd, arguments);
  };
  Date.prototype.getMilliseconds = function() {
    return getMilliseconds.apply(this.nd, arguments);
  };
  Date.prototype.getMinutes = function() {
    return getMinutes.apply(this.nd, arguments);
  };
  Date.prototype.getMonth = function() {
    return getMonth.apply(this.nd, arguments);
  };
  Date.prototype.getSeconds = function() {
    return getSeconds.apply(this.nd, arguments);
  };
  Date.prototype.getYear = function() {
    return getYear.apply(this.nd, arguments);
  };

  Date.prototype.setHours = function() {
    const a = getTime.call(this.nd);
    const b = setHours.apply(this.nd, arguments);
    setTime.call(this, getTime.call(this) + b - a);
    return b;
  };
  Date.prototype.setFullYear = function() {
    const a = getTime.call(this.nd);
    const b = setFullYear.apply(this.nd, arguments);
    setTime.call(this, getTime.call(this) + b - a);
    return b;
  };
  Date.prototype.setMilliseconds = function() {
    const a = getTime.call(this.nd);
    const b = setMilliseconds.apply(this.nd, arguments);
    setTime.call(this, getTime.call(this) + b - a);
    return b;
  };
  Date.prototype.setMinutes = function() {
    const a = getTime.call(this.nd);
    const b = setMinutes.apply(this.nd, arguments);
    setTime.call(this, getTime.call(this) + b - a);
    return b;
  };
  Date.prototype.setMonth = function() {
    const a = getTime.call(this.nd);
    const b = setMonth.apply(this.nd, arguments);
    setTime.call(this, getTime.call(this) + b - a);
    return b;
  };
  Date.prototype.setSeconds = function() {
    const a = getTime.call(this.nd);
    const b = setSeconds.apply(this.nd, arguments);
    setTime.call(this, getTime.call(this) + b - a);
    return b;
  };
  Date.prototype.setDate = function() {
    const a = getTime.call(this.nd);
    const b = setDate.apply(this.nd, arguments);
    setTime.call(this, getTime.call(this) + b - a);
    return b;
  };
  Date.prototype.setYear = function() {
    const a = getTime.call(this.nd);
    const b = setYear.apply(this.nd, arguments);
    setTime.call(this, getTime.call(this) + b - a);
    return b;
  };
  Date.prototype.setTime = function() {
    const a = getTime.call(this);
    const b = setTime.apply(this, arguments);
    setTime.call(this.nd, getTime.call(this.nd) + b - a);
    return b;
  };
  Date.prototype.setUTCDate = function() {
    const a = getTime.call(this);
    const b = setUTCDate.apply(this, arguments);
    setTime.call(this.nd, getTime.call(this.nd) + b - a);
    return b;
  };
  Date.prototype.setUTCFullYear = function() {
    const a = getTime.call(this);
    const b = setUTCFullYear.apply(this, arguments);
    setTime.call(this.nd, getTime.call(this.nd) + b - a);
    return b;
  };
  Date.prototype.setUTCHours = function() {
    const a = getTime.call(this);
    const b = setUTCHours.apply(this, arguments);
    setTime.call(this.nd, getTime.call(this.nd) + b - a);
    return b;
  };
  Date.prototype.setUTCMilliseconds = function() {
    const a = getTime.call(this);
    const b = setUTCMilliseconds.apply(this, arguments);
    setTime.call(this.nd, getTime.call(this.nd) + b - a);
    return b;
  };
  Date.prototype.setUTCMinutes = function() {
    const a = getTime.call(this);
    const b = setUTCMinutes.apply(this, arguments);
    setTime.call(this.nd, getTime.call(this.nd) + b - a);
    return b;
  };
  Date.prototype.setUTCMonth = function() {
    const a = getTime.call(this);
    const b = setUTCMonth.apply(this, arguments);
    setTime.call(this.nd, getTime.call(this.nd) + b - a);
    return b;
  };
  Date.prototype.setUTCSeconds = function() {
    const a = getTime.call(this);
    const b = setUTCSeconds.apply(this, arguments);
    setTime.call(this.nd, getTime.call(this.nd) + b - a);
    return b;
  };

  Date.prototype.getTimezoneOffset = function() {
    return Date.prefs[1];
  }
}`;

document.documentElement.appendChild(script);
