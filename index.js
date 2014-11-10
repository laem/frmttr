var reference = require('./reference')

/*
	The group determines the formatter used for the value
	The unitLabel is just a string appended to the alt version of the value
*/
module.exports = function(group, unitLabel, precision) {

  /* Returns a formatter function that takes a number as input */
  return function(value) {

    var o = {
      value: value,
      unitLabel: unitLabel,
      precision: precision
    }

  /* The reference returns objects like :
	{
		regular: '23k',
		alt: '23,000,003.658 visits',
		unitLabel: 'visits'
	}

	*/

    var groupExists = Object.keys(reference).indexOf(group) > - 1

    return group == undefined ? reference.regular(o) :
      groupExists ? reference[group](o) : console.log('Use an existing group, or none to get the default formatting')


  }
}
