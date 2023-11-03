"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DownloadManager = void 0;
const strategies_1 = __importDefault(require("./strategies"));
/**
 * DownloadManager class
 */
class DownloadManager {
    /**
     * Class constructor
     * @param strategy Sets the strategy
     * @param verbose Enables logging
     */
    constructor(strategy = "concat", verbose) {
        /**
         * The real download queue
         */
        this.downloadQueue = [];
        /**
         * The queue of series to add to the download queue
         */
        this.addingQueue = [];
        /**
         * The queue of series to remove from the download queue
         */
        this.removingQueue = [];
        /**
         * Token to freeze the production of new download slots
         */
        this.freeze = false;
        /**
         * If true, the download manager will log to the console
         */
        this._verbose = false;
        /**
         * The data of the series in the download manager, used to keep track of download progress
         */
        this.seriesData = {};
        /**
         * The active serie (for strategies that react to user behaviour)
         */
        this._activeKey = null;
        /**
         * The active index (for strategies that react to user behaviour)
         */
        this._activeIndex = null;
        /**
         * The indeces that delimits the three sections of the download queue
         */
        this.qs = [0, 0];
        this.strategy = strategy;
        this._verbose = verbose !== null && verbose !== void 0 ? verbose : false;
    }
    /**
     * Download is on going if there are instances in the download queue
     * and isDownloading is true for at least one series
     * (isDownloading is set to true when the first instance of a series
     * is popped from the download queue)
     **/
    get isDownloading() {
        return (Object.values(this.seriesData).reduce((acc, curr) => curr.isDownloading || acc, false) && this.downloadQueue.length > 0);
    }
    get verbose() {
        return this._verbose;
    }
    set activeKey(key) {
        // TODO should we check that reworking is ongoing (freeze = true) ?
        // TODO check that key is in the download queue
        this._activeKey = key;
        this._activeIndex = null;
        this.reworkQueue();
    }
    get activeKey() {
        return this._activeKey;
    }
    set activeIndex(index) {
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
    updateIsDownloading(slot) {
        const keysIds = new Set(slot.map(item => item.key));
        [...keysIds].forEach(key => {
            const remaining = this.downloadQueue.filter(item => item.key === key).length;
            if (remaining === 0) {
                delete this.seriesData[key];
            }
            else {
                this.seriesData[key].isDownloading = true;
            }
        });
    }
    /**
     * Update the qs indexes
     * @param slotDimension The number of images in the slot
     */
    updateQs(slotDimension) {
        this.qs[0] =
            this.qs[0] - slotDimension > 0 ? this.qs[0] - slotDimension : 0;
        this.qs[1] =
            this.qs[1] - slotDimension > 0 ? this.qs[1] - slotDimension : 0;
    }
    /**
     * Add a new series in the download manager
     * @returns True if the series was added, false otherwise
     */
    addSeries(key, seriesId, studyId, imageIds) {
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
            imageIds: imageIds.slice()
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
    removeSeries(key) {
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
        // apply "remove" modifications
        this.removingQueue.forEach(key => {
            this.downloadQueue = this.downloadQueue.filter(item => item.key !== key);
        });
        // check that the active series is still in the download queue
        if (this._activeKey &&
            !this.downloadQueue.some(item => item.key === this._activeKey)) {
            this._activeKey = null;
        }
        // apply "add" modifications
        this.downloadQueue = strategies_1.default[this.strategy](this.addingQueue, this.downloadQueue, this._activeKey, this._activeIndex, this.qs);
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
        this.freeze = false;
    }
    /**
     * Returns the status of the requested series
     */
    getStatus(key) {
        var _a;
        const remaining = this.downloadQueue.filter(item => item.key === key).length;
        const initial = (_a = this.seriesData[key]) === null || _a === void 0 ? void 0 : _a.numberOfImages;
        return remaining ? { remaining, initial } : null;
    }
    /**
     * Returns the status of all series
     */
    getOverallStatus() {
        const keys = Object.keys(this.seriesData);
        const obj = Object.fromEntries(keys.map((key, index) => {
            return [key, this.getStatus(key)];
        }));
        return obj;
    }
    /**
     * Returns the next slot of images to download
     * @param slotDimension {number} number of images to download
     * @returns {array<downloadQueueItem>}
     */
    // TODO make private (fix tests)
    getNextSlot(slotDimension) {
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
    getNextSlotAsync(slotDimension) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                const interval = setInterval(() => {
                    const nextSlot = this.getNextSlot(slotDimension);
                    if (nextSlot) {
                        clearInterval(interval);
                        resolve(nextSlot);
                    }
                }, 20);
            });
        });
    }
}
exports.DownloadManager = DownloadManager;
//# sourceMappingURL=downloadManager.js.map