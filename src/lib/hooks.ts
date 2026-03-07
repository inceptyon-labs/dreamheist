'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { SessionSnapshot, SSEEventType } from './types';

export function useSession(sessionId: string) {
  const [snapshot, setSnapshot] = useState<SessionSnapshot | null>(null);
  const [connected, setConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  const fetchSnapshot = useCallback(async () => {
    try {
      const res = await fetch(`/api/session?id=${sessionId}`);
      if (res.ok) {
        const data = await res.json();
        setSnapshot(data);
      }
    } catch (err) {
      console.error('Failed to fetch snapshot:', err);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchSnapshot();

    const es = new EventSource(`/api/events/${sessionId}`);
    eventSourceRef.current = es;

    es.addEventListener('connected', () => {
      setConnected(true);
    });

    const eventTypes: SSEEventType[] = [
      'session_state_changed',
      'question_advanced',
      'vote_cast',
      'voting_locked',
      'winner_revealed',
      'reveal_started',
      'extraction_started',
      'agent_status_changed',
      'artifact_generated',
      'pipeline_complete',
      'error_occurred',
    ];

    for (const eventType of eventTypes) {
      es.addEventListener(eventType, () => {
        // Refetch full snapshot on any event for simplicity and correctness
        fetchSnapshot();
      });
    }

    es.onerror = () => {
      setConnected(false);
      // Auto-reconnect is handled by EventSource
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
    };
  }, [sessionId, fetchSnapshot]);

  return { snapshot, connected, refetch: fetchSnapshot };
}

export function useParticipantId(): string {
  const [id, setId] = useState('');

  useEffect(() => {
    let stored = localStorage.getItem('dreamheist-participant-id');
    if (!stored) {
      stored = Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem('dreamheist-participant-id', stored);
    }
    setId(stored);
  }, []);

  return id;
}
