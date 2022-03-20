import * as path from "node:path";
import * as url from "node:url";
import * as fs from "node:fs/promises";
import * as json2csv from "json2csv";
import {
  gitGetDateOfFirstAndLastCommit,
  gitGetCommitClosestToDate,
  gitCheckoutToLatest,
  gitCheckoutToCommit,
  getDataInterval,
  getLoc,
} from "./utils.mjs";

const pathsRoot = path.dirname(url.fileURLToPath(import.meta.url));
const paths = {
  root: pathsRoot,
  repositories: path.join(pathsRoot, "./repositories"),
  result: path.join(pathsRoot, "./result"),
  clocBin: path.join(pathsRoot, "./node_modules/.bin/cloc"),
};

const repoGeneralExcludes = [
  "JSON",
  "SVG",
  "Markdown",
  // "XML",
  "YAML",
  "HTML",
  "CSS",
  "reStructuredText",
];

const repositories = [
  {
    key: "bitcoin-core",
    branch: "master",
    root: path.join(paths.repositories, "./btc-bitcoin-core"),
    cloc: {
      excludeLang: [...repoGeneralExcludes, "Qt Linguist", "Qt"],
      excludeMatchDirectory: "test",
      excludeMatchFile: ".*test.*",
    },
  },

  {
    key: "eth-go-ethereum",
    branch: "master",
    root: path.join(paths.repositories, "./eth-go-ethereum"),
    cloc: {
      excludeLang: repoGeneralExcludes,
      excludeMatchDirectory: "test",
      excludeMatchFile: ".*test.*",
    },
  },

  {
    key: "eth-solidity",
    branch: "develop",
    root: path.join(paths.repositories, "./eth-solidity"),
    cloc: {
      excludeLang: repoGeneralExcludes,
      excludeMatchDirectory: "test",
      excludeMatchFile: ".*test.*",
    },
  },
];

const main = async () => {
  //
  // Gather data
  //
  const res = {};
  for (const repo of repositories) {
    res[repo.key] = [];

    console.log("Processing", repo.key);

    const dates = await gitGetDateOfFirstAndLastCommit(repo);
    console.log(`commit dates`, dates);

    const dataInterval = await getDataInterval(
      dates.firstRounded,
      dates.lastRounded
    );

    for (const date of dataInterval.slice(0, 3)) {
      console.log(`  processing ${date.toISOString()}`);
      const commitHash = await gitGetCommitClosestToDate(repo, date);
      console.log(`    checking out to ${commitHash}`);
      await gitCheckoutToCommit(repo, commitHash);
      const loc = await getLoc(repo, paths.clocBin);
      console.log(`    loc ${loc.toLocaleString()}`);

      res[repo.key].push({ date: date, loc: loc });
    }

    await gitCheckoutToLatest(repo);
  }
  console.log("Finished processing");
  console.log();

  //
  // Write data to result folder
  //
  await fs.rm(paths.result, { recursive: true });
  await fs.mkdir(paths.result, { recursive: true });

  const filePathRes = path.join(paths.result, "res.json");
  console.log(`Writing to ${filePathRes}`);
  await fs.writeFile(filePathRes, JSON.stringify(res, null, 2));

  for (const [key, result] of Object.entries(res)) {
    const csv = json2csv.parse(result);
    const filePath = path.join(paths.result, `${key}.csv`);
    console.log(`Writing to ${filePath}`);
    await fs.writeFile(filePath, csv);
  }
};

main();
