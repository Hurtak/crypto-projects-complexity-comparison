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
    group: "btc",
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
    group: "eth",
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
    group: "eth",
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
