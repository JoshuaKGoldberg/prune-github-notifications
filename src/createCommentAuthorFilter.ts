import { FilterOptions } from "./types.js";

export type CommentAuthorFilter = (author: string | undefined) => boolean;

/**
 * Creates a filter for a thread's latest comment author, if any is needed.
 * Returns `undefined` when no comment author filters are set, so callers can
 * skip fetching comment data altogether.
 */
export function createCommentAuthorFilter({
	botComments,
	commentAuthor,
}: FilterOptions): CommentAuthorFilter | undefined {
	if (!botComments && !commentAuthor) {
		return undefined;
	}

	return (author) =>
		author !== undefined &&
		(!!commentAuthor?.has(author) ||
			(!!botComments && author.endsWith("[bot]")));
}
