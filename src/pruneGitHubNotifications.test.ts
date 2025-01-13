import { describe, expect, it, vi } from "vitest";

import { pruneGitHubNotifications } from "./pruneGitHubNotifications.js";

const mockRequest = vi.fn().mockResolvedValue({
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
});

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

	it("filters out notifications from ignored authors", async () => {
		mockRequest
			.mockResolvedValueOnce({
				data: [
					{
						id: "12",
						latest_comment_url: "https://api.github.com/repos/test/comment/1",
						reason: "author",
						subject: { title: "Test PR" },
					},
				],
			})
			.mockResolvedValueOnce({
				data: {
					user: {
						login: "ignored-user",
					},
				},
			});

		const result = await pruneGitHubNotifications({
			filters: {
				author: new Set(["ignored-user"]),
				reason: new Set(["author"]),
				title: [/.*/],
			},
		});

		expect(result.threads).toEqual([]);
	});

	it("logs a message when no notifications match the filters", async () => {
		vi.spyOn(console, "log").mockImplementation(() => {
			// Noop
		});

		mockRequest.mockResolvedValueOnce({
			data: [
				{
					id: "90",
					reason: "different",
					subject: {
						title: "unmatched title",
					},
				},
			],
		});

		const result = await pruneGitHubNotifications({ logFilterWhenEmpty: true });

		expect(result.threads).toEqual([]);
		expect(console.log).toHaveBeenCalled();
	});
});
