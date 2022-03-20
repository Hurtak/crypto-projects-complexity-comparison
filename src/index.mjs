import * as path from "node:path";
import * as url from "node:url";
import * as fs from "node:fs/promises";
import {
  gitGetDateOfFirstAndLastCommit,
  gitGetCommitClosestToDate,
  gitCheckoutToLatest,
  gitCheckoutToCommit,
  getDataInterval,
  getLoc,
} from "./utils.mjs";

const pathsRoot = path.join(
  path.dirname(url.fileURLToPath(import.meta.url)),
  ".."
);
const paths = {
  root: pathsRoot,
  repositories: path.join(pathsRoot, "./repositories"),
  result: path.join(pathsRoot, "./result"),
  clocBin: path.join(pathsRoot, "./node_modules/.bin/cloc"),
};

const languageExclude = [
  "JSON",
  "SVG",
  "Markdown",
  "YAML",
  "HTML",
  "CSS",
  "reStructuredText",
];

const folderExclude = ["test", "/bench"];
const fileExclude = ["test", "bench"];

const repositories = [
  {
    key: "bitcoin-core",
    group: "btc",
    branch: "master",
    root: path.join(paths.repositories, "./btc-bitcoin-core"),
    cloc: {
      excludeLang: [
        ...languageExclude,
        "Qt", // ui code
        "Qt Linguist", // translations
      ],
      excludeMatchDirectory: `(${folderExclude.join("|")}|/src/qt)`, // "/src/qt" UI code
      excludeMatchFile: `(${fileExclude.join("|")})`,
    },
  },

  {
    key: "eth-go-ethereum",
    group: "eth",
    branch: "master",
    root: path.join(paths.repositories, "./eth-go-ethereum"),
    cloc: {
      excludeLang: languageExclude,
      // "/vendor" 2019-11 and before - committed go downloaded packages into the repository
      // "/Godeps" 2016-09 and before - committed go downloaded packages into the repository
      excludeMatchDirectory: `(${folderExclude.join("|")}|/vendor|/Godeps)`,
      excludeMatchFile: `(${fileExclude.join("|")})`,
    },
  },

  {
    key: "eth-solidity",
    group: "eth",
    branch: "develop",
    root: path.join(paths.repositories, "./eth-solidity"),
    cloc: {
      excludeLang: languageExclude,
      excludeMatchDirectory: `(${folderExclude.join("|")})`,
      excludeMatchFile: `(${fileExclude.join("|")})`,
    },
  },
];

const main = async () => {
  //
  // Gather data
  //
  const result = [];
  for (const repo of repositories) {
    const resultRepo = {
      key: repo.key,
      group: repo.group,
      data: [],
    };

    console.log("Processing", repo.key);

    const dates = await gitGetDateOfFirstAndLastCommit(repo);
    console.log(`commit dates`, dates);

    const dataInterval = await getDataInterval(
      dates.firstRounded,
      dates.lastRounded
    );

    for (const date of dataInterval) {
      console.log(`  processing ${date.toISOString()}`);
      const commitHash = await gitGetCommitClosestToDate(repo, date);
      console.log(`    checking out to ${commitHash}`);
      await gitCheckoutToCommit(repo, commitHash);
      const loc = await getLoc(repo, paths.clocBin);
      console.log(`    loc ${loc.toLocaleString()}`);

      resultRepo.data.push({ date: date, loc: loc });
    }

    result.push(resultRepo);

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
  await fs.writeFile(filePathRes, JSON.stringify(result, null, 2));
};

main();
