import { PruneGitHubNotificationsOptions } from "./types.js";

export const defaultOptions = {
	// https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api?apiVersion=2022-11-28#about-secondary-rate-limits
	// 1800 points per minute, or 30 points per second
	// 5 points per DELETE request
	// 30 points per second / 5 points per DELETE request = 6 simultaneous requests
	bandwidth: 6,

	filters: {
		author: undefined,
		botAuthors: false,
		reason: new Set(["subscribed"]),
		title: [/^chore\(deps\): update .+ to/, /^build\(deps-dev\): bump .+ to/],
	},
} satisfies PruneGitHubNotificationsOptions;
