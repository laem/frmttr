!function(){
  var d3f = {version: "3.4.13"}; // semver
function d3f_class(ctor, properties) {
  for (var key in properties) {
    Object.defineProperty(ctor.prototype, key, {
      value: properties[key],
      enumerable: false
    });
  }
}

d3f.map = function(object) {
  var map = new d3f_Map;
  if (object instanceof d3f_Map) object.forEach(function(key, value) { map.set(key, value); });
  else for (var key in object) map.set(key, object[key]);
  return map;
};

function d3f_Map() {
  this._ = Object.create(null);
}

var d3f_map_proto = "__proto__",
    d3f_map_zero = "\0";

d3f_class(d3f_Map, {
  has: d3f_map_has,
  get: function(key) {
    return this._[d3f_map_escape(key)];
  },
  set: function(key, value) {
    return this._[d3f_map_escape(key)] = value;
  },
  remove: d3f_map_remove,
  keys: d3f_map_keys,
  values: function() {
    var values = [];
    for (var key in this._) values.push(this._[key]);
    return values;
  },
  entries: function() {
    var entries = [];
    for (var key in this._) entries.push({key: d3f_map_unescape(key), value: this._[key]});
    return entries;
  },
  size: d3f_map_size,
  empty: d3f_map_empty,
  forEach: function(f) {
    for (var key in this._) f.call(this, d3f_map_unescape(key), this._[key]);
  }
});

function d3f_map_escape(key) {
  return (key += "") === d3f_map_proto || key[0] === d3f_map_zero ? d3f_map_zero + key : key;
}

function d3f_map_unescape(key) {
  return (key += "")[0] === d3f_map_zero ? key.slice(1) : key;
}

function d3f_map_has(key) {
  return d3f_map_escape(key) in this._;
}

function d3f_map_remove(key) {
  return (key = d3f_map_escape(key)) in this._ && delete this._[key];
}

function d3f_map_keys() {
  var keys = [];
  for (var key in this._) keys.push(d3f_map_unescape(key));
  return keys;
}

function d3f_map_size() {
  var size = 0;
  for (var key in this._) ++size;
  return size;
}

function d3f_map_empty() {
  for (var key in this._) return false;
  return true;
}
function d3f_identity(d) {
  return d;
}
function d3f_format_precision(x, p) {
  return p - (x ? Math.ceil(Math.log(x) / Math.LN10) : 1);
}
d3f.round = function(x, n) {
  return n
      ? Math.round(x * (n = Math.pow(10, n))) / n
      : Math.round(x);
};
var abs = Math.abs;

var d3f_formatPrefixes = ["y","z","a","f","p","n","µ","m","","k","M","G","T","P","E","Z","Y"].map(d3f_formatPrefix);

d3f.formatPrefix = function(value, precision) {
  var i = 0;
  if (value) {
    if (value < 0) value *= -1;
    if (precision) value = d3f.round(value, d3f_format_precision(value, precision));
    i = 1 + Math.floor(1e-12 + Math.log(value) / Math.LN10);
    i = Math.max(-24, Math.min(24, Math.floor((i - 1) / 3) * 3));
  }
  return d3f_formatPrefixes[8 + i / 3];
};

function d3f_formatPrefix(d, i) {
  var k = Math.pow(10, abs(8 - i) * 3);
  return {
    scale: i > 8 ? function(d) { return d / k; } : function(d) { return d * k; },
    symbol: d
  };
}

function d3f_locale_numberFormat(locale) {
  var locale_decimal = locale.decimal,
      locale_thousands = locale.thousands,
      locale_grouping = locale.grouping,
      locale_currency = locale.currency,
      formatGroup = locale_grouping && locale_thousands ? function(value, width) {
        var i = value.length,
            t = [],
            j = 0,
            g = locale_grouping[0],
            length = 0;
        while (i > 0 && g > 0) {
          if (length + g + 1 > width) g = Math.max(1, width - length);
          t.push(value.substring(i -= g, i + g));
          if ((length += g + 1) > width) break;
          g = locale_grouping[j = (j + 1) % locale_grouping.length];
        }
        return t.reverse().join(locale_thousands);
      } : d3f_identity;

  return function(specifier) {
    var match = d3f_format_re.exec(specifier),
        fill = match[1] || " ",
        align = match[2] || ">",
        sign = match[3] || "-",
        symbol = match[4] || "",
        zfill = match[5],
        width = +match[6],
        comma = match[7],
        precision = match[8],
        type = match[9],
        scale = 1,
        prefix = "",
        suffix = "",
        integer = false,
        exponent = true;

    if (precision) precision = +precision.substring(1);

    if (zfill || fill === "0" && align === "=") {
      zfill = fill = "0";
      align = "=";
    }

    switch (type) {
      case "n": comma = true; type = "g"; break;
      case "%": scale = 100; suffix = "%"; type = "f"; break;
      case "p": scale = 100; suffix = "%"; type = "r"; break;
      case "b":
      case "o":
      case "x":
      case "X": if (symbol === "#") prefix = "0" + type.toLowerCase();
      case "c": exponent = false;
      case "d": integer = true; precision = 0; break;
      case "s": scale = -1; type = "r"; break;
    }

    if (symbol === "$") prefix = locale_currency[0], suffix = locale_currency[1];

    // If no precision is specified for r, fallback to general notation.
    if (type == "r" && !precision) type = "g";

    // Ensure that the requested precision is in the supported range.
    if (precision != null) {
      if (type == "g") precision = Math.max(1, Math.min(21, precision));
      else if (type == "e" || type == "f") precision = Math.max(0, Math.min(20, precision));
    }

    type = d3f_format_types.get(type) || d3f_format_typeDefault;

    var zcomma = zfill && comma;

    return function(value) {
      var fullSuffix = suffix;

      // Return the empty string for floats formatted as ints.
      if (integer && (value % 1)) return "";

      // Convert negative to positive, and record the sign prefix.
      var negative = value < 0 || value === 0 && 1 / value < 0 ? (value = -value, "-") : sign === "-" ? "" : sign;

      // Apply the scale, computing it from the value's exponent for si format.
      // Preserve the existing suffix, if any, such as the currency symbol.
      if (scale < 0) {
        var unit = d3f.formatPrefix(value, precision);
        value = unit.scale(value);
        fullSuffix = unit.symbol + suffix;
      } else {
        value *= scale;
      }

      // Convert to the desired precision.
      value = type(value, precision);

      // Break the value into the integer part (before) and decimal part (after).
      var i = value.lastIndexOf("."),
          before,
          after;
      if (i < 0) {
        // If there is no decimal, break on "e" where appropriate.
        var j = exponent ? value.lastIndexOf("e") : -1;
        if (j < 0) before = value, after = "";
        else before = value.substring(0, j), after = value.substring(j);
      } else {
        before = value.substring(0, i);
        after = locale_decimal + value.substring(i + 1);
      }

      // If the fill character is not "0", grouping is applied before padding.
      if (!zfill && comma) before = formatGroup(before, Infinity);

      var length = prefix.length + before.length + after.length + (zcomma ? 0 : negative.length),
          padding = length < width ? new Array(length = width - length + 1).join(fill) : "";

      // If the fill character is "0", grouping is applied after padding.
      if (zcomma) before = formatGroup(padding + before, padding.length ? width - after.length : Infinity);

      // Apply prefix.
      negative += prefix;

      // Rejoin integer and decimal parts.
      value = before + after;

      return (align === "<" ? negative + value + padding
            : align === ">" ? padding + negative + value
            : align === "^" ? padding.substring(0, length >>= 1) + negative + value + padding.substring(length)
            : negative + (zcomma ? value : padding + value)) + fullSuffix;
    };
  };
}

// [[fill]align][sign][symbol][0][width][,][.precision][type]
var d3f_format_re = /(?:([^{])?([<>=^]))?([+\- ])?([$#])?(0)?(\d+)?(,)?(\.-?\d+)?([a-z%])?/i;

var d3f_format_types = d3f.map({
  b: function(x) { return x.toString(2); },
  c: function(x) { return String.fromCharCode(x); },
  o: function(x) { return x.toString(8); },
  x: function(x) { return x.toString(16); },
  X: function(x) { return x.toString(16).toUpperCase(); },
  g: function(x, p) { return x.toPrecision(p); },
  e: function(x, p) { return x.toExponential(p); },
  f: function(x, p) { return x.toFixed(p); },
  r: function(x, p) { return (x = d3f.round(x, d3f_format_precision(x, p))).toFixed(Math.max(0, Math.min(20, d3f_format_precision(x * (1 + 1e-15), p)))); }
});

function d3f_format_typeDefault(x) {
  return x + "";
}
d3f.requote = function(s) {
  return s.replace(d3f_requote_re, "\\$&");
};

var d3f_requote_re = /[\\\^\$\*\+\?\|\[\]\(\)\.\{\}]/g;
var d3f_time = d3f.time = {},
    d3f_date = Date;

function d3f_date_utc() {
  this._ = new Date(arguments.length > 1
      ? Date.UTC.apply(this, arguments)
      : arguments[0]);
}

d3f_date_utc.prototype = {
  getDate: function() { return this._.getUTCDate(); },
  getDay: function() { return this._.getUTCDay(); },
  getFullYear: function() { return this._.getUTCFullYear(); },
  getHours: function() { return this._.getUTCHours(); },
  getMilliseconds: function() { return this._.getUTCMilliseconds(); },
  getMinutes: function() { return this._.getUTCMinutes(); },
  getMonth: function() { return this._.getUTCMonth(); },
  getSeconds: function() { return this._.getUTCSeconds(); },
  getTime: function() { return this._.getTime(); },
  getTimezoneOffset: function() { return 0; },
  valueOf: function() { return this._.valueOf(); },
  setDate: function() { d3f_time_prototype.setUTCDate.apply(this._, arguments); },
  setDay: function() { d3f_time_prototype.setUTCDay.apply(this._, arguments); },
  setFullYear: function() { d3f_time_prototype.setUTCFullYear.apply(this._, arguments); },
  setHours: function() { d3f_time_prototype.setUTCHours.apply(this._, arguments); },
  setMilliseconds: function() { d3f_time_prototype.setUTCMilliseconds.apply(this._, arguments); },
  setMinutes: function() { d3f_time_prototype.setUTCMinutes.apply(this._, arguments); },
  setMonth: function() { d3f_time_prototype.setUTCMonth.apply(this._, arguments); },
  setSeconds: function() { d3f_time_prototype.setUTCSeconds.apply(this._, arguments); },
  setTime: function() { d3f_time_prototype.setTime.apply(this._, arguments); }
};

var d3f_time_prototype = Date.prototype;

function d3f_time_interval(local, step, number) {

  function round(date) {
    var d0 = local(date), d1 = offset(d0, 1);
    return date - d0 < d1 - date ? d0 : d1;
  }

  function ceil(date) {
    step(date = local(new d3f_date(date - 1)), 1);
    return date;
  }

  function offset(date, k) {
    step(date = new d3f_date(+date), k);
    return date;
  }

  function range(t0, t1, dt) {
    var time = ceil(t0), times = [];
    if (dt > 1) {
      while (time < t1) {
        if (!(number(time) % dt)) times.push(new Date(+time));
        step(time, 1);
      }
    } else {
      while (time < t1) times.push(new Date(+time)), step(time, 1);
    }
    return times;
  }

  function range_utc(t0, t1, dt) {
    try {
      d3f_date = d3f_date_utc;
      var utc = new d3f_date_utc();
      utc._ = t0;
      return range(utc, t1, dt);
    } finally {
      d3f_date = Date;
    }
  }

  local.floor = local;
  local.round = round;
  local.ceil = ceil;
  local.offset = offset;
  local.range = range;

  var utc = local.utc = d3f_time_interval_utc(local);
  utc.floor = utc;
  utc.round = d3f_time_interval_utc(round);
  utc.ceil = d3f_time_interval_utc(ceil);
  utc.offset = d3f_time_interval_utc(offset);
  utc.range = range_utc;

  return local;
}

function d3f_time_interval_utc(method) {
  return function(date, k) {
    try {
      d3f_date = d3f_date_utc;
      var utc = new d3f_date_utc();
      utc._ = date;
      return method(utc, k)._;
    } finally {
      d3f_date = Date;
    }
  };
}

d3f_time.year = d3f_time_interval(function(date) {
  date = d3f_time.day(date);
  date.setMonth(0, 1);
  return date;
}, function(date, offset) {
  date.setFullYear(date.getFullYear() + offset);
}, function(date) {
  return date.getFullYear();
});

d3f_time.years = d3f_time.year.range;
d3f_time.years.utc = d3f_time.year.utc.range;

d3f_time.day = d3f_time_interval(function(date) {
  var day = new d3f_date(2000, 0);
  day.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
  return day;
}, function(date, offset) {
  date.setDate(date.getDate() + offset);
}, function(date) {
  return date.getDate() - 1;
});

d3f_time.days = d3f_time.day.range;
d3f_time.days.utc = d3f_time.day.utc.range;

d3f_time.dayOfYear = function(date) {
  var year = d3f_time.year(date);
  return Math.floor((date - year - (date.getTimezoneOffset() - year.getTimezoneOffset()) * 6e4) / 864e5);
};

["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"].forEach(function(day, i) {
  i = 7 - i;

  var interval = d3f_time[day] = d3f_time_interval(function(date) {
    (date = d3f_time.day(date)).setDate(date.getDate() - (date.getDay() + i) % 7);
    return date;
  }, function(date, offset) {
    date.setDate(date.getDate() + Math.floor(offset) * 7);
  }, function(date) {
    var day = d3f_time.year(date).getDay();
    return Math.floor((d3f_time.dayOfYear(date) + (day + i) % 7) / 7) - (day !== i);
  });

  d3f_time[day + "s"] = interval.range;
  d3f_time[day + "s"].utc = interval.utc.range;

  d3f_time[day + "OfYear"] = function(date) {
    var day = d3f_time.year(date).getDay();
    return Math.floor((d3f_time.dayOfYear(date) + (day + i) % 7) / 7);
  };
});

d3f_time.week = d3f_time.sunday;
d3f_time.weeks = d3f_time.sunday.range;
d3f_time.weeks.utc = d3f_time.sunday.utc.range;
d3f_time.weekOfYear = d3f_time.sundayOfYear;

function d3f_locale_timeFormat(locale) {
  var locale_dateTime = locale.dateTime,
      locale_date = locale.date,
      locale_time = locale.time,
      locale_periods = locale.periods,
      locale_days = locale.days,
      locale_shortDays = locale.shortDays,
      locale_months = locale.months,
      locale_shortMonths = locale.shortMonths;

  function d3f_time_format(template) {
    var n = template.length;

    function format(date) {
      var string = [],
          i = -1,
          j = 0,
          c,
          p,
          f;
      while (++i < n) {
        if (template.charCodeAt(i) === 37) {
          string.push(template.slice(j, i));
          if ((p = d3f_time_formatPads[c = template.charAt(++i)]) != null) c = template.charAt(++i);
          if (f = d3f_time_formats[c]) c = f(date, p == null ? (c === "e" ? " " : "0") : p);
          string.push(c);
          j = i + 1;
        }
      }
      string.push(template.slice(j, i));
      return string.join("");
    }

    format.parse = function(string) {
      var d = {y: 1900, m: 0, d: 1, H: 0, M: 0, S: 0, L: 0, Z: null},
          i = d3f_time_parse(d, template, string, 0);
      if (i != string.length) return null;

      // The am-pm flag is 0 for AM, and 1 for PM.
      if ("p" in d) d.H = d.H % 12 + d.p * 12;

      // If a time zone is specified, it is always relative to UTC;
      // we need to use d3f_date_utc if we aren’t already.
      var localZ = d.Z != null && d3f_date !== d3f_date_utc,
          date = new (localZ ? d3f_date_utc : d3f_date);

      // Set year, month, date.
      if ("j" in d) date.setFullYear(d.y, 0, d.j);
      else if ("w" in d && ("W" in d || "U" in d)) {
        date.setFullYear(d.y, 0, 1);
        date.setFullYear(d.y, 0, "W" in d
            ? (d.w + 6) % 7 + d.W * 7 - (date.getDay() + 5) % 7
            :  d.w          + d.U * 7 - (date.getDay() + 6) % 7);
      } else date.setFullYear(d.y, d.m, d.d);

      // Set hours, minutes, seconds and milliseconds.
      date.setHours(d.H + (d.Z / 100 | 0), d.M + d.Z % 100, d.S, d.L);

      return localZ ? date._ : date;
    };

    format.toString = function() {
      return template;
    };

    return format;
  }

  function d3f_time_parse(date, template, string, j) {
    var c,
        p,
        t,
        i = 0,
        n = template.length,
        m = string.length;
    while (i < n) {
      if (j >= m) return -1;
      c = template.charCodeAt(i++);
      if (c === 37) {
        t = template.charAt(i++);
        p = d3f_time_parsers[t in d3f_time_formatPads ? template.charAt(i++) : t];
        if (!p || ((j = p(date, string, j)) < 0)) return -1;
      } else if (c != string.charCodeAt(j++)) {
        return -1;
      }
    }
    return j;
  }

  d3f_time_format.utc = function(template) {
    var local = d3f_time_format(template);

    function format(date) {
      try {
        d3f_date = d3f_date_utc;
        var utc = new d3f_date();
        utc._ = date;
        return local(utc);
      } finally {
        d3f_date = Date;
      }
    }

    format.parse = function(string) {
      try {
        d3f_date = d3f_date_utc;
        var date = local.parse(string);
        return date && date._;
      } finally {
        d3f_date = Date;
      }
    };

    format.toString = local.toString;

    return format;
  };

  d3f_time_format.multi =
  d3f_time_format.utc.multi = d3f_time_formatMulti;

  var d3f_time_periodLookup = d3f.map(),
      d3f_time_dayRe = d3f_time_formatRe(locale_days),
      d3f_time_dayLookup = d3f_time_formatLookup(locale_days),
      d3f_time_dayAbbrevRe = d3f_time_formatRe(locale_shortDays),
      d3f_time_dayAbbrevLookup = d3f_time_formatLookup(locale_shortDays),
      d3f_time_monthRe = d3f_time_formatRe(locale_months),
      d3f_time_monthLookup = d3f_time_formatLookup(locale_months),
      d3f_time_monthAbbrevRe = d3f_time_formatRe(locale_shortMonths),
      d3f_time_monthAbbrevLookup = d3f_time_formatLookup(locale_shortMonths);

  locale_periods.forEach(function(p, i) {
    d3f_time_periodLookup.set(p.toLowerCase(), i);
  });

  var d3f_time_formats = {
    a: function(d) { return locale_shortDays[d.getDay()]; },
    A: function(d) { return locale_days[d.getDay()]; },
    b: function(d) { return locale_shortMonths[d.getMonth()]; },
    B: function(d) { return locale_months[d.getMonth()]; },
    c: d3f_time_format(locale_dateTime),
    d: function(d, p) { return d3f_time_formatPad(d.getDate(), p, 2); },
    e: function(d, p) { return d3f_time_formatPad(d.getDate(), p, 2); },
    H: function(d, p) { return d3f_time_formatPad(d.getHours(), p, 2); },
    I: function(d, p) { return d3f_time_formatPad(d.getHours() % 12 || 12, p, 2); },
    j: function(d, p) { return d3f_time_formatPad(1 + d3f_time.dayOfYear(d), p, 3); },
    L: function(d, p) { return d3f_time_formatPad(d.getMilliseconds(), p, 3); },
    m: function(d, p) { return d3f_time_formatPad(d.getMonth() + 1, p, 2); },
    M: function(d, p) { return d3f_time_formatPad(d.getMinutes(), p, 2); },
    p: function(d) { return locale_periods[+(d.getHours() >= 12)]; },
    S: function(d, p) { return d3f_time_formatPad(d.getSeconds(), p, 2); },
    U: function(d, p) { return d3f_time_formatPad(d3f_time.sundayOfYear(d), p, 2); },
    w: function(d) { return d.getDay(); },
    W: function(d, p) { return d3f_time_formatPad(d3f_time.mondayOfYear(d), p, 2); },
    x: d3f_time_format(locale_date),
    X: d3f_time_format(locale_time),
    y: function(d, p) { return d3f_time_formatPad(d.getFullYear() % 100, p, 2); },
    Y: function(d, p) { return d3f_time_formatPad(d.getFullYear() % 10000, p, 4); },
    Z: d3f_time_zone,
    "%": function() { return "%"; }
  };

  var d3f_time_parsers = {
    a: d3f_time_parseWeekdayAbbrev,
    A: d3f_time_parseWeekday,
    b: d3f_time_parseMonthAbbrev,
    B: d3f_time_parseMonth,
    c: d3f_time_parseLocaleFull,
    d: d3f_time_parseDay,
    e: d3f_time_parseDay,
    H: d3f_time_parseHour24,
    I: d3f_time_parseHour24,
    j: d3f_time_parseDayOfYear,
    L: d3f_time_parseMilliseconds,
    m: d3f_time_parseMonthNumber,
    M: d3f_time_parseMinutes,
    p: d3f_time_parseAmPm,
    S: d3f_time_parseSeconds,
    U: d3f_time_parseWeekNumberSunday,
    w: d3f_time_parseWeekdayNumber,
    W: d3f_time_parseWeekNumberMonday,
    x: d3f_time_parseLocaleDate,
    X: d3f_time_parseLocaleTime,
    y: d3f_time_parseYear,
    Y: d3f_time_parseFullYear,
    Z: d3f_time_parseZone,
    "%": d3f_time_parseLiteralPercent
  };

  function d3f_time_parseWeekdayAbbrev(date, string, i) {
    d3f_time_dayAbbrevRe.lastIndex = 0;
    var n = d3f_time_dayAbbrevRe.exec(string.slice(i));
    return n ? (date.w = d3f_time_dayAbbrevLookup.get(n[0].toLowerCase()), i + n[0].length) : -1;
  }

  function d3f_time_parseWeekday(date, string, i) {
    d3f_time_dayRe.lastIndex = 0;
    var n = d3f_time_dayRe.exec(string.slice(i));
    return n ? (date.w = d3f_time_dayLookup.get(n[0].toLowerCase()), i + n[0].length) : -1;
  }

  function d3f_time_parseMonthAbbrev(date, string, i) {
    d3f_time_monthAbbrevRe.lastIndex = 0;
    var n = d3f_time_monthAbbrevRe.exec(string.slice(i));
    return n ? (date.m = d3f_time_monthAbbrevLookup.get(n[0].toLowerCase()), i + n[0].length) : -1;
  }

  function d3f_time_parseMonth(date, string, i) {
    d3f_time_monthRe.lastIndex = 0;
    var n = d3f_time_monthRe.exec(string.slice(i));
    return n ? (date.m = d3f_time_monthLookup.get(n[0].toLowerCase()), i + n[0].length) : -1;
  }

  function d3f_time_parseLocaleFull(date, string, i) {
    return d3f_time_parse(date, d3f_time_formats.c.toString(), string, i);
  }

  function d3f_time_parseLocaleDate(date, string, i) {
    return d3f_time_parse(date, d3f_time_formats.x.toString(), string, i);
  }

  function d3f_time_parseLocaleTime(date, string, i) {
    return d3f_time_parse(date, d3f_time_formats.X.toString(), string, i);
  }

  function d3f_time_parseAmPm(date, string, i) {
    var n = d3f_time_periodLookup.get(string.slice(i, i += 2).toLowerCase());
    return n == null ? -1 : (date.p = n, i);
  }

  return d3f_time_format;
}

var d3f_time_formatPads = {"-": "", "_": " ", "0": "0"},
    d3f_time_numberRe = /^\s*\d+/, // note: ignores next directive
    d3f_time_percentRe = /^%/;

function d3f_time_formatPad(value, fill, width) {
  var sign = value < 0 ? "-" : "",
      string = (sign ? -value : value) + "",
      length = string.length;
  return sign + (length < width ? new Array(width - length + 1).join(fill) + string : string);
}

function d3f_time_formatRe(names) {
  return new RegExp("^(?:" + names.map(d3f.requote).join("|") + ")", "i");
}

function d3f_time_formatLookup(names) {
  var map = new d3f_Map, i = -1, n = names.length;
  while (++i < n) map.set(names[i].toLowerCase(), i);
  return map;
}

function d3f_time_parseWeekdayNumber(date, string, i) {
  d3f_time_numberRe.lastIndex = 0;
  var n = d3f_time_numberRe.exec(string.slice(i, i + 1));
  return n ? (date.w = +n[0], i + n[0].length) : -1;
}

function d3f_time_parseWeekNumberSunday(date, string, i) {
  d3f_time_numberRe.lastIndex = 0;
  var n = d3f_time_numberRe.exec(string.slice(i));
  return n ? (date.U = +n[0], i + n[0].length) : -1;
}

function d3f_time_parseWeekNumberMonday(date, string, i) {
  d3f_time_numberRe.lastIndex = 0;
  var n = d3f_time_numberRe.exec(string.slice(i));
  return n ? (date.W = +n[0], i + n[0].length) : -1;
}

function d3f_time_parseFullYear(date, string, i) {
  d3f_time_numberRe.lastIndex = 0;
  var n = d3f_time_numberRe.exec(string.slice(i, i + 4));
  return n ? (date.y = +n[0], i + n[0].length) : -1;
}

function d3f_time_parseYear(date, string, i) {
  d3f_time_numberRe.lastIndex = 0;
  var n = d3f_time_numberRe.exec(string.slice(i, i + 2));
  return n ? (date.y = d3f_time_expandYear(+n[0]), i + n[0].length) : -1;
}

function d3f_time_parseZone(date, string, i) {
  return /^[+-]\d{4}$/.test(string = string.slice(i, i + 5))
      ? (date.Z = -string, i + 5) // sign differs from getTimezoneOffset!
      : -1;
}

function d3f_time_expandYear(d) {
  return d + (d > 68 ? 1900 : 2000);
}

function d3f_time_parseMonthNumber(date, string, i) {
  d3f_time_numberRe.lastIndex = 0;
  var n = d3f_time_numberRe.exec(string.slice(i, i + 2));
  return n ? (date.m = n[0] - 1, i + n[0].length) : -1;
}

function d3f_time_parseDay(date, string, i) {
  d3f_time_numberRe.lastIndex = 0;
  var n = d3f_time_numberRe.exec(string.slice(i, i + 2));
  return n ? (date.d = +n[0], i + n[0].length) : -1;
}

function d3f_time_parseDayOfYear(date, string, i) {
  d3f_time_numberRe.lastIndex = 0;
  var n = d3f_time_numberRe.exec(string.slice(i, i + 3));
  return n ? (date.j = +n[0], i + n[0].length) : -1;
}

// Note: we don't validate that the hour is in the range [0,23] or [1,12].
function d3f_time_parseHour24(date, string, i) {
  d3f_time_numberRe.lastIndex = 0;
  var n = d3f_time_numberRe.exec(string.slice(i, i + 2));
  return n ? (date.H = +n[0], i + n[0].length) : -1;
}

function d3f_time_parseMinutes(date, string, i) {
  d3f_time_numberRe.lastIndex = 0;
  var n = d3f_time_numberRe.exec(string.slice(i, i + 2));
  return n ? (date.M = +n[0], i + n[0].length) : -1;
}

function d3f_time_parseSeconds(date, string, i) {
  d3f_time_numberRe.lastIndex = 0;
  var n = d3f_time_numberRe.exec(string.slice(i, i + 2));
  return n ? (date.S = +n[0], i + n[0].length) : -1;
}

function d3f_time_parseMilliseconds(date, string, i) {
  d3f_time_numberRe.lastIndex = 0;
  var n = d3f_time_numberRe.exec(string.slice(i, i + 3));
  return n ? (date.L = +n[0], i + n[0].length) : -1;
}

// TODO table of time zone offset names?
function d3f_time_zone(d) {
  var z = d.getTimezoneOffset(),
      zs = z > 0 ? "-" : "+",
      zh = abs(z) / 60 | 0,
      zm = abs(z) % 60;
  return zs + d3f_time_formatPad(zh, "0", 2) + d3f_time_formatPad(zm, "0", 2);
}

function d3f_time_parseLiteralPercent(date, string, i) {
  d3f_time_percentRe.lastIndex = 0;
  var n = d3f_time_percentRe.exec(string.slice(i, i + 1));
  return n ? i + n[0].length : -1;
}

function d3f_time_formatMulti(formats) {
  var n = formats.length, i = -1;
  while (++i < n) formats[i][0] = this(formats[i][0]);
  return function(date) {
    var i = 0, f = formats[i];
    while (!f[1](date)) f = formats[++i];
    return f[0](date);
  };
}

d3f.locale = function(locale) {
  return {
    numberFormat: d3f_locale_numberFormat(locale),
    timeFormat: d3f_locale_timeFormat(locale)
  };
};

var d3f_locale_enUS = d3f.locale({
  decimal: ".",
  thousands: ",",
  grouping: [3],
  currency: ["$", ""],
  dateTime: "%a %b %e %X %Y",
  date: "%m/%d/%Y",
  time: "%H:%M:%S",
  periods: ["AM", "PM"],
  days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  shortDays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  shortMonths: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
});

d3f.format = d3f_locale_enUS.numberFormat;
  if (typeof define === "function" && define.amd) define(d3f);
  else if (typeof module === "object" && module.exports) module.exports = d3f;
  this.d3f = d3f;
}();
