import { UrlDetailsFilter } from "./getUrlDetails.js";

/**
 * Creates a filter for a URL's label names, if any matchers are provided.
 * Returns `undefined` when there are none, so callers can skip fetching
 * URL details altogether.
 */
export function createLabelFilter(
	matchers: RegExp[] | undefined,
): undefined | UrlDetailsFilter {
	if (!matchers) {
		return undefined;
	}

	return (details) =>
		!!details?.labels?.some((label) =>
			matchers.some((tester) => tester.test(label.name)),
		);
}
