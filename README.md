# Crypto projects complexity comparison

This project is followup to Ethereum development lead

[![Tweet](./img/tweet.png)](https://twitter.com/peter_szilagyi/status/1504887158699704321)

which states that complexity of Ethereum never decreased and that his might be worrying trend.

This project tries to:

- quantify the complexity as lines of code of given project over time
- compare biggest crypto projects and see if there are any trends

## Result

[![Result](./img/result.png)](./img/result.png)

- Data raw available in [./result/res.json](./result/res.json)
- You can generate `png` or `csv` easily by running [show chart command](#Start) and clicking on the export buttons

## Analysis method

1. Gather repositories of crypto projects (some can have more than one)
2. Find date of first and last commit in given repository
3. Generate range of dates with 1 month increments rounded to the start of the month (2020-01-01, 2020-02-01, 2020-03-01, ..)
   - This Range starts at first whole month after the first commit at 1st of the month of the last commit
4. For each item in this range we find commit at the same date or closest one before the date
5. For each of this commit we checkout the repository and run [cloc](https://www.npmjs.com/package/cloc) binary to determine lines of code in the project at that time
   - We try to filter:
     - Test code
     - Benchmark code
     - Non core source code files (Markdown, JSON, HTML, translations, ...)
     - committed external dependencies in the project

### Notes to certain projects

- Bitcoin
  - Filtered out UI code in `src/qt`
- Ethereum
  - `go-ethereum` seems to be using 2 submodules and we are not cloning/initializing these nested submodules (we do not do `git submodule --recursive`), so they are not included in the analysis. These submodules seem to only be testing related, so it is probably correct that they are not included.
  - We include `solidity` in the analysis since it seems to be core part of the project
  - Ethereum used to commit external go vender/dependencies into the project in the `/Godeps` and then in the `/vendor` folders, these are filtered out (with them, the LOC are about 2.5x bigger)

## Run

### Prerequisites

- Node.js and NPM is required

### Install

- Init git submodules `git submodule update --init`
- Install Node dependencies `npm install`

### Start

- Analyze repositories
  - Run `npm run start`
  - Generates `result/res.json`
- Show chart
  - Run `npm run chart`
  - Point your browser to `http://localhost:3000/chart`
