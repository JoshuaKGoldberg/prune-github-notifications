import { FilterOptions } from "./types.js";

export type LastCommentByFilter = (author: string | undefined) => boolean;

/**
 * Creates a filter for a thread's latest comment author, if any is needed.
 * Returns `undefined` when no comment author filters are set, so callers can
 * skip fetching comment data altogether.
 */
export function createLastCommentByFilter({
	lastCommentBy,
}: FilterOptions): LastCommentByFilter | undefined {
	if (!lastCommentBy) {
		return undefined;
	}

	return (author) =>
		author !== undefined && lastCommentBy.some((tester) => tester.test(author));
}
