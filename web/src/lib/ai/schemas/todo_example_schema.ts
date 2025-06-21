import { zodTextFormat } from 'openai/helpers/zod.mjs';
import { z } from 'zod';

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

export const TodoExampleSchemaPartial = TodoExampleSchema.partial();

export const formatTodoList = zodTextFormat(TodoExampleSchema, 'todo_list');

export type TodoExampleList = z.infer<typeof TodoExampleSchema>;
export type TodoExampleListPartial = z.infer<typeof TodoExampleSchemaPartial>;
