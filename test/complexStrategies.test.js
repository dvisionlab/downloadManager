const { DownloadManager } = require("../src/downloadManager");

function generateImageIds(seriesId, count = 10) {
  const imageIds = [];
  for (let i = 0; i < count; i++) {
    imageIds.push(`${seriesId}image${i}`);
  }
  return imageIds;
}

function addDummySeries(manager) {
  const images1 = generateImageIds("1-", 8);
  const images2 = generateImageIds("2-", 11);
  const images3 = generateImageIds("3-", 5);
  manager.addSeries("k1", "A", "1", images1);
  manager.addSeries("k2", "B", "2", images2);
  manager.addSeries("k3", "C", "3", images3);
}

describe("three parted strategy", () => {
  test("first images first", () => {
    const dm = new DownloadManager("threeParted");
    addDummySeries(dm);
    const nextSlot = dm.getNextSlot(3);
    expect(nextSlot).toEqual([
      { imageId: "1-image0", key: "k1", seriesId: "A", studyId: "1" },
      { imageId: "2-image0", key: "k2", seriesId: "B", studyId: "2" },
      { imageId: "3-image0", key: "k3", seriesId: "C", studyId: "3" }
    ]);
  });

  test("no active key", () => {
    const dm = new DownloadManager("threeParted");
    addDummySeries(dm);
    dm.getNextSlot(3);
    expect(dm.getNextSlot(3)).toEqual([
      {
        imageId: "1-image1",
        key: "k1",
        seriesId: "A",
        studyId: "1",
        originalIndex: 1
      },
      {
        imageId: "1-image2",
        key: "k1",
        seriesId: "A",
        studyId: "1",
        originalIndex: 2
      },
      {
        imageId: "1-image3",
        key: "k1",
        seriesId: "A",
        studyId: "1",
        originalIndex: 3
      }
    ]);
  });

  test("active key, no active index", () => {
    const dm = new DownloadManager("threeParted");
    addDummySeries(dm);
    dm.activeKey = "k2";
    dm.getNextSlot(3); // pass first images
    expect(dm.getNextSlot(3)).toEqual([
      {
        imageId: "2-image1",
        key: "k2",
        seriesId: "B",
        studyId: "2",
        originalIndex: 1
      },
      {
        imageId: "2-image2",
        key: "k2",
        seriesId: "B",
        studyId: "2",
        originalIndex: 2
      },
      {
        imageId: "2-image3",
        key: "k2",
        seriesId: "B",
        studyId: "2",
        originalIndex: 3
      }
    ]);
  });

  test("active key, active index", () => {
    const dm = new DownloadManager("threeParted");
    addDummySeries(dm);
    dm.activeKey = "k2";
    dm.activeIndex = 5;
    dm.getNextSlot(3); // pass first images
    expect(dm.getNextSlot(3)).toEqual([
      {
        imageId: "2-image5",
        key: "k2",
        seriesId: "B",
        studyId: "2",
        originalIndex: 5
      },
      {
        imageId: "2-image6",
        key: "k2",
        seriesId: "B",
        studyId: "2",
        originalIndex: 6
      },
      {
        imageId: "2-image4",
        key: "k2",
        seriesId: "B",
        studyId: "2",
        originalIndex: 4
      }
    ]);
    dm.getNextSlot(7); // pass series k2
    expect(dm.getNextSlot(3)).toEqual([
      {
        imageId: "3-image1",
        key: "k3",
        seriesId: "C",
        studyId: "3",
        originalIndex: 1
      },
      {
        imageId: "3-image2",
        key: "k3",
        seriesId: "C",
        studyId: "3",
        originalIndex: 2
      },
      {
        imageId: "3-image3",
        key: "k3",
        seriesId: "C",
        studyId: "3",
        originalIndex: 3
      }
    ]);
  });
});
