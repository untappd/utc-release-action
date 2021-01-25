"use strict";
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : new P(function (resolve) {
              resolve(result.value);
            }).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
var pad = (num) => {
  return num.toString().padStart(2, "0");
};
var createTagName = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hour = pad(date.getHours());
  const minute = pad(date.getMinutes());
  const second = pad(date.getSeconds());
  return `${year}.${month}.${day}.${hour}${minute}${second}`;
};
const core = require("@actions/core");
const github = require("@actions/github");
const { context } = require("@actions/github/lib/utils");
function run() {
  return __awaiter(this, void 0, void 0, function* () {
    const octokit = github.getOctokit(core.getInput("github_token"));
    let tag_name = core.getInput("tag_name");

    if (!tag_name) {
      tag_name = createTagName();
    }

    console.log("Getting master SHA");
    octokit.git
      .getRef({
        owner: context.repo.owner,
        repo: context.repo.repo,
        ref: "heads/master",
      })
      .then((master) => {
        console.log("Comparing master <-> production");
        const tagSha = master["data"]["object"]["sha"];
        octokit.repos
          .compareCommits({
            owner: context.repo.owner,
            repo: context.repo.repo,
            base: "production",
            head: tagSha,
          })
          .then((comparison) => {
            const totalCommits = comparison["data"]["total_commits"];
            console.log(`${totalCommits} commits difference`);
            if (totalCommits > 0) {
              console.log("Creating a release");
              octokit.repos
                .createRelease({
                  owner: context.repo.owner,
                  repo: context.repo.repo,
                  name: `Release ${tag_name}`,
                  tag_name: tag_name,
                  target_commitish: tagSha,
                })
                .then((release) => {
                  console.log(`Release URL ${release["data"]["html_url"]}`);
                  console.log(`Tagged: ${release["data"]["tag_name"]}`);
                });
              console.log("Push tag to production");
              octokit.repos.merge({
                owner: context.repo.owner,
                repo: context.repo.repo,
                base: "production",
                head: tagSha,
              });
            } else {
              console.log("Nothing new to release.");
            }
          });
      });
  });
}
run();
