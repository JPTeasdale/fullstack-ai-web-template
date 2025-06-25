import { createEventProcessor, type EventCallbacks } from './create_event_processor';
import { type AiFunctionCallDefinitions } from '../types';
import { parseStream } from './parse_stream';

export async function handleStreamEvents<T extends AiFunctionCallDefinitions>(
	res: Response,
	opts: EventCallbacks<T>
) {
	const processEvent = createEventProcessor<T>(opts);

	return await parseStream(
		res,
		async (event) => {
			return await processEvent(event);
		},
		(error) => {
			opts.onError?.(error);
		}
	);
}
