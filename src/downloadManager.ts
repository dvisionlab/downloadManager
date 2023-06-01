import type {
  downloadQueueItem,
  addingQueueItem,
  removingQueueItem
} from "./types.d";

import strategiesFns from "./strategies";

export class DownloadManager {
  private downloadQueue: downloadQueueItem[] = [];
  private addingQueue: addingQueueItem[] = [];
  private removingQueue: removingQueueItem[] = [];
  private freeze = false;
  private strategy: keyof typeof strategiesFns;
  private verbose: boolean = false;

  constructor(
    strategy: keyof typeof strategiesFns = "concat",
    verbose?: boolean
  ) {
    this.strategy = strategy;
    this.verbose = verbose ?? false;
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
    this.downloadQueue = strategiesFns[this.strategy](
      this.addingQueue,
      this.downloadQueue
    );

    this.addingQueue = [];
    this.removingQueue = [];

    if (this.verbose) console.log("downloadQueue", this.downloadQueue);

    // unblock requests
    this.freeze = false;
  }

  getNextSlot(slotDimension: number) {
    if (this.freeze) {
      return null;
    }
    const nextSlot = this.downloadQueue.splice(0, slotDimension);
    if (this.verbose) console.log("nextSlot", nextSlot);
    return nextSlot;
  }

  async getNextSlotAsync(slotDimension: number) {
    return new Promise((resolve, reject) => {
      const interval = setInterval(() => {
        const nextSlot = this.getNextSlot(slotDimension);
        if (nextSlot) {
          clearInterval(interval);
          resolve(nextSlot);
        }
      }, 20);
    });
  }
}
