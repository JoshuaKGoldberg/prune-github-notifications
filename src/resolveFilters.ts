import { defaultOptions } from "./options.js";
import { FilterOptions } from "./types.js";

export function resolveFilters(
	filters?: Partial<FilterOptions>,
): FilterOptions {
	return {
		botComments: filters?.botComments,
		commentAuthor: filters?.commentAuthor,
		reason: filters?.reason ?? defaultOptions.filters.reason,
		title: filters?.title ?? defaultOptions.filters.title,
	};
}
