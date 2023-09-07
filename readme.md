# Download Manager
This package implements a bounch of sorting algorithms that can be applied to a list of object, that can then be queried to obtain the next object(s) in the queue. 
The idea is to have a single manager for download / upload queues. 
At the moment object in the list are meant to represent DICOM instances, so they are in the form: 
```
{
  key,
  imageId,
  seriesId,
  studyId
}
```
but in the future this could be generalized to generic use cases. 

## Usage
```
import { DownloadManager } from "dv-download-manager";
let dm = new DownloadManager("alternate", false); // "alternate" is the sorting algorithm

dm.addSeries(seriesId, seriesId, "todo-studyId", images); // add a series to the queue 

let slot = dm.getNextSlot(1) // get a single slot of dimension 1

dm.removeSeries(id); // remove a series from the queue
```

## Sorting algorithms
- **concat**
- **alternate**

## Docs
TODO

# Development

Download [Node.js](https://nodejs.org/en/download/).
Run this followed commands:

```bash
# Install dependencies (only the first time)
yarn install

# Develop with hot reload
yarn dev

# Build for production in the dist/ directory
yarn build

# Generate documentation in the docs/ folder
yarn docs

# Run tests with jest
yarn test
```

# Changelog

## v0.3.0
Fix build & bundle

## v0.2.0

[BREAKING] Order the items by a generic "key" property.

## v0.1.0

First version
