import { Octokit } from "octokit";
import throttledQueue from "throttled-queue";

import { createThreadFilter } from "./createThreadFilter.js";
import { defaultOptions } from "./options.js";
import { PruneGitHubNotificationsOptions } from "./types.js";

type ThrottledQueue = (
	maxRequestsPerInterval: number,
	interval: number,
	evenlySpaced?: boolean,
) => <Return = unknown>(fn: () => Promise<Return> | Return) => Promise<Return>;

export async function pruneGitHubNotifications({
	auth,
	bandwidth = defaultOptions.bandwidth,
	filters,
}: PruneGitHubNotificationsOptions = {}): Promise<void> {
	auth ??= process.env.GH_TOKEN;
	if (!auth) {
		throw new Error(`Please provide an auth token (process.env.GH_TOKEN).`);
	}

	const octokit = new Octokit({ auth });
	const notifications = await octokit.request("GET /notifications", {
		headers: {
			"X-GitHub-Api-Version": "2022-11-28",
		},
	});
	const threadFilter = createThreadFilter({
		reason: filters?.reason ?? defaultOptions.filters.reason,
		title: filters?.title ?? defaultOptions.filters.title,
	});

	// TODO: Why is the type not being friendly?
	const throttle = (throttledQueue as unknown as ThrottledQueue)(
		// Each throttled function makes two requests
		bandwidth / 2,
		1000,
	);

	const threadsToIgnore = notifications.data
		.filter(threadFilter)
		.map((thread) => Number(thread.id));

	await Promise.all(
		threadsToIgnore.map(async (thread) => {
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
}
