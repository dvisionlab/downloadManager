export type addingQueueItem = {
  seriesId: string;
  imageIds: string[];
};

export type removingQueueItem = string;

export type downloadQueueItem = {
  seriesId: string;
  imageId: string;
};

export enum strategies {
  CONCAT = "CONCAT",
  ALTERNATE = "ALTERNATE"
}

export type seriesData = {
  [seriesId: string]: { numberOfImages: number; isDownloading: boolean };
};
