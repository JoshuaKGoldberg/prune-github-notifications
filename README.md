<h1 align="center">prune-github-notifications</h1>

<p align="center">Prunes GitHub notifications you don't care about, such as automated dependency bumps. 🧹</p>

<p align="center">
	<!-- prettier-ignore-start -->
	<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->
	<a href="#contributors" target="_blank"><img alt="👪 All Contributors: 1" src="https://img.shields.io/badge/%F0%9F%91%AA_all_contributors-1-21bb42.svg" /></a>
<!-- ALL-CONTRIBUTORS-BADGE:END -->
	<!-- prettier-ignore-end -->
	<a href="https://github.com/JoshuaKGoldberg/prune-github-notifications/blob/main/.github/CODE_OF_CONDUCT.md" target="_blank"><img alt="🤝 Code of Conduct: Kept" src="https://img.shields.io/badge/%F0%9F%A4%9D_code_of_conduct-kept-21bb42" /></a>
	<a href="https://codecov.io/gh/JoshuaKGoldberg/prune-github-notifications" target="_blank"><img alt="🧪 Coverage" src="https://img.shields.io/codecov/c/github/JoshuaKGoldberg/prune-github-notifications?label=%F0%9F%A7%AA%20coverage" /></a>
	<a href="https://github.com/JoshuaKGoldberg/prune-github-notifications/blob/main/LICENSE.md" target="_blank"><img alt="📝 License: MIT" src="https://img.shields.io/badge/%F0%9F%93%9D_license-MIT-21bb42.svg"></a>
	<a href="http://npmjs.com/package/prune-github-notifications"><img alt="📦 npm version" src="https://img.shields.io/npm/v/prune-github-notifications?color=21bb42&label=%F0%9F%93%A6%20npm" /></a>
	<img alt="💪 TypeScript: Strict" src="https://img.shields.io/badge/%F0%9F%92%AA_typescript-strict-21bb42.svg" />
</p>

## CLI

`prune-github-notifications` can be run on the CLI with an auth token for _notifications_ access:

```shell
npx prune-github-notifications
```

### CLI Options

| Option        | Type       | Default                                                              | Description                                                                                             |
| ------------- | ---------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `--auth`      | `string`   | `process.env.GH_TOKEN` or executing `gh auth token`                  | Auth token for GitHub from [`octokit-from-auth`](https://github.com/JoshuaKGoldberg/octokit-from-auth). |
| `--bandwidth` | `number`   | `6`                                                                  | Maximum parallel requests to start at once.                                                             |
| `--reason`    | `string[]` | `["subscribed"]`                                                     | Notification reason(s) to filter to.                                                                    |
| `--title`     | `string[]` | `["^chore\(deps\): update .+ to", /^build\(deps-dev\): bump .+ to"]` | Notification title regular expressions to filter to.                                                    |
| `--watch`     | `number`   | `0`                                                                  | A seconds interval to continuously re-run this on, if truthy.                                           |
| `--author`    | `string[]` | -                                                                    | Usernames to ignore notifications from when reason is "author".                                         |
| `--botAuthor` | `boolean`  | false                                                                | Ignore notifications from any authors with "[bot]" in their name                                        |
| `--verbose`   | `boolean`  | false                                                                | Print information while processing notifications                                                        |

For example, providing all functional options on the CLI:

```shell
npx prune-github-notifications --bandwidth 10 --reason subscribed --title "^chore.+ update .+ to"
```

Running in watch mode to clear notifications every ten seconds:

```shell
npx prune-github-notifications --watch 10
```

## Node.js API

```shell
npm i prune-github-notifications
```

```ts
import { pruneGitHubNotifications } from "prune-github-notifications";

await pruneGitHubNotifications({ auth: "gho_..." });
```

If a `process.env.GH_TOKEN` is set, then the `auth` parameter will default to it:

```ts
await pruneGitHubNotifications();
```

### Node.js Options

Only `auth` is required, and only if a `GH_TOKEN` isn't available.

| Option      | Type          | Default                                                              | Description                                              |
| ----------- | ------------- | -------------------------------------------------------------------- | -------------------------------------------------------- |
| `auth`      | `string`      | `process.env.GH_TOKEN`                                               | GitHub authentication token with _notifications_ access. |
| `bandwidth` | `number`      | `6`                                                                  | Maximum parallel requests to start at once.              |
| `reason`    | `Set<string>` | `Set {"subscribed"}`                                                 | Notification reason(s) to filter to.                     |
| `title`     | `RegExp[]`    | `[/^chore\(deps\): update .+ to/, /^build\(deps-dev\): bump .+ to/]` | Notification title regular expressions to filter to.     |

For example, providing all options to the Node.js API:

```ts
await pruneGitHubNotifications({
	auth: "gho_...",
	bandwidth: 10,
	reason: subscribed,
	title: ["^chore.+ update .+ to"],
});
```

## Development

See [`.github/CONTRIBUTING.md`](./.github/CONTRIBUTING.md), then [`.github/DEVELOPMENT.md`](./.github/DEVELOPMENT.md).
Thanks! 💖

## Contributors

<!-- spellchecker: disable -->
<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tbody>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="http://www.joshuakgoldberg.com"><img src="https://avatars.githubusercontent.com/u/3335181?v=4?s=100" width="100px;" alt="Josh Goldberg"/><br /><sub><b>Josh Goldberg</b></sub></a><br /><a href="#tool-JoshuaKGoldberg" title="Tools">🔧</a> <a href="#maintenance-JoshuaKGoldberg" title="Maintenance">🚧</a> <a href="#ideas-JoshuaKGoldberg" title="Ideas, Planning, & Feedback">🤔</a> <a href="https://github.com/JoshuaKGoldberg/prune-github-notifications/commits?author=JoshuaKGoldberg" title="Code">💻</a> <a href="https://github.com/JoshuaKGoldberg/prune-github-notifications/issues?q=author%3AJoshuaKGoldberg" title="Bug reports">🐛</a></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->
<!-- spellchecker: enable -->

<!-- You can remove this notice if you don't want it 🙂 no worries! -->

> 💙 This package was templated with [`create-typescript-app`](https://github.com/JoshuaKGoldberg/create-typescript-app).
