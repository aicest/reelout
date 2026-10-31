---
name: commit-and-review
description: 'Guides requested changes through branch selection and focused commits, then asks whether to push and open a PR for review and fixes. Use when the user asks to commit changes and have them reviewed.'
license: MIT
---

# Commit and Review

Commit only the requested changes, grouping them into focused commits. Then ask whether to push the branch and open a pull request. If the user agrees, run a delegated review-and-fix loop until ready. Never merge the PR.

## Workflow

1. **Inspect the repository and scope.**
   - Check the current branch and repository default branch, worktree status, staged and unstaged diffs, untracked files, and whether the current branch has commits absent from the default branch. Refresh remote references if needed.
   - Identify which staged, unstaged, and untracked changes belong to this request. Preserve unrelated work and all existing commits; never include, discard, or rewrite them.
   - If the ownership or scope of any changes is unclear, ask the user before staging or switching branches.
2. **Choose the working branch.**
   - If the current branch is the default branch or has commits absent from it, create a new topic branch from the default branch. Otherwise, continue on the current feature branch.
   - When creating a new branch, carry over only this request's staged, unstaged, and untracked changes. Leave all existing commits on their original branch; do not cherry-pick, replay, or otherwise move them.
   - Preserve unrelated staged, unstaged, and untracked changes. If switching branches could disturb them, or the requested changes depend on commits that will remain on the original branch, stop and ask how to proceed.
   - Choose a short, descriptive branch name and confirm it is unused locally and on the remote. Never overwrite an existing branch.
3. **Implement and verify.**
   - Make or complete only the requested changes and follow repository conventions.
   - Run the focused tests and checks appropriate to the changes. Fix failures they cause; report unrelated failures clearly.
4. **Group and commit the changes.**
   - Group the requested changes by logical concern. Create separate commits for distinct concerns when each is meaningful on its own; otherwise, use one cohesive commit.
   - Stage one group at a time and inspect its staged diff. Include only request-specific changes from the staged, unstaged, or untracked work; exclude unrelated changes, secrets, and generated artifacts.
   - Write a clear, focused commit message for each group, following repository conventions and keeping the commit order coherent. Never amend existing commits.
   - Before each commit, recheck the worktree and staged diff. If no relevant uncommitted changes remain, report that instead of recreating existing commits.
5. **Ask whether to publish.**
   - After all requested changes are committed, use the ask-user tool to ask whether the user wants the branch pushed and a PR opened or updated.
   - If the user says no, stop. Do not push, open a PR, or start a review loop.
   - If the user says yes, push the working branch to its configured remote. Never force-push or rewrite history. If the push is rejected or the remote branch has diverged, stop and ask how to proceed.
6. **Open or update the PR.**
   - Open a PR for the working branch, or update its existing PR instead of creating a duplicate.
   - Include a concise change summary and the verification performed. Never merge the PR.
7. **Review and fix until ready.**
   - Start a read-only review subagent with the PR diff and relevant context. Ask it to report actionable defects introduced by the changes, citing files and lines and explaining the reasoning and severity.
   - If it finds actionable issues, start a separate fix subagent. Limit its task to those findings; ask it to preserve unrelated work and report its changes and tests.
   - Inspect the fix agent's diff, run relevant checks, and verify that the findings are resolved without unrelated changes. Group the fixes into focused commits and push them to update the PR.
   - Request a fresh review of the updated PR diff. Repeat review, fixes, verification, commits, and pushes until the reviewer finds no actionable issues and required checks pass.
   - If a subagent is unavailable, an issue cannot be fixed safely, a finding recurs without progress, or an external check blocks readiness, stop and report what remains. Do not claim the review is complete or the PR is ready without evidence.
8. **Report the outcome.**
   - Report the branch, commits, PR link, checks run, and review status. Note any pending CI, approval, or other requirement outside your control.

## Safety

- The user's answer after committing controls publication and PR review: yes authorizes pushing, opening or updating the PR, and pushing focused review-fix commits; no means stop without publishing or reviewing.
- Never force-push, rewrite history, amend existing commits, or alter unrelated work. Do not merge the PR.
