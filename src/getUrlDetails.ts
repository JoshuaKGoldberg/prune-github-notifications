import { octokitFromAuth } from "octokit-from-auth";

type Octokit = Awaited<ReturnType<typeof octokitFromAuth>>;

/**
 * Details of a notification's URL that filters may check.
 * The URL may point to an issue, pull request, or comment: all of them
 * report their author under `user`, and issues and pull requests also
 * report their `labels`.
 */
export interface UrlDetails {
	labels?: { name: string }[];
	user?: null | { login: string };
}

export type UrlDetailsFilter = (details: undefined | UrlDetails) => boolean;

/**
 * Resolves a notification's URL to its details, if there is a URL.
 */
export async function getUrlDetails(
	octokit: Octokit,
	url: null | string | undefined,
): Promise<undefined | UrlDetails> {
	if (!url) {
		return undefined;
	}

	const response = (await octokit.request(`GET ${url}`, {
		headers: {
			"X-GitHub-Api-Version": "2022-11-28",
		},
	})) as { data: UrlDetails };

	return response.data;
}
