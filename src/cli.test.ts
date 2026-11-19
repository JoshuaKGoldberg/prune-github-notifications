import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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
		vi.spyOn(console, "error").mockImplementation(() => undefined);
		vi.spyOn(console, "log").mockImplementation(() => undefined);
	});

	afterEach(() => {
		process.exitCode = undefined;
	});

	it("logs help text without running when --help is provided", async () => {
		await pruneGitHubNotificationsCLI(["--help"]);

		expect(vi.mocked(console.log).mock.calls).toMatchInlineSnapshot(`
			[
			  [
			    "Usage: prune-github-notifications [options]

			Prunes GitHub notifications you don't care about, such as automated dependency bumps. 🧹

			Options:
			      --auth <token>           GitHub auth token (default: process.env.GH_TOKEN or 'gh auth token')
			      --bandwidth <count>      Maximum parallel requests to start at once (default: 6)
			      --createdBy <regex>      Thread author regular expression(s) to additionally filter to (repeatable)
			      --label <regex>          Issue or PR label regular expression(s) to additionally filter to (repeatable)
			      --lastCommentBy <regex>  Latest comment author regular expression(s) to additionally filter to (repeatable)
			      --reason <reason>        Notification reason(s) to filter to, or 'any' to match all reasons (default: "subscribed", repeatable)
			      --title <regex>          Notification title regular expression(s) to filter to (default: dependency updates, repeatable)
			      --watch <seconds>        Seconds interval to continuously re-run on, if truthy (default: 0)
			  -h, --help                   Show this help message

			Examples:
			  npx prune-github-notifications
			  npx prune-github-notifications --reason subscribed --title "^chore.+ update .+ to"
			  npx prune-github-notifications --reason any --createdBy "^renovate\\[bot\\]$"
			  npx prune-github-notifications --reason any --title ".*" --label "^dependencies$"
			  npx prune-github-notifications --reason author --title ".*" --lastCommentBy "\\[bot\\]$"
			  npx prune-github-notifications --watch 10",
			  ],
			]
		`);
		expect(mockPruneGitHubNotifications).not.toHaveBeenCalled();
		expect(mockRunInWatch).not.toHaveBeenCalled();
		expect(process.exitCode).toBeUndefined();
	});

	it("logs help text without running when -h is provided", async () => {
		await pruneGitHubNotificationsCLI(["-h"]);

		expect(console.log).toHaveBeenCalledWith(
			expect.stringContaining("--watch <seconds>"),
		);
		expect(mockPruneGitHubNotifications).not.toHaveBeenCalled();
	});

	it.each([
		[
			"an invalid number",
			["--bandwidth", "abc"],
			`--bandwidth: Expected a number, received "abc".`,
		],
		["a missing value", ["--watch"], "--watch requires a value."],
		[
			"an invalid createdBy regular expression",
			["--createdBy", "("],
			"--createdBy: Invalid regular expression: /(/: Unterminated group",
		],
		[
			"an invalid label regular expression",
			["--label", "ok", "--label", ")"],
			"--label: Invalid regular expression: /)/: Unmatched ')'",
		],
		[
			"an invalid lastCommentBy regular expression",
			["--lastCommentBy", "a{2,1}"],
			"--lastCommentBy: Invalid regular expression: /a{2,1}/: numbers out of order in {} quantifier",
		],
		[
			"an invalid title regular expression",
			["--title", "["],
			"--title: Invalid regular expression: /[/: Unterminated character class",
		],
		[
			"an unknown flag",
			["--labels", "abc"],
			"Unknown flag: --labels (did you mean --label?)",
		],
		["a positional argument", ["abc"], "Unexpected argument: abc"],
	])(
		"logs a friendly error without running when given %s",
		async (_, args, expected) => {
			await expect(pruneGitHubNotificationsCLI(args)).resolves.toBeUndefined();

			expect(console.error).toHaveBeenCalledWith(
				`${expected}\nRun 'prune-github-notifications --help' for usage.`,
			);
			expect(process.exitCode).toBe(1);
			expect(mockPruneGitHubNotifications).not.toHaveBeenCalled();
			expect(mockRunInWatch).not.toHaveBeenCalled();
		},
	);

	it("logs every issue on its own line without a stack trace when given multiple invalid args", async () => {
		await pruneGitHubNotificationsCLI([
			"--bandwidth",
			"abc",
			"--title",
			"[",
			"--watch=",
			"--nope",
		]);

		const output = vi.mocked(console.error).mock.calls.join("\n");

		expect(output).not.toMatch(/^\s+at /m);
		expect(output).toMatchInlineSnapshot(`
			"--bandwidth: Expected a number, received "abc".
			--watch: Expected a number, received "".
			Unknown flag: --nope
			--title: Invalid regular expression: /[/: Unterminated character class
			Run 'prune-github-notifications --help' for usage."
		`);
		expect(process.exitCode).toBe(1);
	});

	it("passes every flag to pruneGitHubNotifications and runInWatch when all are provided", async () => {
		await pruneGitHubNotificationsCLI([
			"--auth",
			"abc123",
			"--bandwidth",
			"2.5",
			"--createdBy",
			"^renovate",
			"--label",
			"^dependencies$",
			"--lastCommentBy",
			"\\[bot\\]$",
			"--reason",
			"any",
			"--title",
			".*",
			"--watch=30",
		]);

		const filters = {
			createdBy: [/^renovate/],
			label: [/^dependencies$/],
			lastCommentBy: [/\[bot\]$/],
			reason: new Set(["any"]),
			title: [/.*/],
		};

		expect(mockPruneGitHubNotifications).toHaveBeenCalledWith({
			auth: "abc123",
			bandwidth: 2.5,
			filters,
		});
		expect(mockRunInWatch).toHaveBeenCalledWith(
			expect.any(Function),
			30,
			filters,
		);
	});

	it("does not enter watch mode when --watch is 0", async () => {
		await pruneGitHubNotificationsCLI(["--watch", "0"]);

		expect(mockPruneGitHubNotifications).toHaveBeenCalledWith({
			auth: undefined,
			bandwidth: undefined,
			filters: defaultOptions.filters,
		});
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
			auth: undefined,
			bandwidth: 123,
			filters: {
				reason: new Set(["abc", "def"]),
				title: [/abc.+def/],
			},
		});
		expect(mockRunInWatch).not.toHaveBeenCalled();
	});

	it("passes auth to pruneGitHubNotifications when provided", async () => {
		await pruneGitHubNotificationsCLI(["--auth", "abc123"]);

		expect(mockPruneGitHubNotifications).toHaveBeenCalledWith({
			auth: "abc123",
			bandwidth: undefined,
			filters: defaultOptions.filters,
		});
	});

	it("passes default filters to pruneGitHubNotifications when none are provided", async () => {
		await pruneGitHubNotificationsCLI([]);

		expect(mockPruneGitHubNotifications).toHaveBeenCalledWith({
			auth: undefined,
			bandwidth: undefined,
			filters: defaultOptions.filters,
		});
	});

	it("passes createdBy to pruneGitHubNotifications when provided", async () => {
		await pruneGitHubNotificationsCLI([
			"--createdBy",
			"^renovate",
			"--createdBy",
			"\\[bot\\]$",
		]);

		expect(mockPruneGitHubNotifications).toHaveBeenCalledWith({
			auth: undefined,
			bandwidth: undefined,
			filters: {
				...defaultOptions.filters,
				createdBy: [/^renovate/, /\[bot\]$/],
			},
		});
	});

	it("passes label to pruneGitHubNotifications when provided", async () => {
		await pruneGitHubNotificationsCLI([
			"--label",
			"^bot$",
			"--label",
			"dependencies",
		]);

		expect(mockPruneGitHubNotifications).toHaveBeenCalledWith({
			bandwidth: undefined,
			filters: {
				...defaultOptions.filters,
				label: [/^bot$/, /dependencies/],
			},
		});
	});

	it("passes lastCommentBy to pruneGitHubNotifications when provided", async () => {
		await pruneGitHubNotificationsCLI([
			"--lastCommentBy",
			"^codecov",
			"--lastCommentBy",
			"\\[bot\\]$",
		]);

		expect(mockPruneGitHubNotifications).toHaveBeenCalledWith({
			auth: undefined,
			bandwidth: undefined,
			filters: {
				...defaultOptions.filters,
				lastCommentBy: [/^codecov/, /\[bot\]$/],
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
			  title: /^(?:build|chore)\\(deps\\): (?:(?:bump|update) .+ to|lock file maintenance)/, /^Bump .+ from .+ to .+/",
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
			auth: undefined,
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
