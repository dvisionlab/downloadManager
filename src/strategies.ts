import type { addingQueueItem, downloadQueueItem } from "./types.d";

/**
 * Concatenate the adding queue to the download queue
 */
function concat(adding: addingQueueItem[], actual: downloadQueueItem[]) {
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
  return actual;
}

/**
 * Create a new queue alternating series
 */
function alternate(adding: addingQueueItem[], actual: downloadQueueItem[]) {
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

export default { concat, alternate };
