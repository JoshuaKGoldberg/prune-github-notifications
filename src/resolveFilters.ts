import { defaultOptions } from "./options.js";
import { FilterOptions } from "./types.js";

export function resolveFilters(
	filters?: Partial<FilterOptions>,
): FilterOptions {
	return {
		createdBy: filters?.createdBy,
		label: filters?.label,
		lastCommentBy: filters?.lastCommentBy,
		reason: filters?.reason ?? defaultOptions.filters.reason,
		title: filters?.title ?? defaultOptions.filters.title,
	};
}
