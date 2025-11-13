
#!/usr/bin/env bash
set -euo pipefail
REMOTE=${GIT_REMOTE:-"git@github.com:YOUR_ORG/csir-serc-recruitment.git"}
BRANCH=${GIT_BRANCH:-"main"}

if [ ! -d .git ]; then
git init
git config user.name "CSIR-SERC Portal"
git config user.email "admin@serc.res.in"
fi

git add .
git commit -m "Initial production build"

git branch -M "$BRANCH"
if git remote | grep -q origin; then
git remote set-url origin "$REMOTE"
else
git remote add origin "$REMOTE"
fi

git push -u origin "$BRANCH"
