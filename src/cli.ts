import { parseArgs } from "node:util";
import * as z from "zod";

import { formatFilters } from "./formatFilters.js";
import { pruneGitHubNotifications } from "./pruneGitHubNotifications.js";
import { resolveFilters } from "./resolveFilters.js";
import { runInWatch } from "./runInWatch.js";

const helpText = `
prune-github-notifications

Prunes GitHub notifications you don't care about, such as automated dependency bumps. 🧹

Options:
  --auth           GitHub auth token (default: process.env.GH_TOKEN or 'gh auth token')
  --bandwidth      Maximum parallel requests to start at once (default: 6)
  --botComments    Additionally filter to threads whose latest comment is from a [bot] account
  --commentAuthor  Latest comment author username(s) to additionally filter to
  --reason         Notification reason(s) to filter to (default: "subscribed")
  --title          Notification title regular expression(s) to filter to (default: dependency updates)
  --watch          Seconds interval to continuously re-run on, if truthy (default: 0)
  --help           Show this help message

Examples:
  npx prune-github-notifications
  npx prune-github-notifications --reason subscribed --title "^chore.+ update .+ to"
  npx prune-github-notifications --watch 10
`;

const schema = z.object({
	bandwidth: z.coerce.number().optional(),
	botComments: z.boolean().optional(),
	commentAuthor: z
		.array(z.string())
		.optional()
		.transform((value) => value && new Set(value)),
	reason: z
		.array(z.string())
		.optional()
		.transform((value) => value && new Set(value)),
	title: z
		.array(z.string())
		.transform((values) => values.map((value) => new RegExp(value)))
		.optional(),
	watch: z.coerce.number().optional(),
});

export async function pruneGitHubNotificationsCLI(args: string[]) {
	const { values } = parseArgs({
		args,
		options: {
			auth: {
				default: process.env.GH_TOKEN,
				type: "string",
			},
			bandwidth: {
				type: "string",
			},
			botComments: {
				type: "boolean",
			},
			commentAuthor: {
				multiple: true,
				type: "string",
			},
			help: {
				type: "boolean",
			},
			reason: {
				multiple: true,
				type: "string",
			},
			title: {
				multiple: true,
				type: "string",
			},
			watch: {
				type: "string",
			},
		},
		tokens: true,
	});

	if (values.help) {
		console.log(helpText);
		return;
	}

	const { bandwidth, botComments, commentAuthor, reason, title, watch } =
		schema.parse(values);
	const filters = resolveFilters({ botComments, commentAuthor, reason, title });

	const action = async () =>
		await pruneGitHubNotifications({ bandwidth, filters });

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
