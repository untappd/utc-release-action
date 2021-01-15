"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
  return new (P || (P = Promise))(function (resolve, reject) {
    function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
    function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
    function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};
const core = require('@actions/core');
const github = require('@actions/github');
const { context } = require('@actions/github/lib/utils');
function run() {
  return __awaiter(this, void 0, void 0, function* () {
    const octokit = github.getOctokit(core.getInput('github_token'))
    let tag_name = core.getInput('tag_name')

    if (!tag_name) {
      const date = new Date()
      tag_name = `${date.getFullYear()}.${date.getMonth()}.${date.getDate()}.${date.getHours()}${date.getMinutes()}${date.getSeconds()}`
    }

    octokit.repos.createRelease({
      owner: context.repo.owner,
      repo: context.repo.repo,
      tag_name: tag_name,
    }).then((release) => {

      console.log(release)
      octokit.git.getRef({
        owner: context.repo.owner,
        repo: context.repo.repo,
        ref: `tags/${tag_name}`,
      }).then((tag) => {

        octokit.repos.compareCommits({
          owner: context.repo.owner,
          repo: context.repo.repo,
          base: 'production',
          head: tag_name,
        }).then((comparison) => {

          console.log(comparison)
          if (comparison['data']['total_commits'] > 0) {
            console.log(tag)
            octokit.git.updateRef({
              owner: context.repo.owner,
              repo: context.repo.repo,
              ref: "heads/production",
              sha: tag['data']['object']['sha'],
              force: true,
            })
          } else {
            console.log("Nothing new to release.")
          }
        })
      })
    })
  });
}
run();