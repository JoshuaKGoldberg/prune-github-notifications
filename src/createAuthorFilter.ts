export type AuthorFilter = (author: string | undefined) => boolean;

/**
 * Creates a filter for an author login, if any matchers are provided.
 * Returns `undefined` when there are none, so callers can skip fetching
 * author data altogether.
 */
export function createAuthorFilter(
	matchers: RegExp[] | undefined,
): AuthorFilter | undefined {
	if (!matchers) {
		return undefined;
	}

	return (author) =>
		author !== undefined && matchers.some((tester) => tester.test(author));
}
