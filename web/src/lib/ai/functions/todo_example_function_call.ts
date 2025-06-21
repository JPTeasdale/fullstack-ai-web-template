import { zodResponsesFunction } from 'openai/helpers/zod.mjs';
import { z } from 'zod';

export const ExampleCreateTodoArgSchema = z.object({
	title: z.string().min(1).describe('The title of the todo item'),
	description: z.string().describe('Description for the todo'),
	priority: z
		.enum(['low', 'medium', 'high'])
		.default('medium')
		.describe('Priority level of the todo'),
	dueDate: z.string().nullable().optional().describe('Due date in ISO format (YYYY-MM-DD)')
});

export const ExampleCreateTodoArgSchemaPartial = ExampleCreateTodoArgSchema.partial();

const NAME_CREATE = 'create_todo' as const;
export const createTodoFunction = zodResponsesFunction({
	name: NAME_CREATE,
	description: 'Create a new todo',
	parameters: ExampleCreateTodoArgSchema
});

export type AiFunctionCallDefinitionExampleCreateTodo = {
	name: typeof NAME_CREATE;
	args: z.infer<typeof ExampleCreateTodoArgSchema>;
	argsPartial: z.infer<typeof ExampleCreateTodoArgSchemaPartial>;
};

export const ExampleUpdateTodoArgSchema = z.object({
	title: z.string().nullable().optional().describe('The title of the todo item'),
	description: z.string().nullable().optional().describe('Optional description for the todo'),
	priority: z
		.enum(['low', 'medium', 'high'])
		.default('medium')
		.describe('Priority level of the todo'),
	dueDate: z.string().nullable().optional().describe('Due date in ISO format (YYYY-MM-DD)')
});

export const ExampleUpdateTodoArgSchemaPartial = ExampleUpdateTodoArgSchema.partial();

const NAME_UPDATE = 'update_todo' as const;
export const updateTodoFunction = zodResponsesFunction({
	name: NAME_UPDATE,
	description: 'Update a new todo',
	parameters: ExampleUpdateTodoArgSchema
});

export type AiFunctionCallDefinitionExampleUpdateTodo = {
	name: typeof NAME_UPDATE;
	args: z.infer<typeof ExampleUpdateTodoArgSchema>;
	argsPartial: z.infer<typeof ExampleUpdateTodoArgSchemaPartial>;
};
