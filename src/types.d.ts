export type addingQueueItem = {
  studyId: string
  seriesId: string
  imageIds: string[]
}

export type removingQueueItem = string

/**
 * An item of the download queue
 * @typedef {Object} downloadQueueItem
 */
export type downloadQueueItem = {
  studyId: string
  seriesId: string
  imageId: string
}

/**
 * The strategy to use to create the download queue
 * @enum {string}
 * @readonly
 * @property {string} CONCAT - Concatenate the adding queue to the download queue
 * @property {string} ALTERNATE - Create a new queue alternating series
 */
export enum strategies {
  CONCAT = 'CONCAT',
  ALTERNATE = 'ALTERNATE'
}

export type seriesData = {
  [seriesId: string]: { numberOfImages: number; isDownloading: boolean }
}
