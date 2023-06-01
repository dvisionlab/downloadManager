import "./style.css";

import { DownloadManager } from "./downloadManager";

const dm = new DownloadManager("alternate", true);

console.log("dm", dm);

// functions to test the download manager:

function generateImageIds(seriesId: string, numberOfImages: number = 10) {
  const imageIds = [];
  for (let i = 0; i < numberOfImages; i++) {
    imageIds.push(`${seriesId}image${i}`);
  }
  return imageIds;
}

function add(serieId: string, numberOfImages: number) {
  console.log("add", serieId);
  dm.addSeries(serieId, generateImageIds(serieId, numberOfImages));
}

function remove(serieId: string) {
  console.log("remove", serieId);
  dm.removeSeries(serieId);
}

async function getNextSlot() {
  await dm.getNextSlotAsync(2);
}

// @ts-ignore
window.dm = dm;
// @ts-ignore
window.add = add;
// @ts-ignore
window.remove = remove;
// @ts-ignore
window.getNextSlot = getNextSlot;
