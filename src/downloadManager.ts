import type {
  downloadQueueItem,
  addingQueueItem,
  removingQueueItem,
  seriesData
} from "./types.d";

import strategiesFns from "./strategies";

/**
 * DownloadManager class
 * @param {string} strategy - The strategy to use to download the images
 * @param {boolean} verbose - If true, the download manager will log its actions
 * @property {boolean} isDownloading - True if the download manager is downloading
 * @property {string} strategy - The strategy to use to download the images
 * @property {boolean} verbose - If true, the download manager will log its actions
 * @property {seriesData} seriesData - The data of the series
 * @property {downloadQueueItem[]} downloadQueue - The download queue
 * @property {addingQueueItem[]} addingQueue - The adding queue
 * @property {removingQueueItem[]} removingQueue - The removing queue
 * @property {boolean} freeze - If true, the download manager will not return any slot, since it is reworking the queue
 * @getter {boolean} isDownloading - True if the download process is on going
 * @method {boolean} addSeries - Add a series to the download manager
 * @method {void} removeSeries - Remove a series from the download manager
 * @method {void} reworkQueue - Rework the download queue after each request
 * @method {Promise<downloadQueueItem[]>} getNextSlotAsync - Get the next slot
 * @method {downloadQueueItem[]} getNextSlot - Get the next slot
 * @method {void} getStatus - Get the status of a specific series in the download manager
 * @method {seriesData} getOverallStatus - Get the status of all the series in the download manager
 * @method {void} updateIsDownloading - Update the isDownloading property of the series in the download manager
 * @method {void} updateStatus - Update the status of all the series in the download manager
 */
export class DownloadManager {
  private downloadQueue: downloadQueueItem[] = [];
  private addingQueue: addingQueueItem[] = [];
  private removingQueue: removingQueueItem[] = [];
  private freeze = false;
  private strategy: keyof typeof strategiesFns;
  private verbose: boolean = false;
  private seriesData: seriesData = {};

  constructor(
    strategy: keyof typeof strategiesFns = "concat",
    verbose?: boolean
  ) {
    this.strategy = strategy;
    this.verbose = verbose ?? false;
  }

  /**
   * Download is on going if there are instances in the download queue
   * and isDownloading is true for at least one series
   * (isDownloading is set to true when the first instance of a series
   * is popped from the download queue)
   **/
  get isDownloading() {
    return (
      Object.values(this.seriesData).reduce(
        (acc, curr) => curr.isDownloading || acc,
        false
      ) && this.downloadQueue.length > 0
    );
  }

  private updateIsDownloading(slot: downloadQueueItem[]) {
    const seriesIds = new Set(slot.map(item => item.seriesId));
    [...seriesIds].forEach(seriesId => {
      const remaining = this.downloadQueue.filter(
        item => item.seriesId === seriesId
      ).length;
      if (remaining === 0) {
        delete this.seriesData[seriesId];
      } else {
        this.seriesData[seriesId].isDownloading = true;
      }
    });
  }

  /**
   * Add a new series in the download manager
   * @param seriesId {string}
   * @param imageIds {string[]}
   * @returns {boolean} True if the series was added, false otherwise
   */
  addSeries(seriesId: string, imageIds: string[]) {
    // check that the series is not already in the seriesData
    if (seriesId in this.seriesData) {
      console.warn(`Series ${seriesId} is already in the download manager`);
      return false;
    }
    // otherwise add it to the adding queue
    this.addingQueue.push({
      seriesId: seriesId,
      imageIds: imageIds
    });
    this.seriesData[seriesId] = {
      numberOfImages: imageIds.length,
      isDownloading: false
    };
    this.seriesData[seriesId].numberOfImages = imageIds.length;
    this.seriesData[seriesId].isDownloading = false;
    this.reworkQueue();
    return true;
  }

  removeSeries(seriesId: string) {
    // directly remove from download queue (you don't add and remove the same series in the same time)
    this.addingQueue = this.addingQueue.filter(
      item => item.seriesId !== seriesId
    );
    this.removingQueue.push(seriesId);
    delete this.seriesData[seriesId];
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

  /**
   * Returns the status of the requested series
   * @param seriesId {string}
   * @returns {object} {remaining: number, initial: number}
   */
  getStatus(seriesId: string) {
    const remaining = this.downloadQueue.filter(
      item => item.seriesId === seriesId
    ).length;
    const initial = this.seriesData[seriesId].numberOfImages;
    return { remaining, initial };
  }

  /**
   * Returns the status of all series
   * @returns {object} @type {seriesId: {remaining: number, initial: number}}
   */
  getOverallStatus() {
    const seriesIds = Object.keys(this.seriesData);
    const obj = Object.fromEntries(
      seriesIds.map((key, index) => [key, this.getStatus(key)])
    );
    return obj;
  }

  /**
   * Returns the next slot of images to download
   * @param slotDimension {number} number of images to download
   * @returns {array<downloadQueueItem>}
   */
  // TODO make private (fix tests)
  getNextSlot(slotDimension: number) {
    if (this.freeze) {
      return null;
    }
    const nextSlot = this.downloadQueue.splice(0, slotDimension);
    this.updateIsDownloading(nextSlot);
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
