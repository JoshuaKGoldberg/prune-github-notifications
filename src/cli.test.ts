import { describe, expect, it, vi } from "vitest";

import { pruneGitHubNotificationsCLI } from "./cli.js";

const mockPruneGitHubNotifications = vi.fn();

vi.mock("./pruneGitHubNotifications.js", () => ({
	get pruneGitHubNotifications() {
		return mockPruneGitHubNotifications;
	},
}));

const mockRunInWatch = vi.fn((action: () => void) => {
	action();
});

vi.mock("./runInWatch.js", () => ({
	get runInWatch() {
		return mockRunInWatch;
	},
}));

describe("pruneGitHubNotificationsCLI", () => {
	it("throws an error when auth is not available", async () => {
		await expect(async () => {
			await pruneGitHubNotificationsCLI([]);
		}).rejects.toMatchInlineSnapshot(`
			[ZodError: [
			  {
			    "code": "invalid_type",
			    "expected": "string",
			    "received": "undefined",
			    "path": [
			      "auth"
			    ],
			    "message": "--auth is required if a GH_TOKEN environment variable is not specified."
			  }
			]]
		`);
	});

	it("passes parsed arguments to pruneGitHubNotifications when they're valid and watch mode is not enabled", async () => {
		await pruneGitHubNotificationsCLI([
			"--auth",
			"abc_def",
			"--bandwidth",
			"123",
			"--reason",
			"abc",
			"--reason",
			"def",
			"--title",
			"abc.+def",
		]);

		expect(mockPruneGitHubNotifications).toHaveBeenCalledWith({
			auth: "abc_def",
			bandwidth: 123,
			filters: {
				reason: new Set(["abc", "def"]),
				title: /abc.+def/,
			},
		});
		expect(mockRunInWatch).not.toHaveBeenCalled();
	});

	it("passes parsed arguments to runInWatch when they're valid and watch mode is enabled", async () => {
		await pruneGitHubNotificationsCLI([
			"--auth",
			"abc_def",
			"--bandwidth",
			"123",
			"--reason",
			"abc",
			"--reason",
			"def",
			"--title",
			"abc.+def",
			"--watch",
			"10",
		]);

		expect(mockPruneGitHubNotifications).toHaveBeenCalledWith({
			auth: "abc_def",
			bandwidth: 123,
			filters: {
				reason: new Set(["abc", "def"]),
				title: /abc.+def/,
			},
		});
		expect(mockRunInWatch).toHaveBeenCalledWith(expect.any(Function), 10);
	});
});
