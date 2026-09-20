import { octokitFromAuth } from "octokit-from-auth";
import throttledQueue from "throttled-queue";

import { createLastCommentByFilter } from "./createLastCommentByFilter.js";
import { createThreadFilter } from "./createThreadFilter.js";
import { getLatestCommentAuthor } from "./getLatestCommentAuthor.js";
import { defaultOptions } from "./options.js";
import { resolveFilters } from "./resolveFilters.js";
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
}: PruneGitHubNotificationsOptions = {}): Promise<PruneGitHubNotificationsResult> {
	const octokit = await octokitFromAuth({ auth });

	const notifications = await octokit.request("GET /notifications", {
		headers: {
			"X-GitHub-Api-Version": "2022-11-28",
		},
	});
	const resolvedFilters = resolveFilters(filters);
	const threadFilter = createThreadFilter(resolvedFilters);
	const lastCommentByFilter = createLastCommentByFilter(resolvedFilters);

	// TODO: Why is the type not being friendly?
	const throttle = (throttledQueue as unknown as ThrottledQueue)(
		// Each throttled function makes two requests
		bandwidth / 2,
		1000,
	);

	let matchingThreads = notifications.data.filter(threadFilter);

	// Comment authors take a request per thread, so only look them up if needed
	if (lastCommentByFilter) {
		const authors = await Promise.all(
			matchingThreads.map((thread) =>
				throttle(() =>
					getLatestCommentAuthor(octokit, thread.subject.latest_comment_url),
				),
			),
		);

		matchingThreads = matchingThreads.filter((_, i) =>
			lastCommentByFilter(authors[i]),
		);
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
