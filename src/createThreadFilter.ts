import { FilterOptions } from "./types.js";

export interface FilterableThread {
	reason: string;
	subject: FilterableThreadSubject;
}

export interface FilterableThread {
	latest_comment_author?: null | string;
	latest_comment_url?: null | string;
	reason: string;
	subject: FilterableThreadSubject;
}

export interface FilterableThreadSubject {
	title: string;
}

export function createThreadFilter({
	author,
	botAuthors,
	reason,
	title,
}: FilterOptions) {
	return (thread: FilterableThread) => {
		const reasonMatch = reason.has("any") || reason.has(thread.reason);

		const titleMatch = title.some((tester) =>
			tester.test(thread.subject.title),
		);

		const noAuthorFilter = (!author || author.size === 0) && !botAuthors;

		const authorMatch = Boolean(
			thread.latest_comment_author && author?.has(thread.latest_comment_author),
		);

		const botAuthorMatch = Boolean(
			thread.latest_comment_author &&
				botAuthors &&
				thread.latest_comment_author.includes("[bot]"),
		);

		return (
			reasonMatch &&
			titleMatch &&
			(noAuthorFilter || authorMatch || botAuthorMatch)
		);
	};
}
