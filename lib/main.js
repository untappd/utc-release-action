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
const core = require("@actions/core");
const github = require("@actions/github");
const { context } = require("@actions/github/lib/utils");
function run() {
  return __awaiter(this, void 0, void 0, function* () {
    const octokit = github.getOctokit(core.getInput("github_token"));
    let tag_name = core.getInput("tag_name");

    if (!tag_name) {
      const date = new Date();
      tag_name = `${date.getFullYear()}.${date.getMonth()}.${date.getDate()}.${date.getHours()}${date.getMinutes()}${date.getSeconds()}`;
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
        octokit.repos
          .compareCommits({
            owner: context.repo.owner,
            repo: context.repo.repo,
            base: "production",
            head: master["data"]["object"]["sha"],
          })
          .then((comparison) => {
            const totalCommits = comparison["data"]["total_commits"];
            console.log(`${totalCommits} commits difference`);
            if (totalCommits > 0) {
              console.log("Creating a release");
              octokit.repos.createRelease({
                owner: context.repo.owner,
                repo: context.repo.repo,
                tag_name: tag_name,
              });
              console.log("Force push tag to production");
              octokit.git.updateRef({
                owner: context.repo.owner,
                repo: context.repo.repo,
                ref: "heads/production",
                sha: master["data"]["object"]["sha"],
                force: true,
              });
            } else {
              console.log("Nothing new to release.");
            }
          });
      });
  });
}
run();
