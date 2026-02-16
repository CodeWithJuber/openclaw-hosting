---
name: github-integration
version: 1.0.0
description: Integrate with GitHub API - manage repos, issues, PRs, workflows, and more.
homepage: https://github.com/openclaw/skills/github-integration
---

# GitHub Integration Skill

Interact with GitHub API to manage repositories, issues, pull requests, actions, and more.

## Installation

```bash
npm install @octokit/rest
```

## Quick Start

```javascript
const { Octokit } = require('@octokit/rest');

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

// Get user info
const { data: user } = await octokit.rest.users.getAuthenticated();
console.log(`Hello ${user.login}!`);
```

## Authentication

### Personal Access Token

1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Generate new token (classic) or fine-grained token
3. Select required scopes (repo, workflow, etc.)
4. Set as environment variable:

```bash
GITHUB_TOKEN=ghp_your_token_here
```

## Repository Operations

### Create Repository

```javascript
// Create new repo
await octokit.rest.repos.createForAuthenticatedUser({
  name: 'my-new-repo',
  description: 'My awesome project',
  private: false,
  auto_init: true
});

// Create from template
await octokit.rest.repos.createUsingTemplate({
  template_owner: 'owner',
  template_repo: 'template-repo',
  name: 'my-new-repo'
});
```

### List Repositories

```javascript
// List your repos
const { data: repos } = await octokit.rest.repos.listForAuthenticatedUser({
  sort: 'updated',
  per_page: 10
});

repos.forEach(repo => {
  console.log(`${repo.name}: ${repo.description}`);
});
```

### Clone/Pull Repository

```javascript
const { execSync } = require('child_process');

// Clone repository
execSync(`git clone https://github.com/${owner}/${repo}.git`);

// Pull latest changes
execSync('git pull', { cwd: './repo-directory' });
```

## Issues

### Create Issue

```javascript
await octokit.rest.issues.create({
  owner: 'username',
  repo: 'repo-name',
  title: 'Bug: Something is broken',
  body: 'Detailed description of the bug...',
  labels: ['bug', 'high-priority'],
  assignees: ['username']
});
```

### List Issues

```javascript
const { data: issues } = await octokit.rest.issues.listForRepo({
  owner: 'username',
  repo: 'repo-name',
  state: 'open',
  labels: 'bug',
  sort: 'created',
  direction: 'desc'
});

issues.forEach(issue => {
  console.log(`#${issue.number}: ${issue.title}`);
});
```

### Update Issue

```javascript
await octokit.rest.issues.update({
  owner: 'username',
  repo: 'repo-name',
  issue_number: 1,
  state: 'closed',
  labels: ['bug', 'fixed']
});
```

## Pull Requests

### Create Pull Request

```javascript
await octokit.rest.pulls.create({
  owner: 'username',
  repo: 'repo-name',
  title: 'Add new feature',
  body: 'Description of changes...',
  head: 'feature-branch',
  base: 'main'
});
```

### List Pull Requests

```javascript
const { data: prs } = await octokit.rest.pulls.list({
  owner: 'username',
  repo: 'repo-name',
  state: 'open',
  sort: 'updated'
});

prs.forEach(pr => {
  console.log(`PR #${pr.number}: ${pr.title} by ${pr.user.login}`);
});
```

### Merge Pull Request

```javascript
await octokit.rest.pulls.merge({
  owner: 'username',
  repo: 'repo-name',
  pull_number: 1,
  commit_title: 'Merge pull request #1',
  merge_method: 'squash' // or 'merge', 'rebase'
});
```

## File Operations

### Get File Content

```javascript
const { data } = await octokit.rest.repos.getContent({
  owner: 'username',
  repo: 'repo-name',
  path: 'README.md'
});

const content = Buffer.from(data.content, 'base64').toString();
console.log(content);
```

### Create/Update File

```javascript
const content = Buffer.from('# New File\n\nContent here').toString('base64');

await octokit.rest.repos.createOrUpdateFileContents({
  owner: 'username',
  repo: 'repo-name',
  path: 'docs/guide.md',
  message: 'Add documentation',
  content: content,
  branch: 'main'
});
```

### Delete File

```javascript
// First get the file to get the SHA
const { data: file } = await octokit.rest.repos.getContent({
  owner: 'username',
  repo: 'repo-name',
  path: 'old-file.txt'
});

await octokit.rest.repos.deleteFile({
  owner: 'username',
  repo: 'repo-name',
  path: 'old-file.txt',
  message: 'Remove old file',
  sha: file.sha
});
```

## GitHub Actions

### List Workflows

```javascript
const { data } = await octokit.rest.actions.listRepoWorkflows({
  owner: 'username',
  repo: 'repo-name'
});

data.workflows.forEach(workflow => {
  console.log(`${workflow.name}: ${workflow.state}`);
});
```

### Trigger Workflow

```javascript
await octokit.rest.actions.createWorkflowDispatch({
  owner: 'username',
  repo: 'repo-name',
  workflow_id: 'ci.yml',
  ref: 'main',
  inputs: {
    environment: 'production'
  }
});
```

### Get Workflow Runs

```javascript
const { data } = await octokit.rest.actions.listWorkflowRuns({
  owner: 'username',
  repo: 'repo-name',
  workflow_id: 'ci.yml',
  per_page: 5
});

data.workflow_runs.forEach(run => {
  console.log(`Run ${run.run_number}: ${run.status} (${run.conclusion})`);
});
```

## Webhooks

### Create Webhook

```javascript
await octokit.rest.repos.createWebhook({
  owner: 'username',
  repo: 'repo-name',
  config: {
    url: 'https://your-app.com/webhook',
    content_type: 'json'
  },
  events: ['push', 'pull_request', 'issues'],
  active: true
});
```

## Search

### Search Repositories

```javascript
const { data } = await octokit.rest.search.repos({
  q: 'topic:ai-agent language:javascript stars:>100',
  sort: 'stars',
  order: 'desc',
  per_page: 10
});

data.items.forEach(repo => {
  console.log(`${repo.full_name}: ⭐ ${repo.stargazers_count}`);
});
```

### Search Code

```javascript
const { data } = await octokit.rest.search.code({
  q: 'filename:package.json octokit',
  per_page: 10
});

data.items.forEach(item => {
  console.log(`${item.repository.full_name}: ${item.path}`);
});
```

## Gists

### Create Gist

```javascript
await octokit.rest.gists.create({
  description: 'My code snippet',
  public: false,
  files: {
    'script.js': {
      content: 'console.log("Hello World");'
    }
  }
});
```

## Error Handling

```javascript
try {
  await octokit.rest.repos.get({
    owner: 'username',
    repo: 'non-existent-repo'
  });
} catch (error) {
  if (error.status === 404) {
    console.log('Repository not found');
  } else {
    console.error('GitHub API error:', error.message);
  }
}
```

## Rate Limiting

```javascript
const { data: rateLimit } = await octokit.rest.rateLimit.get();

console.log(`Remaining: ${rateLimit.rate.remaining}`);
console.log(`Resets at: ${new Date(rateLimit.rate.reset * 1000)}`);
```

## Complete Example

```javascript
require('dotenv').config();
const { Octokit } = require('@octokit/rest');

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

async function main() {
  // Get authenticated user
  const { data: user } = await octokit.rest.users.getAuthenticated();
  console.log(`Authenticated as: ${user.login}`);
  
  // List recent repos
  const { data: repos } = await octokit.rest.repos.listForAuthenticatedUser({
    sort: 'updated',
    per_page: 5
  });
  
  console.log('\nRecent repositories:');
  repos.forEach(repo => {
    console.log(`- ${repo.name}: ${repo.description || 'No description'}`);
  });
  
  // Create an issue
  if (process.env.TARGET_REPO) {
    const [owner, repo] = process.env.TARGET_REPO.split('/');
    await octokit.rest.issues.create({
      owner,
      repo,
      title: 'Automated issue from OpenClaw',
      body: 'This issue was created automatically.'
    });
    console.log('\nIssue created successfully!');
  }
}

main().catch(console.error);
```

## Resources

- [Octokit.js Documentation](https://octokit.github.io/rest.js/)
- [GitHub REST API](https://docs.github.com/en/rest)
- [GitHub GraphQL API](https://docs.github.com/en/graphql)
