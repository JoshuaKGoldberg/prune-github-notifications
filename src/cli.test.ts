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
	it("passes parsed arguments to pruneGitHubNotifications when they're valid and watch mode is not enabled", async () => {
		await pruneGitHubNotificationsCLI([
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
			bandwidth: 123,
			filters: {
				reason: new Set(["abc", "def"]),
				title: [/abc.+def/],
			},
		});
		expect(mockRunInWatch).not.toHaveBeenCalled();
	});

	it("passes parsed arguments to runInWatch when they're valid and watch mode is enabled", async () => {
		await pruneGitHubNotificationsCLI([
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
			bandwidth: 123,
			filters: {
				reason: new Set(["abc", "def"]),
				title: [/abc.+def/],
			},
		});
		expect(mockRunInWatch).toHaveBeenCalledWith(expect.any(Function), 10);
	});
});
