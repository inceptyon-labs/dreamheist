'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();
  const [creating, setCreating] = useState(false);

  async function createSession() {
    setCreating(true);
    try {
      const res = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create' }),
      });
      const session = await res.json();
      router.push(`/backdoor/control/${session.id}`);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-6">
      <h1 className="text-5xl font-bold mb-4 tracking-tight">Dream Heist</h1>
      <p className="text-xl text-gray-400 mb-12 max-w-md text-center">
        An interactive Inception-themed demo that transforms audience votes into a buildable product concept.
      </p>
      <button
        onClick={createSession}
        disabled={creating}
        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl text-lg font-medium transition-colors disabled:opacity-50"
      >
        {creating ? 'Creating...' : 'Create New Session'}
      </button>
    </div>
  );
}
