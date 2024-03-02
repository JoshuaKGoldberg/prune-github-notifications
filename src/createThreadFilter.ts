import { FilterOptions } from "./types.js";

export interface FilterableThreadSubject {
	title: string;
}

export interface FilterableThread {
	reason: string;
	subject: FilterableThreadSubject;
}

export function createThreadFilter({ reason, title }: FilterOptions) {
	return (thread: FilterableThread) =>
		reason.has(thread.reason) && title.test(thread.subject.title);
}
