import { afterEach, describe, expect, it, vi } from "vitest";

import { pruneGitHubNotifications } from "./pruneGitHubNotifications.js";

const defaultNotifications = {
	data: [
		{
			id: "12",
			reason: "subscribed",
			subject: {
				title: "chore(deps): update abc to 1.2.3",
			},
		},
		{
			id: "34",
			reason: "other-reason",
			subject: {
				title: "chore(deps): update abc to 1.2.3",
			},
		},
		{
			id: "56",
			reason: "subscribed",
			subject: {
				title: "other-title",
			},
		},
		{
			id: "78",
			reason: "other-reason",
			subject: {
				title: "other title",
			},
		},
	],
};

const mockRequest = vi.fn().mockResolvedValue(defaultNotifications);

vi.mock("octokit-from-auth", () => ({
	octokitFromAuth: () =>
		Promise.resolve({
			request: mockRequest,
		}),
}));

describe("pruneGitHubNotifications", () => {
	it("unsubscribes from threads based on default filters when no filters are provided", async () => {
		await pruneGitHubNotifications();

		expect(mockRequest.mock.calls).toMatchInlineSnapshot(`
			[
			  [
			    "GET /notifications",
			    {
			      "headers": {
			        "X-GitHub-Api-Version": "2022-11-28",
			      },
			    },
			  ],
			  [
			    "DELETE /notifications/threads/{thread_id}",
			    {
			      "headers": {
			        "X-GitHub-Api-Version": "2022-11-28",
			      },
			      "thread_id": 12,
			    },
			  ],
			  [
			    "DELETE /notifications/threads/{thread_id}/subscription",
			    {
			      "headers": {
			        "X-GitHub-Api-Version": "2022-11-28",
			      },
			      "thread_id": 12,
			    },
			  ],
			]
		`);
	});

	it("unsubscribes from threads based on custom filters when custom filters are provided", async () => {
		await pruneGitHubNotifications({
			filters: { reason: new Set(["other-reason"]), title: [/other title/] },
		});

		expect(mockRequest.mock.calls).toMatchInlineSnapshot(`
			[
			  [
			    "GET /notifications",
			    {
			      "headers": {
			        "X-GitHub-Api-Version": "2022-11-28",
			      },
			    },
			  ],
			  [
			    "DELETE /notifications/threads/{thread_id}",
			    {
			      "headers": {
			        "X-GitHub-Api-Version": "2022-11-28",
			      },
			      "thread_id": 78,
			    },
			  ],
			  [
			    "DELETE /notifications/threads/{thread_id}/subscription",
			    {
			      "headers": {
			        "X-GitHub-Api-Version": "2022-11-28",
			      },
			      "thread_id": 78,
			    },
			  ],
			]
		`);
	});

	describe("lastCommentBy", () => {
		const notificationsWithComments = {
			data: [
				{
					id: "12",
					reason: "author",
					subject: {
						latest_comment_url: "https://api.github.com/comments/1",
						title: "PR by a bot",
					},
				},
				{
					id: "34",
					reason: "author",
					subject: {
						latest_comment_url: "https://api.github.com/comments/2",
						title: "PR by a human",
					},
				},
				{
					id: "56",
					reason: "author",
					subject: {
						latest_comment_url: null,
						title: "PR with no comments",
					},
				},
			],
		};

		const lastCommentBys: Record<string, string> = {
			"GET https://api.github.com/comments/1": "codecov[bot]",
			"GET https://api.github.com/comments/2": "human",
		};

		afterEach(() => {
			mockRequest.mockReset().mockResolvedValue(defaultNotifications);
		});

		it("does not request comment data when lastCommentBy is not provided", async () => {
			await pruneGitHubNotifications({
				filters: { reason: new Set(["subscribed"]) },
			});

			expect(
				mockRequest.mock.calls.filter(([route]) =>
					(route as string).startsWith("GET https://"),
				),
			).toHaveLength(0);
		});

		it("only unsubscribes from threads whose latest comment author matches when lastCommentBy is provided", async () => {
			mockRequest.mockImplementation((route: string) => {
				if (route === "GET /notifications") {
					return Promise.resolve(notificationsWithComments);
				}

				if (route in lastCommentBys) {
					return Promise.resolve({
						data: { user: { login: lastCommentBys[route] } },
					});
				}

				return Promise.resolve({});
			});

			const result = await pruneGitHubNotifications({
				filters: {
					lastCommentBy: [/\[bot\]$/],
					reason: new Set(["author"]),
					title: [/PR/],
				},
			});

			expect(result.threads).toEqual([12]);
			expect(
				mockRequest.mock.calls.filter(([route]) =>
					(route as string).startsWith("DELETE"),
				),
			).toMatchInlineSnapshot(`
				[
				  [
				    "DELETE /notifications/threads/{thread_id}",
				    {
				      "headers": {
				        "X-GitHub-Api-Version": "2022-11-28",
				      },
				      "thread_id": 12,
				    },
				  ],
				  [
				    "DELETE /notifications/threads/{thread_id}/subscription",
				    {
				      "headers": {
				        "X-GitHub-Api-Version": "2022-11-28",
				      },
				      "thread_id": 12,
				    },
				  ],
				]
			`);
		});
	});

	describe("createdBy", () => {
		const notificationsWithAuthors = {
			data: [
				{
					id: "12",
					reason: "subscribed",
					subject: {
						latest_comment_url: "https://api.github.com/comments/1",
						title: "PR by a bot",
						url: "https://api.github.com/pulls/1",
					},
				},
				{
					id: "34",
					reason: "subscribed",
					subject: {
						latest_comment_url: "https://api.github.com/comments/2",
						title: "PR by a human",
						url: "https://api.github.com/pulls/2",
					},
				},
				{
					id: "56",
					reason: "subscribed",
					subject: {
						latest_comment_url: null,
						title: "PR with no url",
						url: null,
					},
				},
			],
		};

		const authors: Record<string, string> = {
			"GET https://api.github.com/comments/1": "human",
			"GET https://api.github.com/comments/2": "codecov[bot]",
			"GET https://api.github.com/pulls/1": "renovate[bot]",
			"GET https://api.github.com/pulls/2": "human",
		};

		const mockNotificationsWithAuthors = () => {
			mockRequest.mockImplementation((route: string) => {
				if (route === "GET /notifications") {
					return Promise.resolve(notificationsWithAuthors);
				}

				if (route in authors) {
					return Promise.resolve({ data: { user: { login: authors[route] } } });
				}

				return Promise.resolve({});
			});
		};

		afterEach(() => {
			mockRequest.mockReset().mockResolvedValue(defaultNotifications);
		});

		it("only unsubscribes from threads whose author matches when createdBy is provided", async () => {
			mockNotificationsWithAuthors();

			const result = await pruneGitHubNotifications({
				filters: {
					createdBy: [/\[bot\]$/],
					title: [/PR/],
				},
			});

			expect(result.threads).toEqual([12]);
			expect(
				mockRequest.mock.calls.filter(([route]) =>
					(route as string).startsWith("GET https://"),
				),
			).toHaveLength(2);
		});

		it("only requests comment authors for threads whose author matches when both createdBy and lastCommentBy are provided", async () => {
			mockNotificationsWithAuthors();

			const result = await pruneGitHubNotifications({
				filters: {
					createdBy: [/^human$/],
					lastCommentBy: [/\[bot\]$/],
					title: [/PR/],
				},
			});

			expect(result.threads).toEqual([34]);
			expect(
				mockRequest.mock.calls
					.map(([route]) => route as string)
					.filter((route) => route.startsWith("GET https://")),
			).toEqual([
				"GET https://api.github.com/pulls/1",
				"GET https://api.github.com/pulls/2",
				"GET https://api.github.com/comments/2",
			]);
		});
	});
});
