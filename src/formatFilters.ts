import { FilterOptions } from "./types.js";

export function formatFilters({
	createdBy,
	label,
	lastCommentBy,
	reason,
	title,
}: FilterOptions) {
	return [
		createdBy && `  createdBy: ${createdBy.map(String).join(", ")}`,
		label && `  label: ${label.map(String).join(", ")}`,
		lastCommentBy && `  lastCommentBy: ${lastCommentBy.map(String).join(", ")}`,
		`  reason: ${[...reason].join(", ")}`,
		`  title: ${title.map(String).join(", ")}`,
	]
		.filter(Boolean)
		.join("\n");
}
