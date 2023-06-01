import { addingQueueItem, downloadQueueItem } from "./types.d";

/**
 * Concatenate the adding queue to the download queue
 */
function concat(adding: addingQueueItem[], actual: downloadQueueItem[]) {
  adding.forEach(item => {
    item.imageIds.forEach(imageId => {
      actual.push({
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

  let seriesIds = new Set(actual.map(item => item.seriesId));
  adding.forEach(item => seriesIds.add(item.seriesId));
  let seriesIdsArray = Array.from(seriesIds);

  let addingObjectsArray: downloadQueueItem[] = adding
    .map(object =>
      object.imageIds.map(imageId => ({ seriesId: object.seriesId, imageId }))
    )
    .flat();

  let allImages = addingObjectsArray.concat(actual);
  let numberOfTotalImages = allImages.length;

  for (let i = 0; i < numberOfTotalImages; i++) {
    let seriesToPush = seriesIdsArray[i % seriesIds.size];

    let imageToPushIndex = allImages.findIndex(
      item => item.seriesId === seriesToPush
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
