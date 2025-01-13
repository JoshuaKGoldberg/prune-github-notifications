import { octokitFromAuth } from "octokit-from-auth";
import throttledQueue from "throttled-queue";

import { createThreadFilter, FilterableThread } from "./createThreadFilter.js";
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
	verbose = false,
}: PruneGitHubNotificationsOptions = {}): Promise<PruneGitHubNotificationsResult> {
	const octokit = await octokitFromAuth({ auth });

	const notifications = await octokit.request("GET /notifications", {
		headers: {
			"X-GitHub-Api-Version": "2022-11-28",
		},
	});

	const filtersWithDefaults = {
		author: filters?.author ?? defaultOptions.filters.author,
		botAuthors: filters?.botAuthors ?? defaultOptions.filters.botAuthors,
		reason: filters?.reason ?? defaultOptions.filters.reason,
		title: filters?.title ?? defaultOptions.filters.title,
	};

	const notificationsWithAuthorData: FilterableThread[] =
		notifications.data.map((notification) => ({
			latest_comment_author: undefined,
			latest_comment_url: notification.subject.latest_comment_url,
			reason: notification.reason,
			subject: notification.subject,
		}));

	if (filtersWithDefaults.author || filtersWithDefaults.botAuthors) {
		// Add author data to each notification (if applicable)
		for (const notification of notificationsWithAuthorData) {
			if (notification.reason === "author" && notification.latest_comment_url) {
				const comment = await octokit.request(
					notification.latest_comment_url as unknown as "GET /repos/{owner}/{repo}/issues/comments/{comment_id}",
				);

				notification.latest_comment_author = comment.data.user?.login;
			}
		}
	}

	if (verbose) {
		console.log(`Found ${notificationsWithAuthorData.length} notifications`);
	}

	const threadFilter = createThreadFilter(filtersWithDefaults);

	// TODO: Why is the type not being friendly?
	const throttle = (throttledQueue as unknown as ThrottledQueue)(
		// Each throttled function makes two requests
		bandwidth / 2,
		1000,
	);

	const filteredThreads = notifications.data.filter(threadFilter);

	if (verbose) {
		console.log(
			`Found ${filteredThreads.length} notifications matching the filter criteria`,
		);
		console.log("Starting deletion...");
	}

	if (filteredThreads.length === 0) {
		if (logFilterWhenEmpty) {
			console.log(
				"No notifications found matching the filter criteria:",
				filtersWithDefaults,
			);
		}
		return { threads: [] };
	}

	const threads = filteredThreads.map((thread) => Number(thread.id));

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

	if (verbose) {
		console.log(`Deleted ${threads.length} notifications`);
	}

	return { threads };
}
