import { octokitFromAuth } from "octokit-from-auth";
import throttledQueue from "throttled-queue";

import { createThreadFilter } from "./createThreadFilter.js";
import { defaultOptions } from "./options.js";
import {
	PruneGitHubNotificationsOptions,
	PruneGitHubNotificationsResult,
} from "./types.js";

type ThrottledQueue = (
	maxRequestsPerInterval: number,
	interval: number,
	evenlySpaced?: boolean,
) => <Return = unknown>(fn: () => Promise<Return> | Return) => Promise<Return>;

export async function pruneGitHubNotifications({
	auth,
	bandwidth = defaultOptions.bandwidth,
	filters,
	logFilterWhenEmpty = false,
}: PruneGitHubNotificationsOptions = {}): Promise<PruneGitHubNotificationsResult> {
	const octokit = await octokitFromAuth({ auth });

	const notifications = await octokit.request("GET /notifications", {
		headers: {
			"X-GitHub-Api-Version": "2022-11-28",
		},
	});

	const filtersWithDefaults = {
		reason: filters?.reason ?? defaultOptions.filters.reason,
		title: filters?.title ?? defaultOptions.filters.title,
	};

	const threadFilter = createThreadFilter(filtersWithDefaults);

	// TODO: Why is the type not being friendly?
	const throttle = (throttledQueue as unknown as ThrottledQueue)(
		// Each throttled function makes two requests
		bandwidth / 2,
		1000,
	);

	const matchingThreads = notifications.data.filter(threadFilter);

	if (matchingThreads.length === 0) {
		if (logFilterWhenEmpty) {
			console.log(
				"No notifications found matching the filter criteria:",
				filtersWithDefaults,
			);
		}
		return { threads: [] };
	}

	const threads = matchingThreads.map((thread) => Number(thread.id));

	await Promise.all(
		threads.map(async (thread) => {
			await throttle(async () => {
				await octokit.request("DELETE /notifications/threads/{thread_id}", {
					headers: {
						"X-GitHub-Api-Version": "2022-11-28",
					},
					thread_id: thread,
				});
				await octokit.request(
					"DELETE /notifications/threads/{thread_id}/subscription",
					{
						headers: {
							"X-GitHub-Api-Version": "2022-11-28",
						},
						thread_id: thread,
					},
				);
			});
		}),
	);

	return { threads };
}
