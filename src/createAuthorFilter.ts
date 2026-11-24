import { UrlDetailsFilter } from "./getUrlDetails.ts";

/**
 * Creates a filter for a URL's author login, if any matchers are provided.
 * Returns `undefined` when there are none, so callers can skip fetching
 * URL details altogether.
 */
export function createAuthorFilter(
	matchers: RegExp[] | undefined,
): undefined | UrlDetailsFilter {
	if (!matchers) {
		return undefined;
	}

	return (details) => {
		const author = details?.user?.login;

		return (
			author !== undefined && matchers.some((tester) => tester.test(author))
		);
	};
}
