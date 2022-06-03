#!/usr/bin/env bash

# Copyright _!_
#
# License _!_

set -e

if [[ "$1" == "-s" || "$1" == "--staging" ]]; then
    requiredBranch=staging
    deployEnv=staging
else
    requiredBranch=main
    deployEnv=production
fi

currentBranch=$(git rev-parse --abbrev-ref HEAD)

if [ "$currentBranch" != "$requiredBranch" ]; then
    echo "Cannot deploy to $deployEnv."
    echo "You may only deploy from branch: $requiredBranch"
    echo "You are currently on branch: $currentBranch"
    echo
    echo "To deploy to staging"
    echo "$ ./bin/deploy.sh -s"
    echo
    echo "To deploy to production"
    echo "$ ./bin/deploy.sh"
    exit 1
fi

git fetch

localHeadHash=$(git rev-parse $requiredBranch)
remoteHeadHash=$(git rev-parse origin/$requiredBranch)

if [ "$localHeadHash" != "$remoteHeadHash" ]; then
    echo "Cannot deploy to $deployEnv."
    echo "The local repo is out of sync with the remote repo."
    echo
    echo "If remote repo is ahead of local repo"
    echo "$ git pull --rebase"
    echo
    echo "If remote repo is behind local repo"
    echo "$ git push"
    exit 1
else
    echo "Started $deployEnv deployment at `date`..."
    printf "\n"
fi

workflowUrl=https://github.com/filecoin-project/retrieval-client/actions/workflows/${deployEnv}.yml
gitHash=$(git rev-parse --short HEAD)
tagName=$deployEnv/$gitHash

# Delete tag if it exists from a prior deployment.
if git rev-parse -q --verify "refs/tags/$tagName" >/dev/null; then
    git tag -d $tagName
    # Ignore error if remote tag doesn't exist.
    git push --delete origin $tagName &>/dev/null || true
fi

git tag -a $tagName -m $tagName
git push origin $tagName

echo
echo
echo ">> Pushed to CI/CD <<"
echo
echo "Workflow URL: $workflowUrl"
