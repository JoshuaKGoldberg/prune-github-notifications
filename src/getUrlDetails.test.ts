import { describe, expect, it, vi } from "vitest";

import { getUrlDetails } from "./getUrlDetails.js";

const mockRequest = vi.fn();

const octokit = { request: mockRequest } as unknown as Parameters<
	typeof getUrlDetails
>[0];

describe("getUrlDetails", () => {
	it("returns undefined without requesting when the url is null", async () => {
		const actual = await getUrlDetails(octokit, null);

		expect(actual).toBeUndefined();
		expect(mockRequest).not.toHaveBeenCalled();
	});

	it("returns the response data when the url resolves to a comment with a user", async () => {
		mockRequest.mockResolvedValueOnce({ data: { user: { login: "someone" } } });

		const actual = await getUrlDetails(
			octokit,
			"https://api.github.com/repos/a/b/issues/comments/1",
		);

		expect(actual).toEqual({ user: { login: "someone" } });
		expect(mockRequest).toHaveBeenCalledWith(
			"GET https://api.github.com/repos/a/b/issues/comments/1",
			{ headers: { "X-GitHub-Api-Version": "2022-11-28" } },
		);
	});

	it("returns the response data when the url resolves to an issue with labels and a user", async () => {
		mockRequest.mockResolvedValueOnce({
			data: { labels: [{ name: "dependencies" }], user: { login: "someone" } },
		});

		const actual = await getUrlDetails(
			octokit,
			"https://api.github.com/repos/a/b/issues/1",
		);

		expect(actual).toEqual({
			labels: [{ name: "dependencies" }],
			user: { login: "someone" },
		});
	});
});
