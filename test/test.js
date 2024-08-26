var assert = require("assert");
const {
  countCoveredNumbers,
  checkValidUrl,
  getLastSegmentFromUrl,
} = require("../Profiler_panel/helpers");

//countCoveredNumbers
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

// checkValidUrl
const id = "gighmmpiobklfepjocnamgkkbiglidom";
describe("Validate URL", function () {
  describe("basic test", function () {
    it("", function () {
      assert.equal(
        checkValidUrl(
          "chrome-extension://gighmmpiobklfepjocnamgkkbiglidom/manifest.json",
          id,
        ),
        true,
      );
    });
  });
  describe("nested directories", function () {
    it("", function () {
      assert.equal(
        checkValidUrl(
          "chrome-extension://gighmmpiobklfepjocnamgkkbiglidom/script/dir/manifest/manifest.json",
          id,
        ),
        true,
      );
    });
  });
  describe("wrong id", function () {
    it("", function () {
      assert.equal(
        checkValidUrl(
          "chrome-extension://gighmmpiobklfepjocnamgkkbiglido1/script/dir/manifest/manifest.json",
          id,
        ),
        false,
      );
    });
  });
  describe("basic wrong format", function () {
    it("", function () {
      assert.equal(checkValidUrl("https://www.google.com/", id), false);
    });
  });
  describe("wrong format", function () {
    it("", function () {
      assert.equal(
        checkValidUrl(
          "https://www.google.com/gighmmpiobklfepjocnamgkkbiglidom/manifest.json",
          id,
        ),
        false,
      );
    });
  });
  describe("missing file", function () {
    it("", function () {
      assert.equal(
        checkValidUrl(
          "chrome-extension://gighmmpiobklfepjocnamgkkbiglidom",
          id,
        ),
        true,
      );
    });
  });
  describe("https protocol", function () {
    it("", function () {
      assert.equal(
        checkValidUrl(
          "https://chrome-extension://gighmmpiobklfepjocnamgkkbiglidom/manifest.json",
          id,
        ),
        false,
      );
    });
  });
  describe("js file", function () {
    it("", function () {
      assert.equal(
        checkValidUrl(
          "chrome-extension://gighmmpiobklfepjocnamgkkbiglidom/script.js",
          id,
        ),
        true,
      );
    });
  });
});

describe("Get file name", function () {
  describe("basic test", function () {
    it("", function () {
      assert.equal(
        getLastSegmentFromUrl(
          "chrome-extension://gighmmpiobklfepjocnamgkkbiglidom/script.js",
          id,
        ),
        "script.js",
      );
    });
  });
  describe("nested directories", function () {
    it("", function () {
      assert.equal(
        getLastSegmentFromUrl(
          "chrome-extension://gighmmpiobklfepjocnamgkkbiglidom/scripts/dir/extension/script.js",
          id,
        ),
        "script.js",
      );
    });
  });
  describe("json file", function () {
    it("", function () {
      assert.equal(
        getLastSegmentFromUrl(
          "chrome-extension://gighmmpiobklfepjocnamgkkbiglidom/scripts/dir/extension/manifest.json",
          id,
        ),
        "manifest.json",
      );
    });
  });
  describe("wrong id", function () {
    it("", function () {
      assert.equal(
        getLastSegmentFromUrl(
          "chrome-extension://gighmmpwobklfepjocnamgkkbiglidom/scripts/manifest.json",
          id,
        ),
        undefined,
      );
    });
  });
  describe("wrong format", function () {
    it("", function () {
      assert.equal(
        getLastSegmentFromUrl(
          "https://chrome-extension://gighmmpiobklfepjocnamgkkbiglidom/scripts/manifest.json",
          id,
        ),
        undefined,
      );
    });
  });
  describe("wrong webpage", function () {
    it("", function () {
      assert.equal(
        getLastSegmentFromUrl(
          "https://i.pinimg.com/564x/46/c1/58/46c1589a4e1ea86c042f982af0cc74c7.jpg",
          id,
        ),
        undefined,
      );
    });
  });
});
