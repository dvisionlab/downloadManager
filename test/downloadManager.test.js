import data from "./data.json";
const { DownloadManager } = require("../src/downloadManager");

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
    expect(DownloadManager).toBeDefined();
  });

  test("downloadManager constructor", () => {
    const dm = new DownloadManager();
    expect(dm).toBeDefined();
  });

  test("add a series to dm", () => {
    const dm = new DownloadManager();
    const series1 = generateImageIds("series1", 11);
    dm.addSeries("series1", series1);
    expect(dm.getStatus("series1")).toEqual({
      remaining: 11,
      initial: 11
    });
    const nextSlot = dm.getNextSlot(5);
    expect(nextSlot).toHaveLength(5);
    expect(dm.getStatus("series1")).toEqual({
      remaining: 6,
      initial: 11
    });
    expect(nextSlot.map(instance => instance.imageId)).toEqual(
      series1.slice(0, 5)
    );
    expect(nextSlot.map(instance => instance.seriesId)).toEqual(
      new Array(5).fill("series1")
    );
  });

  test("add two series to dm", () => {
    const dm = new DownloadManager();
    const series1 = generateImageIds("series1-", 8);
    const series2 = generateImageIds("series2-", 11);
    dm.addSeries("series1-", series1);
    dm.addSeries("series2-", series2);
    expect(dm.getStatus("series1-")).toEqual({
      remaining: 8,
      initial: 8
    });
    expect(dm.getStatus("series2-")).toEqual({
      remaining: 11,
      initial: 11
    });
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
    const dm = new DownloadManager();
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
    const dm = new DownloadManager();
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

  test("get slots until the end", () => {
    const dm = new DownloadManager();
    const series1 = generateImageIds("series1-", 8);
    const series2 = generateImageIds("series2-", 11);
    dm.addSeries("series1-", series1);
    dm.addSeries("series2-", series2);

    for (let i = 0; i < 3; i++) {
      expect(dm.getNextSlot(5)).toHaveLength(5);
    }
    expect(dm.getNextSlot(5)).toHaveLength(4);
    expect(dm.getNextSlot(5)).toHaveLength(0);
  });

  test("async getNextSlot", async () => {
    const dm = new DownloadManager();
    const series1 = generateImageIds("series1-", 8);
    const series2 = generateImageIds("series2-", 11);
    dm.addSeries("series1-", series1);
    dm.addSeries("series2-", series2);

    const nextSlot = await dm.getNextSlotAsync(5);
    expect(nextSlot).toHaveLength(5);
    expect(nextSlot.map(instance => instance.imageId)).toEqual(
      series1.slice(0, 5)
    );
    expect(nextSlot.map(instance => instance.seriesId)).toEqual(
      new Array(5).fill("series1-")
    );
  });
});

describe("alternate strategy", () => {
  test("add a series to dm", () => {
    const dm = new DownloadManager("alternate");
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
    const dm = new DownloadManager();
    const series1 = generateImageIds("series1-", 3);
    const series2 = generateImageIds("series2-", 6);
    dm.addSeries("series1-", series1);
    dm.addSeries("series2-", series2);
    const nextSlot = dm.getNextSlot(9);
    expect(nextSlot).toEqual(data.alternate2add);
  });

  test("add three series to dm", () => {
    const dm = new DownloadManager();
    const series1 = generateImageIds("series1-", 6);
    const series2 = generateImageIds("series2-", 7);
    const series3 = generateImageIds("series3-", 11);
    dm.addSeries("series1-", series1);
    dm.addSeries("series2-", series2);
    dm.addSeries("series3-", series3);
    const nextSlot = dm.getNextSlot(24);
    expect(nextSlot).toEqual(data.alternate3add);
  });

  test("get slots until the end", () => {
    const dm = new DownloadManager("alternate");
    const series1 = generateImageIds("series1-", 5);
    const series2 = generateImageIds("series2-", 6);
    const series3 = generateImageIds("series2-", 8);
    dm.addSeries("series1-", series1);
    dm.addSeries("series2-", series2);
    dm.addSeries("series3-", series3);

    for (let i = 0; i < 3; i++) {
      expect(dm.getNextSlot(5)).toHaveLength(5);
    }
    expect(dm.getNextSlot(5)).toHaveLength(4);
    expect(dm.getNextSlot(5)).toHaveLength(0);
  });
});

describe("odd user behaviour", () => {
  test("get slot without adding series", () => {
    const dm = new DownloadManager();
    const nextSlot = dm.getNextSlot(5);
    expect(nextSlot).toHaveLength(0);
  });

  test("remove series that was not added", () => {
    const dm = new DownloadManager();
    dm.removeSeries("series1");
    const nextSlot = dm.getNextSlot(5);
    expect(nextSlot).toHaveLength(0);
  });
});
