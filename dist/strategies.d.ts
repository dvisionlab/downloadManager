import type { addingQueueItem, downloadQueueItem } from "./types";
/**
 * Concatenate the adding queue to the download queue
 */
declare function concat(adding: addingQueueItem[], actual: downloadQueueItem[], activeKey: string | null, ...args: any[]): downloadQueueItem[];
/**
 * Create a new queue alternating series
 */
declare function alternate(adding: addingQueueItem[], actual: downloadQueueItem[], ...args: any[]): downloadQueueItem[];
/**
 * Create a new queue, using the "propagation" strategy - wip
 */
declare function propagate(adding: addingQueueItem[], actual: downloadQueueItem[], activeKey: string | null, ...args: any[]): downloadQueueItem[];
/**
 * 3-parted queue strategy
 */
declare function threeParted(adding: addingQueueItem[], actual: downloadQueueItem[], activeKey: string | null, activeIndex: number | null, qs: [number, number]): downloadQueueItem[];
declare const _default: {
    concat: typeof concat;
    alternate: typeof alternate;
    propagate: typeof propagate;
    threeParted: typeof threeParted;
};
export default _default;
