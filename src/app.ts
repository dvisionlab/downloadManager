import "./style.css";

import { downloadManager } from "./downloadManager";

const dm = new downloadManager();

console.log("dm", dm);

// functions to test the download manager:

function generateImageIds(seriesId: string) {
  const imageIds = [];
  for (let i = 0; i < 10; i++) {
    imageIds.push(`${seriesId}image${i}`);
  }
  return imageIds;
}

function add(serieId: string) {
  console.log("add", serieId);
  dm.addSeries(serieId, generateImageIds(serieId));
}

function remove(serieId: string) {
  console.log("remove", serieId);
  dm.removeSeries(serieId);
}

function getNextSlot() {
  const slot = dm.getNextSlot(2);
  if (slot) {
    return slot;
  } else {
    setTimeout(getNextSlot, 50);
  }
}

// @ts-ignore
window.dm = dm;
// @ts-ignore
window.add = add;
// @ts-ignore
window.remove = remove;
// @ts-ignore
window.getNextSlot = getNextSlot;
