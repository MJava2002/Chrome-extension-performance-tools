var assert = require("assert");
const { countCoveredNumbers } = require("../Profiler_panel/helpers");

describe("CoveredBytes", function () {
  describe("one byte", function () {
    it("", function () {
      assert.equal(countCoveredNumbers([[10, 10]]), 1);
    });
  });
  describe("two bytes", function () {
    it("", function () {
      assert.equal(countCoveredNumbers([[10, 11]]), 2);
    });
  });
  describe("basic test", function () {
    it("", function () {
      assert.equal(countCoveredNumbers([[10, 15]]), 6);
    });
  });
  describe("basic intersect test", function () {
    it("", function () {
      assert.equal(
        countCoveredNumbers([
          [10, 15],
          [15, 16],
        ]),
        7,
      );
    });
  });
  describe("intersecting ranges", function () {
    it("", function () {
      // 10, 11, 12, 13, 14, 15, 5, 6, 7, 8, 9, 18, 19, 20, 25, 26, 27, 28, 29, 30
      assert.equal(
        countCoveredNumbers([
          [10, 15],
          [5, 12],
          [18, 20],
          [25, 30],
        ]),
        20,
      );
    });
  });
  describe("independent ranges", function () {
    it("", function () {
      assert.equal(
        countCoveredNumbers([
          [10, 15],
          [16, 20],
          [24, 30],
        ]),
        18,
      );
    });
  });
});
