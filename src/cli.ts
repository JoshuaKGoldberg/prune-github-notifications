import { createCli } from "parse-standard-args";
import * as z from "zod";

import { formatFilters } from "./formatFilters.js";
import { defaultOptions } from "./options.js";
import { pruneGitHubNotifications } from "./pruneGitHubNotifications.js";
import { resolveFilters } from "./resolveFilters.js";
import { runInWatch } from "./runInWatch.js";

function regexes() {
	return z.array(z.string()).transform((values, context) => {
		const results: RegExp[] = [];

		for (const value of values) {
			try {
				results.push(new RegExp(value));
			} catch (error) {
				context.addIssue({
					code: "custom",
					input: value,
					message: (error as Error).message,
				});
			}
		}

		return results;
	});
}

const cli = createCli({
	description:
		"Prunes GitHub notifications you don't care about, such as automated dependency bumps. 🧹",
	examples: [
		"npx prune-github-notifications",
		'npx prune-github-notifications --reason subscribed --title "^chore.+ update .+ to"',
		'npx prune-github-notifications --reason any --createdBy "^renovate\\[bot\\]$"',
		'npx prune-github-notifications --reason any --title ".*" --label "^dependencies$"',
		'npx prune-github-notifications --reason author --title ".*" --lastCommentBy "\\[bot\\]$"',
		"npx prune-github-notifications --watch 10",
	],
	name: "prune-github-notifications",
	options: z.object({
		auth: z.string().optional().describe("GitHub auth token").meta({
			defaultDescription: "process.env.GH_TOKEN or 'gh auth token'",
			placeholder: "token",
		}),
		bandwidth: z
			.number()
			.optional()
			.describe("Maximum parallel requests to start at once")
			.meta({
				defaultDescription: String(defaultOptions.bandwidth),
				placeholder: "count",
			}),
		createdBy: regexes()
			.optional()
			.describe("Thread author regular expression(s) to additionally filter to")
			.meta({ placeholder: "regex" }),
		label: regexes()
			.optional()
			.describe(
				"Issue or PR label regular expression(s) to additionally filter to",
			)
			.meta({ placeholder: "regex" }),
		lastCommentBy: regexes()
			.optional()
			.describe(
				"Latest comment author regular expression(s) to additionally filter to",
			)
			.meta({ placeholder: "regex" }),
		reason: z
			.array(z.string())
			.optional()
			.transform((value) => value && new Set(value))
			.describe(
				"Notification reason(s) to filter to, or 'any' to match all reasons",
			)
			.meta({
				defaultDescription: '"subscribed"',
				placeholder: "reason",
			}),
		title: regexes()
			.optional()
			.describe("Notification title regular expression(s) to filter to")
			.meta({
				defaultDescription: "dependency updates",
				placeholder: "regex",
			}),
		watch: z
			.number()
			.optional()
			.describe("Seconds interval to continuously re-run on, if truthy")
			.meta({ defaultDescription: "0", placeholder: "seconds" }),
	}),
});

export async function pruneGitHubNotificationsCLI(args: string[]) {
	const parsed = await cli.run(args);
	if (!parsed) {
		return;
	}

	const {
		auth,
		bandwidth,
		createdBy,
		label,
		lastCommentBy,
		reason,
		title,
		watch,
	} = parsed.values;
	const filters = resolveFilters({
		createdBy,
		label,
		lastCommentBy,
		reason,
		title,
	});

	const action = async () =>
		await pruneGitHubNotifications({ auth, bandwidth, filters });

	if (watch) {
		await runInWatch(action, watch, filters);
		return;
	}

	const { threads } = await action();

	if (!threads.length) {
		console.log(
			`No notifications matched the filters:\n${formatFilters(filters)}`,
		);
	}
}
