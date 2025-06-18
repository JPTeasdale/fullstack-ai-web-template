import { errorStr } from '$lib/utils/error';
import type { ResponseFunctionToolCall } from 'openai/resources/responses/responses';
import type { AiFunctionCallDefinitions, FunctionCallMap, FunctionName } from '../../types';

export function isServerFunction<T extends AiFunctionCallDefinitions>(
	str: string,
	functionCallMap: FunctionCallMap<T>
): str is FunctionName<T> {
	return str in functionCallMap;
}

export async function processServerFunctionCall<T extends AiFunctionCallDefinitions>(
	item: ResponseFunctionToolCall,
	functionCallMap: FunctionCallMap<T>
): Promise<void> {
	// Call server funcitons if applicable
	const functionName = item.name;
	const callOnServer = isServerFunction(functionName, functionCallMap);
	item.meta = {
		call_from_server: callOnServer
	};

	if (callOnServer) {
		const functionCall = functionCallMap[functionName];
		try {
			const res = await functionCall(JSON.parse(item.arguments));
			item.meta.result = res ?? 'success';
		} catch (e) {
			item.meta.result = 'error';
			item.meta.error = errorStr(e);
		}
	}
}
