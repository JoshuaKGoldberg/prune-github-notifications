import { FilterOptions } from "./types.js";

export function formatFilters({
	createdBy,
	lastCommentBy,
	reason,
	title,
}: FilterOptions) {
	return [
		createdBy && `  createdBy: ${createdBy.map(String).join(", ")}`,
		lastCommentBy && `  lastCommentBy: ${lastCommentBy.map(String).join(", ")}`,
		`  reason: ${[...reason].join(", ")}`,
		`  title: ${title.map(String).join(", ")}`,
	]
		.filter(Boolean)
		.join("\n");
}
