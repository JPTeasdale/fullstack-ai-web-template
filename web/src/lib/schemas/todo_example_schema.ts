import { zodTextFormat } from 'openai/helpers/zod.mjs';
import { z } from 'zod';
import { zodDeepPartial } from 'zod-deep-partial';

export const TodoExampleSchema = z.object({
	todos: z.array(
		z
			.object({
				title: z.string().describe('A short obvious title for the todo.'),
				date: z.coerce.date().describe('When you should complete the todo by.'),
				description: z.string().describe('A detailed description of the task.')
			})
			.describe('A todo list.')
	)
});

export const formatTodoList = zodTextFormat(TodoExampleSchema, 'todo_list');

export const TodoExampleSchemaPartial = zodDeepPartial(TodoExampleSchema);

export type TodoExampleList = z.infer<typeof TodoExampleSchema>;
export type TodoExampleListPartial = z.infer<typeof TodoExampleSchemaPartial>;
