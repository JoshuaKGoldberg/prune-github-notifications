import { FilterOptions } from "./types.js";

export function formatFilters({ lastCommentBy, reason, title }: FilterOptions) {
	return [
		lastCommentBy && `  lastCommentBy: ${lastCommentBy.map(String).join(", ")}`,
		`  reason: ${[...reason].join(", ")}`,
		`  title: ${title.map(String).join(", ")}`,
	]
		.filter(Boolean)
		.join("\n");
}
