var assert = require('assert');
const { countCoveredNumbers } = require('../Profiler_panel/helpers');

describe('Bytes', function () {
  describe('covered bytes', function () {
    it('intersecting ranges', function () {
      // 6, 4, 3, 6
      assert.equal(countCoveredNumbers([[10, 15], [5, 12], [18, 20], [25, 30]]), 19);
    });
  });
});