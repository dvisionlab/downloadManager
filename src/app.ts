import "./style.css";

import { DownloadManager } from "./downloadManager";

const dm = new DownloadManager("concat", true);

console.log("dm", dm);

function updateIsDownloading(bool: boolean) {
  const element = document.getElementById("isDownloading");
  if (element && bool) {
    element.innerHTML = "true";
    element.style.color = "green";
  } else if (element) {
    element.innerHTML = "false";
    element.style.color = "red";
  }
}

function updateStatus(content: {
  [k: string]: { remaining: number; initial: number } | null;
}) {
  if (!content) return;

  const list = document.getElementById("status");
  if (list) {
    list.innerHTML = "";
    for (let key in content) {
      let li = document.createElement("li");
      li.innerText = "series " + key + " >>> " + JSON.stringify(content[key]);
      list.appendChild(li);
    }
  }
}

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
  updateIsDownloading(dm.isDownloading);
  updateStatus(dm.getOverallStatus());
}

function remove(serieId: string) {
  console.log("remove", serieId);
  dm.removeSeries(serieId);
  updateIsDownloading(dm.isDownloading);
  updateStatus(dm.getOverallStatus());
}

async function getNextSlot() {
  const ns = await dm.getNextSlotAsync(2);
  console.log("next slot", ns);
  updateIsDownloading(dm.isDownloading);
  updateStatus(dm.getOverallStatus());
}

// @ts-ignore
window.dm = dm;
// @ts-ignore
window.add = add;
// @ts-ignore
window.remove = remove;
// @ts-ignore
window.getNextSlot = getNextSlot;
