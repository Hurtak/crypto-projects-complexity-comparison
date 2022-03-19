import * as path from "node:path";
import * as url from "node:url";
import * as fs from "node:fs/promises";
import { execa } from "execa";
import { parseISO, addMonths, set, eachMonthOfInterval } from "date-fns";
import { flow } from "lodash-es";
import * as json2csv from "json2csv";

const pathsRoot = path.dirname(url.fileURLToPath(import.meta.url));
const paths = {
  root: pathsRoot,
  result: path.join(pathsRoot, "result"),
  clocBin: path.join(pathsRoot, "./node_modules/.bin/cloc"),
};

const repoGeneralExcludes = ["JSON", "SVG", "Markdown", "XML", "YAML", "HTML"];

const repositories = {
  bitcoin: {
    key: "bitcoin",
    branch: "master",
    root: path.join(paths.root, "./repositories/bitcoin"),
    cloc: {
      excludeLang: [...repoGeneralExcludes, "Qt Linguist", "Qt"],
      excludeMatchDirectory: "test",
      excludeMatchFile: ".*test.*",
    },
  },

  ethereumGo: {
    key: "go-ethereum",
    branch: "master",
    root: path.join(paths.root, "./repositories/go-ethereum"),
    cloc: {
      excludeLang: repoGeneralExcludes,
      excludeMatchDirectory: "test",
      excludeMatchFile: ".*test.*",
    },
  },
};

const getLoc = async (repo) => {
  const res = await execa(paths.clocBin, [
    `--fullpath`,
    `--exclude-lang`,
    repo.cloc.excludeLang.join(","),
    `--not-match-d`,
    repo.cloc.excludeMatchDirectory,
    `--not-match-f`,
    repo.cloc.excludeMatchFile,
    `--json`,
    repo.root,
  ]);

  const loc = JSON.parse(res.stdout).SUM.code;
  return loc;
};

const gitDateOfFirstAndLastCommit = async (repo) => {
  const res = await execa("git", [`log`, `--format=%as`, `--all`], {
    cwd: repo.root,
  });

  const dates = res.stdout.split("\n");
  const dateLatest = parseISO(dates[0]);
  const dateFirst = parseISO(dates[dates.length - 1]);

  const roundToStartOfMonth = (date) =>
    set(date, { date: 1, hours: 0, minutes: 0, seconds: 0, milliseconds: 0 });

  return {
    first: dateFirst,
    firstRounded: flow([
      //
      (d) => addMonths(d, 1),
      (d) => roundToStartOfMonth(d),
    ])(dateFirst),
    last: dateLatest,
    lastRounded: roundToStartOfMonth(dateLatest),
  };
};

const gitCheckoutToCommit = async (repository, commitHash) => {
  const res = await execa("git", [`checkout`, commitHash], {
    cwd: repository.root,
  });
};

const getChartDates = async (startDate, endDate) => {
  return eachMonthOfInterval({ start: startDate, end: endDate });
};

const getCommitClosestToDate = async (repository, date) => {
  const commitHash = await execa(
    "git",
    [`rev-list`, `-n`, 1, `--before`, date.toISOString(), repository.branch],
    { cwd: repository.root }
  );

  return commitHash.stdout;
};

const main = async () => {
  const res = {};

  for (const repo of Object.values(repositories)) {
    res[repo.key] = [];

    console.log("Processing", repo.key);

    const dates = await gitDateOfFirstAndLastCommit(repo);
    console.log(`commit dates`, dates);

    const chartDates = await getChartDates(
      dates.firstRounded,
      dates.lastRounded
    );
    for (const date of chartDates.slice(0, 5)) {
      console.log(`  processing ${date.toISOString()}`);
      const commitHash = await getCommitClosestToDate(repo, date);
      console.log(`    checking out to ${commitHash}`);
      await gitCheckoutToCommit(repo, commitHash);
      const loc = await getLoc(repo);
      console.log(`    ${loc}`);

      res[repo.key].push({ date: date, loc: loc });
    }
  }
  console.log("Finished processing");
  console.log();

  await fs.rmdir(paths.result, {
    recursive: true,
    force: true,
  });
  await fs.mkdir(paths.result, { recursive: true });

  console.log(`Writing to ${paths.result}`);
  await fs.writeFile(
    path.join(paths.result, "res.json"),
    JSON.stringify(res, null, 2)
  );

  for (const [key, result] of Object.entries(res)) {
    const csv = json2csv.parse(result);
    const filePath = path.join(paths.result, `${key}.csv`);
    console.log(`Writing to ${filePath}`);
    await fs.writeFile(filePath, csv);
  }
};

main();

// cloc
