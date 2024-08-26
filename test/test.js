var assert = require('assert');
const { countCoveredNumbers } = require('../Profiler_panel/helpers');

describe('CoveredBytes', function () {
  describe('intersecting ranges', function () {
    it('', function () {
      // 6, 4, 3, 6
      assert.equal(countCoveredNumbers([[10, 15], [5, 12], [18, 20], [25, 30]]), 19);
    });
  });
  describe('independent ranges', function () {
    it('', function () {
      // 6, 4, 3, 6
      assert.equal(countCoveredNumbers([[10, 15], [16, 20], [24, 30]]), 18);
    });
  });
});