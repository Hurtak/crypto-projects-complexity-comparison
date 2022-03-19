import * as path from "node:path";
import * as url from 'node:url';
import { execa } from "execa";
import { parseISO, add, set } from 'date-fns'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

const repositories = {
  bitcoin: {
    root: path.join(__dirname, './repositories/bitcoin'),
    src: path.join(__dirname, './repositories/bitcoin/src'),
  },
  // ethe: path.join(__dirname, './repositories/bitcoin'),
}

const getLoc = async (path) => {
  const res = await execa("./node_modules/.bin/cloc", [
    `--exclude-lang='Qt Linguist','Qt','JSON','SVG','Markdown','XML','YAML','HTML'`,
    `--json`,
    path
  ]);

  const LOC = JSON.parse(res.stdout).SUM.code
  return LOC
}

const gitDateOfFirstAndLastCommit = async (repositoryPath) => {
  const res = await execa("git", [
    `log`,
    `--format=%as`,
    `--all`,
  ], {cwd: repositoryPath});

  const dates = res.stdout.split('\n')
  const dateLatest = parseISO(dates[0])
  const dateFirst = parseISO(dates[dates.length - 1])

  const roundToStartOfMonth = (date) => set(date, {date: 1, hours: 0, minutes: 0, seconds: 0, milliseconds: 0})

  return {
    first: dateFirst,
    firstRounded: roundToStartOfMonth(add(dateFirst, {month: 1})),
    last: dateLatest,
    lastRounded: roundToStartOfMonth(dateLatest)
  }
}

const main = async () => {
  // const locBtc = await getLoc("./repositories/bitcoin/src")
  // console.log(locBtc)
  const dates = await gitDateOfFirstAndLastCommit(repositories.bitcoin.root)
  console.log(dates)
};

main();

// cloc
