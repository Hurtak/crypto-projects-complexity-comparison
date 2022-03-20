import { execa } from "execa";
import { parseISO, addMonths, set, eachMonthOfInterval } from "date-fns";
import { flow } from "lodash-es";

export const getLoc = async (repo, bin) => {
  const res = await execa(bin, [
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

  if (!res.stdout) {
    // If there are 0 results, the cloc binary returns empty response
    return 0
  }

  try {
    const loc = JSON.parse(res.stdout).SUM.code;
    return loc;
  } catch (e) {
    console.error("Error parsing");
    console.error(res);
    console.error(e);
    process.exit(1);
  }
};

export const gitGetDateOfFirstAndLastCommit = async (repo) => {
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

export const gitCheckoutToCommit = async (repository, commitHash) => {
  const res = await execa("git", [`checkout`, commitHash], {
    cwd: repository.root,
  });
};

export const gitCheckoutToLatest = async (repository) => {
  const res = await execa("git", [`checkout`, repository.branch], {
    cwd: repository.root,
  });
};

export const getDataInterval = async (startDate, endDate) => {
  return eachMonthOfInterval({ start: startDate, end: endDate });
};

export const gitGetCommitClosestToDate = async (repository, date) => {
  const commitHash = await execa(
    "git",
    [`rev-list`, `-n`, 1, `--before`, date.toISOString(), repository.branch],
    { cwd: repository.root }
  );

  return commitHash.stdout;
};
