import { beforeEach, describe, expect, it, vi } from "vitest";

import { pruneGitHubNotificationsCLI } from "./cli.js";
import { defaultOptions } from "./options.js";

const mockPruneGitHubNotifications = vi.fn().mockResolvedValue({ threads: [] });

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
	beforeEach(() => {
		vi.spyOn(console, "log").mockImplementation(() => undefined);
	});

	it("logs help text without running when --help is provided", async () => {
		await pruneGitHubNotificationsCLI(["--help"]);

		expect(console.log).toHaveBeenCalledWith(
			expect.stringContaining("--watch"),
		);
		expect(mockPruneGitHubNotifications).not.toHaveBeenCalled();
		expect(mockRunInWatch).not.toHaveBeenCalled();
	});

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

	it("passes default filters to pruneGitHubNotifications when none are provided", async () => {
		await pruneGitHubNotificationsCLI([]);

		expect(mockPruneGitHubNotifications).toHaveBeenCalledWith({
			bandwidth: undefined,
			filters: defaultOptions.filters,
		});
	});

	it("passes commentAuthor to pruneGitHubNotifications when provided", async () => {
		await pruneGitHubNotificationsCLI(["--commentAuthor", "codecov[bot]"]);

		expect(mockPruneGitHubNotifications).toHaveBeenCalledWith({
			bandwidth: undefined,
			filters: {
				...defaultOptions.filters,
				commentAuthor: new Set(["codecov[bot]"]),
			},
		});
	});

	it("does not log when notifications were pruned and watch mode is not enabled", async () => {
		mockPruneGitHubNotifications.mockResolvedValueOnce({ threads: [123] });

		await pruneGitHubNotificationsCLI([]);

		expect(console.log).not.toHaveBeenCalled();
	});

	it("logs the resolved filters when no notifications matched and watch mode is not enabled", async () => {
		await pruneGitHubNotificationsCLI(["--reason", "abc", "--reason", "def"]);

		expect(vi.mocked(console.log).mock.calls).toMatchInlineSnapshot(`
			[
			  [
			    "No notifications matched the filters:
			  reason: abc, def
			  title: /^(?:build|chore)\\(deps\\): (?:(?:bump|update) .+ to|lock file maintenance)/",
			  ],
			]
		`);
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
		expect(mockRunInWatch).toHaveBeenCalledWith(expect.any(Function), 10, {
			reason: new Set(["abc", "def"]),
			title: [/abc.+def/],
		});
	});
});
