import { parseArgs } from "node:util";
import * as z from "zod";

import { pruneGitHubNotifications } from "./pruneGitHubNotifications.js";
import { runInWatch } from "./runInWatch.js";

function printHelp() {
	console.log(`
prune-github-notifications

Prunes GitHub notifications you don't care about, such as automated dependency bumps. 🧹

Options:
  --auth       GitHub auth token (default: process.env.GH_TOKEN)
  --bandwidth  Maximum parallel requests (default: 6)
  --reason     Notification reason(s) to filter (default: "subscribed")
  --title      Title regex pattern(s) to filter (default: dependency updates)
  --watch      Seconds interval to continuously run (default: 0)
  --help       Show this help message

Examples:
  npx prune-github-notifications
  npx prune-github-notifications --reason subscribed --title "^chore.+ update .+ to"
  npx prune-github-notifications --watch 10
`);
}

const schema = z.object({
	bandwidth: z.coerce.number().optional(),
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
		printHelp();
		return;
	}

	const { bandwidth, reason, title, watch } = schema.parse(values);

	const action = async () =>
		await pruneGitHubNotifications({
			bandwidth,
			filters: {
				reason,
				title,
			},
		});

	await (watch ? runInWatch(action, watch) : action());
}
