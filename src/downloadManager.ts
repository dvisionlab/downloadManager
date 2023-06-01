type addingQueueItem = {
  seriesId: string;
  imageIds: string[];
};

type removingQueueItem = string;

type downloadQueueItem = {
  seriesId: string;
  imageId: string;
};

export class DownloadManager {
  private downloadQueue: downloadQueueItem[] = [];
  private addingQueue: addingQueueItem[] = [];
  private removingQueue: removingQueueItem[] = [];
  private freeze = false;

  constructor() {
    console.log("downloadManager constructor");
  }

  addSeries(seriesId: string, imageIds: string[]) {
    this.addingQueue.push({
      seriesId: seriesId,
      imageIds: imageIds
    });
    this.reworkQueue();
  }

  removeSeries(seriesId: string) {
    // directly remove from download queue (you don't add and remove the same series in the same time)
    this.addingQueue = this.addingQueue.filter(
      item => item.seriesId !== seriesId
    );
    this.removingQueue.push(seriesId);
    this.reworkQueue();
  }

  /**
   * Rework the download queue after each request,
   * at the moment simply adds all imagesIds to the download queue
   * in the same order as they were added to the working queue
   */
  reworkQueue() {
    // block requests
    this.freeze = true;

    // apply "remove" modifications
    this.removingQueue.forEach(seriesId => {
      this.downloadQueue = this.downloadQueue.filter(
        item => item.seriesId !== seriesId
      );
    });

    // apply "add" modifications
    this.addingQueue.forEach(item => {
      item.imageIds.forEach(imageId => {
        this.downloadQueue.push({
          seriesId: item.seriesId,
          imageId: imageId
        });
      });
    });

    this.addingQueue = [];
    this.removingQueue = [];

    console.log("downloadQueue", this.downloadQueue);

    // unblock requests
    this.freeze = false;
  }

  // TODO promise
  getNextSlot(slotDimension: number) {
    if (this.freeze) {
      return null;
    }
    const nextSlot = this.downloadQueue.splice(0, slotDimension);
    console.log("nextSlot", nextSlot);
    return nextSlot;
  }
}
