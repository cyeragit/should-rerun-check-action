import * as core from '@actions/core'
import * as github from '@actions/github'

const baseBranchArg = core.getInput('base_branch')
const prNumberArg = core.getInput('pr_number')
const checkNameArg = core.getInput('check_name')
const numberOfRequiredApprovesArg = core.getInput('number_of_required_approves');
const token = core.getInput('token')
const client = github.getOctokit(token)

function getMergeMessagePrefixes(branchName: string) {
    return [
        `Merge remote-tracking branch 'origin/${branchName}' into`,
        `Merge branch '${branchName}' of`,
        "Merge remote-tracking branch 'origin' into"
    ]
}

async function getPRCommits(prNumber: number) {
    return await client.rest.pulls.listCommits({
        ...github.context.repo,
        pull_number: prNumber
    });
}

async function hasCheckRunOnCommit(checkName: string, commitSha: string): Promise<boolean> {
    const commitChecks = (await client.rest.checks.listForRef({
        ...github.context.repo,
        ref: commitSha
    })).data;

    return commitChecks.check_runs.some(checkRun => checkRun.name === checkName);
}

async function isMergeToBaseBranch(commit, baseBranch: string): Promise<boolean> {
    return commit.parents.length === 2 && 
    getMergeMessagePrefixes(baseBranch).some(mergeMessage => commit.commit.message.includes(mergeMessage));
}

async function shouldReRunCheck(prNumber: number, checkName: string, baseBranch: string): Promise<boolean> {
    const prCommits = await getPRCommits(+prNumber);
    for (const commit of prCommits.data) {
        const isMergeCommit = await isMergeToBaseBranch(commit, baseBranch);
        const hasCheckRun = await hasCheckRunOnCommit(checkName, commit.sha)

        if (hasCheckRun) { break; }
        if (!isMergeCommit) {
            return true;
        }
    }
    return false;
}

async function isPRApproved(prNumber: number, numberOfRequiredApproves: number): Promise<boolean> {
    const reviews = (await client.rest.pulls.listReviews({
        ...github.context.repo,
        pull_number: prNumber
    })).data;

    const approvedReviews = reviews.map(review => review.state === "APPROVED").filter(Boolean);
    return approvedReviews.length === numberOfRequiredApproves;
}

async function main() {
    const prNumber = +prNumberArg;
    let shouldRerun = false;

    const isApproved = await isPRApproved(prNumber, +numberOfRequiredApprovesArg);
    core.info(`PR ${prNumber} - ${isApproved}`);
    if (isApproved) {
        shouldRerun = await shouldReRunCheck(prNumber, checkNameArg, baseBranchArg);
        core.info(`PR ${prNumber} - Should rerun check ${checkNameArg}: ${shouldRerun}`);
    } else {
        core.info(`Skipping PR ${prNumber} - PR is not approved yet`);
    }

    core.setOutput("should_rerun", shouldRerun);
}

main()
