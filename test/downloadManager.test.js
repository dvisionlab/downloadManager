const { downloadManager } = require("../src/downloadManager");

function generateImageIds(seriesId, count = 10) {
  const imageIds = [];
  for (let i = 0; i < count; i++) {
    imageIds.push(`${seriesId}image${i}`);
  }
  return imageIds;
}

describe("downloadManager", () => {
  beforeAll(() => {
    jest.spyOn(console, "log").mockImplementation(() => {});
  });

  test("downloadManager import", () => {
    expect(downloadManager).toBeDefined();
  });

  test("downloadManager constructor", () => {
    const dm = new downloadManager();
    expect(dm).toBeDefined();
  });

  test("add a series to dm", () => {
    const dm = new downloadManager();
    const series1 = generateImageIds("series1", 11);
    dm.addSeries("series1", series1);
    const nextSlot = dm.getNextSlot(5);
    expect(nextSlot).toHaveLength(5);
    expect(nextSlot.map(instance => instance.imageId)).toEqual(
      series1.slice(0, 5)
    );
    expect(nextSlot.map(instance => instance.seriesId)).toEqual(
      new Array(5).fill("series1")
    );
  });

  test("add two series to dm", () => {
    const dm = new downloadManager();
    const series1 = generateImageIds("series1-", 8);
    const series2 = generateImageIds("series2-", 11);
    dm.addSeries("series1-", series1);
    dm.addSeries("series2-", series2);
    const nextSlot = dm.getNextSlot(19);
    expect(nextSlot.slice(0, 8).map(instance => instance.imageId)).toEqual(
      series1
    );
    expect(nextSlot.slice(0, 8).map(instance => instance.seriesId)).toEqual(
      new Array(8).fill("series1-")
    );
    expect(nextSlot.slice(8, 19).map(instance => instance.imageId)).toEqual(
      series2
    );
    expect(nextSlot.slice(8, 19).map(instance => instance.seriesId)).toEqual(
      new Array(11).fill("series2-")
    );
  });

  test("add two series to dm, remove one", () => {
    const dm = new downloadManager();
    const series1 = generateImageIds("series1-", 8);
    const series2 = generateImageIds("series2-", 11);
    dm.addSeries("series1-", series1);
    dm.addSeries("series2-", series2);
    dm.removeSeries("series1-");
    const nextSlot = dm.getNextSlot(11);
    expect(nextSlot.map(instance => instance.imageId)).toEqual(series2);
    expect(nextSlot.map(instance => instance.seriesId)).toEqual(
      new Array(11).fill("series2-")
    );
  });

  test("add two series to dm, remove one after getting a slot", () => {
    const dm = new downloadManager();
    const series1 = generateImageIds("series1-", 8);
    const series2 = generateImageIds("series2-", 11);
    dm.addSeries("series1-", series1);
    dm.addSeries("series2-", series2);
    const nextSlot = dm.getNextSlot(3);
    expect(nextSlot.map(instance => instance.imageId)).toEqual(
      series1.slice(0, 3)
    );
    expect(nextSlot.map(instance => instance.seriesId)).toEqual(
      new Array(3).fill("series1-")
    );
    dm.removeSeries("series1-");
    const nextSlot2 = dm.getNextSlot(3);
    expect(nextSlot2.map(instance => instance.imageId)).toEqual(
      series2.slice(0, 3)
    );
    expect(nextSlot2.map(instance => instance.seriesId)).toEqual(
      new Array(3).fill("series2-")
    );
  });
});
