async function streamToArrayBuffer(stream: ReadableStream<Uint8Array<ArrayBufferLike>>) {
  const reader = stream.getReader();
  const chunks = [];
  let totalLength = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    totalLength += value.length;
  }

  const arrayBuffer = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    arrayBuffer.set(chunk, offset);
    offset += chunk.length;
  }

  return arrayBuffer.buffer;
}

// This ensure that file upload works  non-Cloudflare environments (like development)
export async function getStreamFromFile(stream: ReadableStream<Uint8Array<ArrayBufferLike>>, length: number) {
  if (typeof FixedLengthStream !== 'undefined') {
    const { readable, writable } = new FixedLengthStream(length);
    
    // Start pumping in the background (don't await)
    const pumpPromise = (async () => {
      const reader = stream.getReader();
      const writer = writable.getWriter();
      
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          await writer.write(value);
        }
        await writer.close();
      } catch (error) {
        await writer.abort(error);
        throw error;
      } finally {
        reader.releaseLock();
      }
    })();
    
    // Handle errors but don't block on them
    pumpPromise.catch(error => {
      console.error('Error pumping stream:', error);
    });
    
    return readable;
  }

  return await streamToArrayBuffer(stream);
}