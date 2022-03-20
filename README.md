# Crypto projects complexity comparison

## Prerequisites

- Node.js and NPM is required

## Install

- Init git submodules `git submodule update --init`
- Install Node dependencies `npm install`

## Run

- Analyze repositories
  - Run `npm run start`
  - Generates `result/res.json`
- Show chart
  - Run `npm run chart`
  - Point your browser to `http://localhost:3000/chart`

## Analysis notes

- `go-ethereum` seems to be using submodules, we are not cloning/initializing these submodules (we do not do `git submodule --recursive`), so they are not included in the analysis. These submodules seem to only be testing related, so it is probably correct that they are not included.

## TODO

- Chart
