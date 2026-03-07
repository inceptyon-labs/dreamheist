// Server-Sent Events manager for broadcasting session updates

import { SSEEvent } from '../types';

type SSEClient = {
  id: string;
  controller: ReadableStreamDefaultController;
};

// In-memory map of sessionId -> connected clients
const clients = new Map<string, SSEClient[]>();

export function addClient(sessionId: string, id: string, controller: ReadableStreamDefaultController) {
  if (!clients.has(sessionId)) {
    clients.set(sessionId, []);
  }
  clients.get(sessionId)!.push({ id, controller });
}

export function removeClient(sessionId: string, id: string) {
  const list = clients.get(sessionId);
  if (list) {
    const idx = list.findIndex(c => c.id === id);
    if (idx >= 0) list.splice(idx, 1);
    if (list.length === 0) clients.delete(sessionId);
  }
}

export function broadcast(sessionId: string, event: SSEEvent) {
  const list = clients.get(sessionId);
  if (!list) return;

  const message = `event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`;
  const encoder = new TextEncoder();
  const encoded = encoder.encode(message);

  for (const client of [...list]) {
    try {
      client.controller.enqueue(encoded);
    } catch {
      // Client disconnected, remove
      removeClient(sessionId, client.id);
    }
  }
}

export function getClientCount(sessionId: string): number {
  return clients.get(sessionId)?.length ?? 0;
}
