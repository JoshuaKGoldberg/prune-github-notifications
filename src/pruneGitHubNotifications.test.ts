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

	describe("commentAuthor", () => {
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

		const commentAuthors: Record<string, string> = {
			"GET https://api.github.com/comments/1": "codecov[bot]",
			"GET https://api.github.com/comments/2": "human",
		};

		afterEach(() => {
			mockRequest.mockReset().mockResolvedValue(defaultNotifications);
		});

		it("does not request comment data when commentAuthor is not provided", async () => {
			await pruneGitHubNotifications({
				filters: { reason: new Set(["subscribed"]) },
			});

			expect(
				mockRequest.mock.calls.filter(([route]) =>
					(route as string).startsWith("GET https://"),
				),
			).toHaveLength(0);
		});

		it("only unsubscribes from threads whose latest comment author matches when commentAuthor is provided", async () => {
			mockRequest.mockImplementation((route: string) => {
				if (route === "GET /notifications") {
					return Promise.resolve(notificationsWithComments);
				}

				if (route in commentAuthors) {
					return Promise.resolve({
						data: { user: { login: commentAuthors[route] } },
					});
				}

				return Promise.resolve({});
			});

			const result = await pruneGitHubNotifications({
				filters: {
					commentAuthor: new Set(["codecov[bot]"]),
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
});
