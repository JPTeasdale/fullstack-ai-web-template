import type { ResponseOutputItem } from 'openai/resources/responses/responses';

export function applyOutputItemFormat(item: ResponseOutputItem, formattedType?: string) {
	if (!formattedType) {
		return item;
	}

	if (item.type === 'message') {
		for (const content of item.content) {
			if (content.type === 'output_text') {
				content.formattedType = formattedType;
			}
		}
	}
	return item;
}
