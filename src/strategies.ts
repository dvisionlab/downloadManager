import type { addingQueueItem, downloadQueueItem } from "./types";

/**
 * Concatenate the adding queue to the download queue
 */
function concat(
  adding: addingQueueItem[],
  actual: downloadQueueItem[],
  activeKey: string | null,
  ...args: any[]
) {
  adding.forEach(item => {
    item.imageIds.forEach((imageId, index) => {
      actual.push({
        key: item.key,
        studyId: item.studyId,
        seriesId: item.seriesId,
        imageId: imageId,
        originalIndex: index + 1
      });
    });
  });

  // if active, sort by key
  if (activeKey) {
    actual.sort((a, b) => {
      if (b.key == activeKey && a.key !== activeKey) return 1;
      if (a.key == activeKey && b.key !== activeKey) return -1;
      return 0;
    });
  }

  return actual;
}

/**
 * Create a new queue alternating series
 */
function alternate(
  adding: addingQueueItem[],
  actual: downloadQueueItem[],
  ...args: any[]
) {
  let newQueue: downloadQueueItem[] = [];

  let keys = new Set(actual.map(item => item.key));
  adding.forEach(item => keys.add(item.key));
  let keysArray = Array.from(keys);

  let addingObjectsArray: downloadQueueItem[] = adding
    .map(object =>
      object.imageIds.map(imageId => ({
        key: object.key,
        studyId: object.studyId,
        seriesId: object.seriesId,
        imageId
      }))
    )
    .flat();

  let allImages = addingObjectsArray.concat(actual);
  let numberOfTotalImages = allImages.length;

  for (let i = 0; i < numberOfTotalImages; i++) {
    let seriesToPush = keysArray[i % keys.size];

    let imageToPushIndex = allImages.findIndex(
      item => item.key === seriesToPush
    );
    let imageToPush = allImages.splice(imageToPushIndex, 1).pop();

    if (!imageToPush) {
      throw new Error("imageToPush is undefined");
    }

    newQueue.push(imageToPush);
  }

  return newQueue;
}

/**
 * Create a new queue, using the "propagation" strategy - wip
 */
function propagate(
  adding: addingQueueItem[],
  actual: downloadQueueItem[],
  activeKey: string | null,
  ...args: any[]
) {
  // add new series and sort by active
  let queue = concat(adding, actual, activeKey);

  // get last index of active series in queue array
  // TODO: using custom function even if the same exist in ES2023, because tsc doesn't like it
  let activeLastIndex = findLastIndex(queue, item => item.key === activeKey);

  // get active series subarray
  let activeSubArray = queue.slice(0, activeLastIndex);
  let orderedSubArray = orderArrayFromIndex(activeSubArray);

  // replace active series subarray with ordered subarray
  queue.splice(0, activeSubArray.length, ...orderedSubArray);

  return queue;
}

/**
 * 3-parted queue strategy
 */
function threeParted(
  adding: addingQueueItem[],
  actual: downloadQueueItem[],
  activeKey: string | null,
  activeIndex: number | null,
  qs: [number, number]
) {
  // get the three sections of the queue
  let q1 = actual.slice(0, qs[0]);
  let q2 = actual.slice(qs[0], qs[1]);
  let q3 = actual.slice(qs[1]);
  let currentActiveKey = null;
  if (q2.length > 0) {
    currentActiveKey = q2[0].key;
  }

  console.log("adding");
  // Q1: get the first element of each series in adding queue and push it into q1
  adding.forEach(item => {
    q1.push({
      key: item.key,
      studyId: item.studyId,
      seriesId: item.seriesId,
      imageId: item.imageIds.shift()! // TODO are we sure that imageIds is not empty ?
    });
  });

  console.log("q3concat");
  // Q3: get the remaining elements of each series in adding queue and push it into q3
  q3 = concat(adding, q3, null);

  // Q2: if active key, push the active series in q2. If active index, order by "propagate" method.
  if (activeKey && currentActiveKey && activeKey === currentActiveKey) {
    // if active key is already in q2, do nothing
    console.warn("activeKey is the same");
  }
  // else if (activeKey && currentActiveKey && activeKey !== currentActiveKey){
  else {
    console.log("activeKey changed: q2 => q3");
    // put back active series in q3 (TODO reorder q3?)
    q3 = q3.concat(restoreOriginalOrder(q2));
    // reset q2
    q2 = [];

    q2 = q3.filter(item => item.key === activeKey);
    q3 = q3.filter(item => item.key !== activeKey);
  }

  if (typeof activeIndex === "number") {
    const result = applyActiveIndex(q2, activeIndex);
    console.log("applyActiveIndex", result);
    if (!result) {
      return actual;
    }
    q2 = result;
  }

  // update indices (note that they are updated by reference)
  qs[0] = q1.length;
  qs[1] = q1.length + q2.length;

  const queue = q1.concat(q2).concat(q3);
  return queue;
}

/// utils ///

function applyActiveIndex(q2: downloadQueueItem[], activeIndex: number) {
  // remapping index from original to current
  q2 = restoreOriginalOrder(q2);
  let realIndex = q2.findIndex(item => item.originalIndex === activeIndex);
  if (realIndex < 0) {
    console.warn("activeIndex not found in q2, probably already downloaded");
    return false; // TODO we could get the nearest instead
  }
  return orderArrayFromIndex(q2, realIndex);
}

function restoreOriginalOrder(arr: downloadQueueItem[]) {
  // check if any element dows not have originalIndex
  const hasOriginalIndex = arr.every(item => item.originalIndex !== undefined);
  if (!hasOriginalIndex) {
    throw new Error("Not all elements have an originalIndex");
  }
  return arr.sort((a, b) => a.originalIndex! - b.originalIndex!);
}

function findLastIndex<T>(arr: T[], testFn: (element: T) => boolean): number {
  for (let i = arr.length - 1; i >= 0; i--) {
    if (testFn(arr[i])) {
      return i;
    }
  }
  return -1;
}

function orderArrayFromIndex<T>(arr: T[], index?: number): T[] {
  if (index === undefined) {
    index = Math.floor(arr.length / 2);
  }

  if (index < 0 || index >= arr.length) {
    throw new Error("index out of range");
  }

  // Start with the center element
  const resultArray: T[] = [arr[index]];

  let leftIndex = index - 1;
  let rightIndex = index + 1;

  while (leftIndex >= 0 || rightIndex < arr.length) {
    if (rightIndex < arr.length) {
      resultArray.push(arr[rightIndex]);
      rightIndex++;
    }

    if (leftIndex >= 0) {
      resultArray.push(arr[leftIndex]);
      leftIndex--;
    }
  }

  return resultArray;
}

export default { concat, alternate, propagate, threeParted };
