import { describe, expect, it, vi } from "vitest";

import { getAuthorLogin } from "./getAuthorLogin.js";

const mockRequest = vi.fn();

const octokit = { request: mockRequest } as unknown as Parameters<
	typeof getAuthorLogin
>[0];

describe("getAuthorLogin", () => {
	it("returns undefined without requesting when the url is null", async () => {
		const actual = await getAuthorLogin(octokit, null);

		expect(actual).toBeUndefined();
		expect(mockRequest).not.toHaveBeenCalled();
	});

	it("returns the user login when the url resolves to a comment with a user", async () => {
		mockRequest.mockResolvedValueOnce({ data: { user: { login: "someone" } } });

		const actual = await getAuthorLogin(
			octokit,
			"https://api.github.com/repos/a/b/issues/comments/1",
		);

		expect(actual).toBe("someone");
		expect(mockRequest).toHaveBeenCalledWith(
			"GET https://api.github.com/repos/a/b/issues/comments/1",
			{ headers: { "X-GitHub-Api-Version": "2022-11-28" } },
		);
	});

	it("returns undefined when the url resolves to data without a user", async () => {
		mockRequest.mockResolvedValueOnce({ data: { user: null } });

		const actual = await getAuthorLogin(
			octokit,
			"https://api.github.com/repos/a/b/issues/1",
		);

		expect(actual).toBeUndefined();
	});
});
