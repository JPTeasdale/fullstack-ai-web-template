import 'openai/resources/responses/responses';
import type { FunctionCallDefinitions } from './types';

declare module 'openai/resources/responses/responses' {
	interface ResponseFunctionToolCall {
		meta: {
			call_from_server?: boolean;
			result?: any;
			error?: string;
		};
		done?: boolean;
		parsedArguments?: FunctionCallDefinitions['parameters'];
	}

	interface ResponseOutputItem {
		done?: boolean;
	}

	interface ResponseOutputMessage {
		done?: boolean;
	}

	interface OutputTe {
		done?: boolean;
	}

	// Content Parts
	interface ResponseOutputRefusal {
		done?: boolean;
		parts?: string[];
	}

	interface ResponseOutputText {
		done?: boolean;
		parts?: string[];
		formattedType?: string;
	}
}
