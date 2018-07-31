/* globals moment, offsets */
'use strict';

var resolve = {};

resolve.remote = () => fetch('http://ip-api.com/json').then(r => r.json()).then(j => {
  if (j && j.timezone) {
    return j.timezone;
  }
  else {
    throw Error('Something went wrong!');
  }
});

resolve.analyze = timezone => {
  const m = moment.tz(Date.now(), timezone);
  const country = timezone.split('/')[1].replace(/[-_]/g, ' ');
  const storage = offsets[timezone];
  storage.msg = storage.msg || {
    'standard': country + ' Standard Time',
    'daylight': country + ' Daylight Time'
  };
  return {
    offset: m.utcOffset(),
    storage
  };
};
