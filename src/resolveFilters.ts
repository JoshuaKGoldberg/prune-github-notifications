import { defaultOptions } from "./options.ts";
import { FilterOptions } from "./types.ts";

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
