require = require("esm")(module /*, options*/);

var assert = require("assert");

const { transformProfileData } = require("../Profiler_panel/profileutils.js");

describe("TransformedData", function () {
  describe("invalid profile", function () {
    it("returns null for invalid data", function () {
      const invalidProfile = {};
      const result = transformProfileData(invalidProfile);
      assert.equal(result, null);
    });
  });

  describe("valid profile", function () {
    it("transforms valid data correctly", function () {
      const validProfile = {
        nodes: [
          {
            id: 1,
            selfTime: 100,
            children: [2, 3],
            callFrame: { functionName: "root", url: "root.js" },
          },
          {
            id: 2,
            selfTime: 50,
            children: [],
            callFrame: { functionName: "child1", url: "child1.js" },
          },
          {
            id: 3,
            selfTime: 50,
            children: [],
            callFrame: { functionName: "child2", url: "child2.js" },
          },
        ],
        timeDeltas: [100, 50, 50],
      };
      const result = transformProfileData(validProfile);
      const expected = {
        name: "root",
        value: 100,
        children: [
          {
            name: "child1",
            value: 25,
            children: [],
          },
          {
            name: "child2",
            value: 25,
            children: [],
          },
        ],
      };
      assert.equal(JSON.stringify(result), JSON.stringify(expected));
    });
  });
});
