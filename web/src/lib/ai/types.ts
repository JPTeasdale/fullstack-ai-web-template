import type {
	ResponseFunctionToolCallItem,
	ResponseInputMessageItem,
	ResponseOutputItem,
	ResponseOutputText,
	ResponseFileSearchToolCall,
	ResponseFunctionWebSearch
} from 'openai/resources/responses/responses';
import type { Response } from 'openai/resources/responses/responses';
import type { ResponseStreamEvent } from 'openai/resources/responses/responses';
import type { Stream } from 'openai/streaming';
import type {
	AiFunctionCallDefinitionExampleCreateTodo,
	AiFunctionCallDefinitionExampleUpdateTodo
} from './functions/todo_example_function_call';

export type OpenAiResponseStreamEvent = ResponseStreamEvent;
export type OpenAiResponseStream = Stream<OpenAiResponseStreamEvent>;
export type OpenAIResponse = Response;

export type ServerConversationItem = ResponseOutputItem;

export type UserInputMessage = ResponseInputMessageItem;

export type ConversationItem = ServerConversationItem | UserInputMessage;

export type TextAnnotation =
	| ResponseOutputText.FileCitation
	| ResponseOutputText.URLCitation
	| ResponseOutputText.ContainerFileCitation
	| ResponseOutputText.FilePath;

export type ToolCall = ResponseFunctionWebSearch | ResponseFileSearchToolCall;

export type AiToolResult = {
	callId: string;
	result: string;
};

export type AiRequestBody = {
	prompt?: string;
	previousResponseId: string | null;
	fnCallResults?: AiToolResult[];
};

// Function call definitions

export type LocalFunctionCallResult = {
	result?: string;
	requireUserConfirmation?: boolean;
	error?: string;
};

export type HandleFunctionCallFunction<T extends AiFunctionCallDefinitions> = (
	fnCall: AppFunctionCallItem<T>
) => Promise<LocalFunctionCallResult>;

export type AiFunctionCallDefinition<Name extends string, Args extends Record<string, unknown>> = {
	name: Name;
	args: Args;
	argsPartial: Partial<Args>;
};

export type AiFunctionCallDefinitions =
	| AiFunctionCallDefinitionExampleCreateTodo
	| AiFunctionCallDefinitionExampleUpdateTodo;

export type FunctionCallMap<T extends AiFunctionCallDefinitions> = {
	[key in T['name']]: (args: T['args']) => Promise<string>;
};

export type FunctionName<T extends AiFunctionCallDefinitions> = T['name'];

// Use the distributive type to create a proper discriminated union
export type AppFunctionCallItem<T extends AiFunctionCallDefinitions> = T extends any
	? ResponseFunctionToolCallItem & {
			name: T['name'];
			parsedArgs: T['args'] | null;
		}
	: never;
