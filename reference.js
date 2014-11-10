// Import a renamed version of d3 with just the formatting methods
// It should avoid compatibility issues
require('./d3f')

/* o looks like :
	{
		value: 567.456,
		unitLabel: 'km'
	}
	*/
function format(fmt, o, appendUnit) {
  /*
		We're using d3's value formatter https://github.com/mbostock/d3/wiki/Formatting
		*/
  if (o.value === Infinity || o.value === -Infinity) {
    o.value = NaN // These are correctly handled by the formatter
  }
  var unit = appendUnit && o.unitLabel ? ' ' + o.unitLabel : ''
  var number = o.value === 0 ? "0" : d3f.format(fmt)(o.value)
  return number + unit
}

/* Outputs for example 2.5k, 26k, or 245k. */
function shortFormat(o, sign) {

  sign = sign || ''

  var v = Math.abs(o.value)

  if (v < 0.1) {
    return format(sign + ".2f", o)
  } else if (v < 1) {
    return format(sign + ".1f", o)
  } else if (v >= 1) {
    var reste = d3f.formatPrefix(v).scale(v) // e.g. 17 892 -> 17.892
    if (reste < 10 && d3f.round(reste) === reste) {
      return format(sign + ".1s", o)
    } else if (reste < 100) {
      return format(sign + ".2s", o)
    } else {
      return format(sign + ".3s", o)
    }
  }
}

/* A more precise, common (US) representation of the value, e.g. 1,234,567.78 */
function altValue(o, sign) {

  sign = sign || ''
  var p = o.precision

  /* Do not add a .00 when value is a round number (thanks d3 for not including this... or did I miss something ?) */
  if (d3f.round(o.value) === o.value) {
    p = 0
  } else if (p == undefined) {
    /* default precision */
    p = 2
  }

  return format(sign + ",." + p + "f", o, true)
}

function rounded(o, sign) {

  sign = sign || ''

  /* Do not add a .00 when value is a round number (thanks d3 for not including this... or did I miss something ?) */

  return format(sign + ",.0f", o, true)
}

module.exports = {

  //TODO test this
  'regular': function(o) {
    return {
      regular: shortFormat(o),
      alt: altValue(o),
      rounded: rounded(o),
      unitLabel: o.unitLabel
    }
  },
  'evolution': function(o) {
    return {
      regular: shortFormat(o, '+'),
      alt: altValue(o, '+'),
      unitLabel: o.unitLabel
    }
  },
  'percentage': function(o) {
    return {
      regular: format(".0%", o),
      alt: format(".2%", o),
      unitLabel: o.unitLabel
    }
  },
  'evolutionPercentage': function(o) {
    return {
      regular: format("+.0%", o),
      alt: format("+.2%", o),
      unitLabel: o.unitLabel
    }
  },
  'humanPercentage': function(o) {
    /* Get a human version of a percentage : 1/3, half, about 20%, ... */
    var human = '1/3' //TODO
    return {
      regular: human,
      alt: format(".0%", o),
      unitLabel: o.unitLabel
    }
  },
  /* Format 185 seconds to 3:5 minutes (alt : 3 minutes and 5 seconds) (TODO)*/
  'minutesSeconds': function(o) {
    return {
      regular: D.formatDuration(o.value),
      alt: D.formatDurationFull(o.value)
    }
  },
  'superShort': function(o) {
    return {
      regular: format(".1s", o),
      alt: format(",.2f", o),
      unitLabel: o.unitLabel
    }
  },

};
