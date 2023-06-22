(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["dvDownloadManager"] = factory();
	else
		root["dvDownloadManager"] = factory();
})(self, () => {
return /******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	// The require scope
/******/ 	var __webpack_require__ = {};
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  DownloadManager: () => (/* binding */ DownloadManager)
});

;// CONCATENATED MODULE: ./src/strategies.ts
/**
 * Concatenate the adding queue to the download queue
 */
function concat(adding, actual) {
    adding.forEach((item) => {
        item.imageIds.forEach((imageId) => {
            actual.push({
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
function alternate(adding, actual) {
    let newQueue = [];
    let seriesIds = new Set(actual.map((item) => item.seriesId));
    adding.forEach((item) => seriesIds.add(item.seriesId));
    let seriesIdsArray = Array.from(seriesIds);
    let addingObjectsArray = adding
        .map((object) => object.imageIds.map((imageId) => ({
        studyId: object.studyId,
        seriesId: object.seriesId,
        imageId
    })))
        .flat();
    let allImages = addingObjectsArray.concat(actual);
    let numberOfTotalImages = allImages.length;
    for (let i = 0; i < numberOfTotalImages; i++) {
        let seriesToPush = seriesIdsArray[i % seriesIds.size];
        let imageToPushIndex = allImages.findIndex((item) => item.seriesId === seriesToPush);
        let imageToPush = allImages.splice(imageToPushIndex, 1).pop();
        if (!imageToPush) {
            throw new Error('imageToPush is undefined');
        }
        newQueue.push(imageToPush);
    }
    return newQueue;
}
/* harmony default export */ const strategies = ({ concat, alternate });

;// CONCATENATED MODULE: ./src/downloadManager.ts
var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};

/**
 * DownloadManager class
 */
class DownloadManager {
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
        this.verbose = false;
        /**
         * The data of the series in the download manager, used to keep track of download progress
         */
        this.seriesData = {};
        this.strategy = strategy;
        this.verbose = verbose !== null && verbose !== void 0 ? verbose : false;
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
    updateIsDownloading(slot) {
        const seriesIds = new Set(slot.map(item => item.seriesId));
        [...seriesIds].forEach(seriesId => {
            const remaining = this.downloadQueue.filter(item => item.seriesId === seriesId).length;
            if (remaining === 0) {
                delete this.seriesData[seriesId];
            }
            else {
                this.seriesData[seriesId].isDownloading = true;
            }
        });
    }
    /**
     * Add a new series in the download manager
     * @returns True if the series was added, false otherwise
     */
    addSeries(seriesId, studyId, imageIds) {
        // check that the series is not already in the seriesData
        // TODO what if I want to add other slices for a series ? we could use s Set for the imagesIds
        if (seriesId in this.seriesData) {
            console.warn(`Series ${seriesId} is already in the download manager`);
            return false;
        }
        // otherwise add it to the adding queue
        this.addingQueue.push({
            seriesId: seriesId,
            studyId: studyId,
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
    // TODO return boolean if series was removed
    removeSeries(seriesId) {
        // directly remove from download queue (you don't add and remove the same series in the same time)
        this.addingQueue = this.addingQueue.filter(item => item.seriesId !== seriesId);
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
            this.downloadQueue = this.downloadQueue.filter(item => item.seriesId !== seriesId);
        });
        // apply "add" modifications
        this.downloadQueue = strategies[this.strategy](this.addingQueue, this.downloadQueue);
        this.addingQueue = [];
        this.removingQueue = [];
        if (this.verbose)
            console.log("downloadQueue", this.downloadQueue);
        // unblock requests
        this.freeze = false;
    }
    /**
     * Returns the status of the requested series
     */
    getStatus(seriesId) {
        var _a;
        const remaining = this.downloadQueue.filter(item => item.seriesId === seriesId).length;
        const initial = (_a = this.seriesData[seriesId]) === null || _a === void 0 ? void 0 : _a.numberOfImages;
        return remaining ? { remaining, initial } : null;
    }
    /**
     * Returns the status of all series
     */
    getOverallStatus() {
        const seriesIds = Object.keys(this.seriesData);
        const obj = Object.fromEntries(seriesIds.map((key, index) => [key, this.getStatus(key)]));
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
        this.updateIsDownloading(nextSlot);
        if (this.verbose)
            console.log("nextSlot", nextSlot);
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

/******/ 	return __webpack_exports__;
/******/ })()
;
});
//# sourceMappingURL=dvDownloadManager.js.map