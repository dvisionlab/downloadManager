import type { downloadQueueItem } from "./types";
import strategiesFns from "./strategies";
/**
 * DownloadManager class
 */
export declare class DownloadManager {
    /**
     * The real download queue
     */
    private downloadQueue;
    /**
     * The queue of series to add to the download queue
     */
    private addingQueue;
    /**
     * The queue of series to remove from the download queue
     */
    private removingQueue;
    /**
     * Token to freeze the production of new download slots
     */
    private freeze;
    /**
     * The strategy to use to create the download queue
     */
    private strategy;
    /**
     * If true, the download manager will log to the console
     */
    private _verbose;
    /**
     * The data of the series in the download manager, used to keep track of download progress
     */
    private seriesData;
    /**
     * The active serie (for strategies that react to user behaviour)
     */
    private _activeKey;
    /**
     * The active index (for strategies that react to user behaviour)
     */
    private _activeIndex;
    /**
     * The indeces that delimits the three sections of the download queue
     */
    private qs;
    /**
     * Class constructor
     * @param strategy Sets the strategy
     * @param verbose Enables logging
     */
    constructor(strategy?: keyof typeof strategiesFns, verbose?: boolean);
    /**
     * Download is on going if there are instances in the download queue
     * and isDownloading is true for at least one series
     * (isDownloading is set to true when the first instance of a series
     * is popped from the download queue)
     **/
    get isDownloading(): boolean;
    get verbose(): boolean;
    set activeKey(key: string | null);
    get activeKey(): string | null;
    set activeIndex(index: number | null);
    get activeIndex(): number | null;
    /**
     * Update the isDownloading property of the seriesData
     * @param slot The slot of images that was just popped from the download queue
     */
    private updateIsDownloading;
    /**
     * Update the qs indexes
     * @param slotDimension The number of images in the slot
     */
    private updateQs;
    /**
     * Add a new series in the download manager
     * @returns True if the series was added, false otherwise
     */
    addSeries(key: string, seriesId: string, studyId: string, imageIds: string[]): boolean;
    removeSeries(key: string): void;
    /**
     * Rework the download queue after each request,
     * at the moment simply adds all imagesIds to the download queue
     * in the same order as they were added to the working queue
     */
    reworkQueue(): void;
    /**
     * Returns the status of the requested series
     */
    getStatus(key: string): {
        remaining: number;
        initial: number;
    } | null;
    /**
     * Returns the status of all series
     */
    getOverallStatus(): {
        [k: string]: {
            remaining: number;
            initial: number;
        } | null;
    };
    /**
     * Returns the next slot of images to download
     * @param slotDimension {number} number of images to download
     * @returns {array<downloadQueueItem>}
     */
    getNextSlot(slotDimension: number): downloadQueueItem[] | null;
    getNextSlotAsync(slotDimension: number): Promise<downloadQueueItem[]>;
}
