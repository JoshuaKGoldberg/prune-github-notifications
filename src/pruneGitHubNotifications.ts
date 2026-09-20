import debug from "debug";
import { octokitFromAuth } from "octokit-from-auth";
import throttledQueue from "throttled-queue";

import { createThreadFilter } from "./createThreadFilter.js";
import { defaultOptions } from "./options.js";
import { resolveFilters } from "./resolveFilters.js";
import {
	PruneGitHubNotificationsOptions,
	PruneGitHubNotificationsResult,
} from "./types.js";

const log = debug("prune-github-notifications");

type ThrottledQueue = (
	maxRequestsPerInterval: number,
	interval: number,
	evenlySpaced?: boolean,
) => <Return = unknown>(fn: () => Promise<Return> | Return) => Promise<Return>;

export async function pruneGitHubNotifications({
	auth,
	bandwidth = defaultOptions.bandwidth,
	filters,
}: PruneGitHubNotificationsOptions = {}): Promise<PruneGitHubNotificationsResult> {
	const octokit = await octokitFromAuth({ auth });

	const notifications = await octokit.request("GET /notifications", {
		headers: {
			"X-GitHub-Api-Version": "2022-11-28",
		},
	});
	log("Fetched %d notification(s)", notifications.data.length);

	const threadFilter = createThreadFilter(resolveFilters(filters));

	// TODO: Why is the type not being friendly?
	const throttle = (throttledQueue as unknown as ThrottledQueue)(
		// Each throttled function makes two requests
		bandwidth / 2,
		1000,
	);

	const threads = notifications.data
		.filter(threadFilter)
		.map((thread) => Number(thread.id));

	log("%d notification(s) matched filters", threads.length);

	await Promise.all(
		threads.map(async (thread) => {
			await throttle(async () => {
				log("Pruning thread %d", thread);
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

	log("Pruned %d thread(s)", threads.length);

	return { threads };
}
