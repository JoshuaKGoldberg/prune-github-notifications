import { octokitFromAuth } from "octokit-from-auth";
import throttledQueue from "throttled-queue";

import { AuthorFilter, createAuthorFilter } from "./createAuthorFilter.js";
import { createThreadFilter } from "./createThreadFilter.js";
import { getAuthorLogin } from "./getAuthorLogin.js";
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

	// TODO: Why is the type not being friendly?
	const throttle = (throttledQueue as unknown as ThrottledQueue)(
		// Each throttled function makes two requests
		bandwidth / 2,
		1000,
	);

	// Author logins take a request per thread, so only look them up if needed
	const filterByAuthor = async <Thread>(
		threads: Thread[],
		authorFilter: AuthorFilter | undefined,
		getUrl: (thread: Thread) => null | string | undefined,
	) => {
		if (!authorFilter) {
			return threads;
		}

		const authors = await Promise.all(
			threads.map((thread) =>
				throttle(() => getAuthorLogin(octokit, getUrl(thread))),
			),
		);

		return threads.filter((_, i) => authorFilter(authors[i]));
	};

	const matchingThreads = await filterByAuthor(
		await filterByAuthor(
			notifications.data.filter(threadFilter),
			createAuthorFilter(resolvedFilters.createdBy),
			(thread) => thread.subject.url,
		),
		createAuthorFilter(resolvedFilters.lastCommentBy),
		(thread) => thread.subject.latest_comment_url,
	);

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
