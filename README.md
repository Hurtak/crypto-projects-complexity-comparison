# Crypto projects complexity comparison

## Prerequisites

- Node.js is required

## Install

- `npm install`
- Init git submodules `git submodule update --init`

## Run

- Analyze repositories `npm run start`
    - Outputs `json` and `csv` data into `result` folder (removes previous data)

## Analysis notes

- `go-ethereum` seems to be using submodules, we are not cloning/initializing these submodules (we do not do `git submodule --recursive`), so they are not included in the analysis. These submodules seem to only be testing related, so it is probably correct that they are not included.

## TODO

- exclude https://github.com/bitcoin/bitcoin/tree/master/src/qt
- test submodule
- Chart
