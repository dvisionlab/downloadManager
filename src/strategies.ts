import type { addingQueueItem, downloadQueueItem } from "./types";

/**
 * Concatenate the adding queue to the download queue
 */
function concat(
  adding: addingQueueItem[],
  actual: downloadQueueItem[],
  active: string | null
) {
  adding.forEach(item => {
    item.imageIds.forEach(imageId => {
      actual.push({
        key: item.key,
        studyId: item.studyId,
        seriesId: item.seriesId,
        imageId: imageId
      });
    });
  });

  // if active, sort by key
  if (active) {
    actual.sort((a, b) => {
      if (b.key == active && a.key !== active) return 1;
      if (a.key == active && b.key !== active) return -1;
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
  active: string | null
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
 * Create a new queue, using the "propagation" strategy
 */
function propagate(
  adding: addingQueueItem[],
  actual: downloadQueueItem[],
  active: string | null
) {
  // add new series and sort by active
  let queue = concat(adding, actual, active);

  // get last index of active series in queue array
  // TODO: using custom function even if the same exist in ES2023, because tsc doesn't like it
  let activeLastIndex = findLastIndex(queue, item => item.key === active);

  // get active series subarray
  let activeSubArray = queue.slice(0, activeLastIndex);
  let orderedSubArray = orderArrayFromCenter(activeSubArray);

  // replace active series subarray with ordered subarray
  queue.splice(0, activeSubArray.length, ...orderedSubArray);

  return queue;
}

/// utils ///

function findLastIndex<T>(arr: T[], testFn: (element: T) => boolean): number {
  for (let i = arr.length - 1; i >= 0; i--) {
    if (testFn(arr[i])) {
      return i;
    }
  }
  return -1;
}

function orderArrayFromCenter<T>(arr: T[]): T[] {
  const centerIndex = Math.floor(arr.length / 2);
  // Start with the center element
  const resultArray: T[] = [arr[centerIndex]];

  let leftIndex = centerIndex - 1;
  let rightIndex = centerIndex + 1;

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

export default { concat, alternate, propagate };
