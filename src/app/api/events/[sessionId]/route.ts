import { NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { addClient, removeClient } from '@/lib/realtime/sse';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  const clientId = uuidv4();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial keepalive
      const encoder = new TextEncoder();
      controller.enqueue(encoder.encode(`event: connected\ndata: ${JSON.stringify({ clientId })}\n\n`));

      addClient(sessionId, clientId, controller);

      // Keepalive every 30 seconds
      const keepalive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: keepalive\n\n`));
        } catch {
          clearInterval(keepalive);
        }
      }, 30000);

      // Cleanup on close
      req.signal.addEventListener('abort', () => {
        clearInterval(keepalive);
        removeClient(sessionId, clientId);
        try { controller.close(); } catch { /* already closed */ }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
