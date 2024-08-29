import { describe, expect, it, vi } from "vitest";

import { pruneGitHubNotifications } from "./pruneGitHubNotifications.js";

const mockGetGitHubAuthToken = vi.fn();

vi.mock("get-github-auth-token", () => ({
	get getGitHubAuthToken() {
		return mockGetGitHubAuthToken;
	},
}));

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

vi.mock("octokit", () => ({
	Octokit: class MockOctokit {
		request = mockRequest;
	},
}));

describe("pruneGitHubNotifications", () => {
	it("throws an error when auth is not available", async () => {
		mockGetGitHubAuthToken.mockResolvedValue({
			error: "Oh no!",
			succeeded: false,
		});

		await expect(async () => {
			await pruneGitHubNotifications();
		}).rejects.toMatchInlineSnapshot(`[Error: Oh no!]`);
	});

	it("unsubscribes from threads based on default filters when no filters are provided", async () => {
		mockGetGitHubAuthToken.mockResolvedValue({
			succeeded: true,
			token: "abc123",
		});

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
		mockGetGitHubAuthToken.mockResolvedValue({
			succeeded: true,
			token: "abc123",
		});

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
});
