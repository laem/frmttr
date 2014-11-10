var assert = require('assert')
var frmttr = require('../index.js')

var ae = assert.equal

describe('Basic examples : undefined group', function(){
    it('should return a nice and correct short format', function(){
      var f = frmttr()
      ae(f(34567890.56).regular, '35M')

      ae(f(1).regular, '1')
      ae(f(12).regular, '12')
      ae(f(123).regular, '123')
      ae(f(1234).regular, '1.2k')
      ae(f(12345).regular, '12k')
      ae(f(-123456).regular, '-123k')
      ae(f(1234567).regular, '1.2M')
      ae(f(12345678).regular, '12M')
      ae(f(123456789).regular, '123M')
      ae(f(1234567890).regular, '1.2G')


      ae(f(0.1).regular, '0.1')
      ae(f(0.17).regular, '0.2')
      ae(f(0.01).regular, '0.01')
      ae(f(0.017).regular, '0.02')
      ae(f(0.0001).regular, '0.00')
    })

    it('should show the other options available', function(){
      var f = frmttr()

      ae(f(34567890.56).rounded, '34,567,891')
      ae(f(34567890.56).alt, '34,567,890.56')
    })
})
