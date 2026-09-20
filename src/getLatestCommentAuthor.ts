import { octokitFromAuth } from "octokit-from-auth";

type Octokit = Awaited<ReturnType<typeof octokitFromAuth>>;

/**
 * Resolves a notification's latest_comment_url to the comment author's login.
 * The URL may point to an issue, pull request, or comment, all of which
 * report their author under `user`.
 */
export async function getLatestCommentAuthor(
	octokit: Octokit,
	url: null | string | undefined,
): Promise<string | undefined> {
	if (!url) {
		return undefined;
	}

	const response = (await octokit.request(`GET ${url}`, {
		headers: {
			"X-GitHub-Api-Version": "2022-11-28",
		},
	})) as { data: { user?: null | { login: string } } };

	return response.data.user?.login;
}
