import type { addingQueueItem, downloadQueueItem } from "./types";
/**
 * Concatenate the adding queue to the download queue
 */
declare function concat(adding: addingQueueItem[], actual: downloadQueueItem[]): downloadQueueItem[];
/**
 * Create a new queue alternating series
 */
declare function alternate(adding: addingQueueItem[], actual: downloadQueueItem[]): downloadQueueItem[];
declare const _default: {
    concat: typeof concat;
    alternate: typeof alternate;
};
export default _default;
