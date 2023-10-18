import { DownloadManager } from "./downloadManager";

const strategy = "threeParted";
const verbose = true;
const dm = new DownloadManager(strategy, verbose);

const strategyLabel = document.getElementById("strategy");
strategyLabel!.innerHTML = strategy;
const verboseLabel = document.getElementById("verbose");
verboseLabel!.innerHTML = dm.verbose.toString();

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

function updateActiveIndex(index: string) {
  const element = document.getElementById("indexlabel");
  if (element) {
    element.innerHTML = `activeIndex: ${index.toString()}`;
  }
  dm.activeIndex = parseInt(index);
}

function updateIndex(index: string) {
  const element = document.getElementById("sliderlabel");
  if (element) {
    element.innerHTML = `Index: ${index.toString()} |`;
  }
}

// functions to test the download manager:

function generateImageIds(seriesId: string, numberOfImages: number = 10) {
  const imageIds: string[] = [];
  for (let i = 0; i < numberOfImages; i++) {
    imageIds.push(`${seriesId}image${i}`);
  }
  return imageIds;
}

function clearOtherButtons(key: string) {
  const container = document.getElementById("series-container");
  const buttons = container!.querySelectorAll("button");
  buttons.forEach(b => {
    if (b.innerText !== key) {
      b.style.backgroundColor = "";
    }
  });
}

function appendButton(key: string) {
  const button = document.createElement("button");
  button.id = key;
  button.innerText = key;
  button.className = "m-2 btn-lg";
  button.onclick = () => {
    // make the button green
    button.style.backgroundColor = "yellow";
    clearOtherButtons(key);
    dm.activeKey = key;
  };
  const container = document.getElementById("series-container");
  container!.appendChild(button);
}

function add(
  key: string,
  serieId: string,
  studyId: string,
  numberOfImages: number
) {
  console.log("add", serieId);
  appendButton(key);
  dm.addSeries(
    key,
    serieId,
    studyId,
    generateImageIds(serieId, numberOfImages)
  );
  updateIsDownloading(dm.isDownloading);
  updateStatus(dm.getOverallStatus());
}

function remove(key: string) {
  console.log("remove", key);
  const btn = document.getElementById(key);
  if (btn) btn.remove();
  dm.removeSeries(key);
  updateIsDownloading(dm.isDownloading);
  updateStatus(dm.getOverallStatus());
  // maybe the active series is changed, update the button
  if (dm.activeKey) {
    const activeBtn = document.getElementById(dm.activeKey);
    if (activeBtn) activeBtn.style.backgroundColor = "yellow";
    clearOtherButtons(dm.activeKey);
  }
}

async function getNextSlot() {
  const ns = await dm.getNextSlotAsync(2);
  console.log("next slot", ns);
  updateIsDownloading(dm.isDownloading);
  updateStatus(dm.getOverallStatus());
  // maybe the active series is changed, update the button
  if (dm.activeKey) {
    const activeBtn = document.getElementById(dm.activeKey);
    if (activeBtn) activeBtn.style.backgroundColor = "yellow";
    clearOtherButtons(dm.activeKey);
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
// @ts-ignore
window.updateIndex = updateIndex;
// @ts-ignore
window.updateActiveIndex = updateActiveIndex;
