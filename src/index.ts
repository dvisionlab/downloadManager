import type {
  downloadQueueItem,
  addingQueueItem,
  removingQueueItem,
  seriesData
} from "./types";

import strategiesFns from "./strategies";

/**
 * DownloadManager class
 */
export class DownloadManager {
  /**
   * The real download queue
   */
  private downloadQueue: downloadQueueItem[] = [];
  /**
   * The queue of series to add to the download queue
   */
  private addingQueue: addingQueueItem[] = [];
  /**
   * The queue of series to remove from the download queue
   */
  private removingQueue: removingQueueItem[] = [];
  /**
   * Token to freeze the production of new download slots
   */
  private freeze = false;
  /**
   * The strategy to use to create the download queue
   */
  private strategy: keyof typeof strategiesFns;
  /**
   * If true, the download manager will log to the console
   */
  private _verbose: boolean = false;
  /**
   * The data of the series in the download manager, used to keep track of download progress
   */
  private seriesData: seriesData = {};
  /**
   * The active serie (for strategies that react to user behaviour)
   */
  private _activeKey: string | null = null;
  /**
   * The active index (for strategies that react to user behaviour)
   */
  private _activeIndex: number | null = null;

  /**
   * The indeces that delimits the three sections of the download queue
   */
  private qs: [number, number] = [0, 0];

  /**
   * Class constructor
   * @param strategy Sets the strategy
   * @param verbose Enables logging
   */
  constructor(
    strategy: keyof typeof strategiesFns = "concat",
    verbose?: boolean
  ) {
    this.strategy = strategy;
    this._verbose = verbose ?? false;
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

  get verbose() {
    return this._verbose;
  }

  set activeKey(key: string | null) {
    // TODO should we check that reworking is ongoing (freeze = true) ?
    // TODO check that key is in the download queue
    this._activeKey = key;
    this._activeIndex = null;
    this.reworkQueue();
  }

  get activeKey() {
    return this._activeKey;
  }

  set activeIndex(index: number | null) {
    // if (!this._activeKey) {
    //   console.warn("activeKey is not set");
    //   return;
    // }
    this._activeIndex = index;
    this.reworkQueue();
  }

  get activeIndex() {
    return this._activeIndex;
  }

  /**
   * Update the isDownloading property of the seriesData
   * @param slot The slot of images that was just popped from the download queue
   */
  private updateIsDownloading(slot: downloadQueueItem[]) {
    const keysIds = new Set(slot.map(item => item.key));
    [...keysIds].forEach(key => {
      const remaining = this.downloadQueue.filter(
        item => item.key === key
      ).length;
      if (remaining === 0) {
        delete this.seriesData[key];
      } else {
        this.seriesData[key].isDownloading = true;
      }
    });
  }

  /**
   * Update the qs indexes
   * @param slotDimension The number of images in the slot
   */
  private updateQs(slotDimension: number) {
    this.qs[0] =
      this.qs[0] - slotDimension > 0 ? this.qs[0] - slotDimension : 0;
    this.qs[1] =
      this.qs[1] - slotDimension > 0 ? this.qs[1] - slotDimension : 0;
  }

  /**
   * Add a new series in the download manager
   * @returns True if the series was added, false otherwise
   */
  addSeries(
    key: string,
    seriesId: string,
    studyId: string,
    imageIds: string[]
  ) {
    // check that the series is not already in the seriesData
    // TODO what if I want to add other slices for a series ? we could use s Set for the imagesIds
    if (key in this.seriesData) {
      console.warn(`Series ${seriesId} is already in the download manager`);
      return false;
    }
    // otherwise add it to the adding queue
    this.addingQueue.push({
      key: key,
      seriesId: seriesId,
      studyId: studyId,
      imageIds: imageIds
    });
    this.seriesData[key] = {
      numberOfImages: imageIds.length,
      isDownloading: false
    };
    this.seriesData[key].numberOfImages = imageIds.length;
    this.seriesData[key].isDownloading = false;
    this.reworkQueue();
    return true;
  }

  // TODO return boolean if series was removed
  removeSeries(key: string) {
    // directly remove from download queue (you don't add and remove the same series in the same time)
    this.addingQueue = this.addingQueue.filter(item => item.key !== key);
    this.removingQueue.push(key);
    delete this.seriesData[key];
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
    console.time("reworkQueue");

    // apply "remove" modifications
    this.removingQueue.forEach(key => {
      this.downloadQueue = this.downloadQueue.filter(item => item.key !== key);
    });

    // check that the active series is still in the download queue
    if (
      this._activeKey &&
      !this.downloadQueue.some(item => item.key === this._activeKey)
    ) {
      this._activeKey = null;
    }

    // apply "add" modifications
    this.downloadQueue = strategiesFns[this.strategy](
      this.addingQueue,
      this.downloadQueue,
      this._activeKey,
      this._activeIndex,
      this.qs
    );

    // if active is null, set it to the first key in the download queue
    // if (!this._activeKey && this.downloadQueue.length > 0) {
    //   this._activeKey = this.downloadQueue[0].key;
    // }

    this.addingQueue = [];
    this.removingQueue = [];

    if (this.verbose) {
      console.log("downloadQueue");
      console.table(this.downloadQueue);
    }

    // unblock requests
    console.timeEnd("reworkQueue");
    this.freeze = false;
  }

  /**
   * Returns the status of the requested series
   */
  getStatus(key: string) {
    const remaining = this.downloadQueue.filter(
      item => item.key === key
    ).length;
    const initial = this.seriesData[key]?.numberOfImages;
    return remaining ? { remaining, initial } : null;
  }

  /**
   * Returns the status of all series
   */
  getOverallStatus() {
    const keys = Object.keys(this.seriesData);
    const obj = Object.fromEntries(
      keys.map((key, index) => {
        return [key, this.getStatus(key)];
      })
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
    this.updateQs(slotDimension);
    this.updateIsDownloading(nextSlot);
    if (this.verbose) {
      console.log("nextSlot");
      console.table(nextSlot);
      console.log("downloadQueue");
      console.table(this.downloadQueue);
    }
    return nextSlot;
  }

  async getNextSlotAsync(slotDimension: number) {
    return new Promise<downloadQueueItem[]>((resolve, reject) => {
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
