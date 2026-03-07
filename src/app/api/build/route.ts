import { NextRequest, NextResponse } from 'next/server';
import { getArtifacts, getAgentRuns, getSession } from '@/lib/storage/db';
import { launchBuild, getBuildStatus, getBuildEvents, getBuildFiles, getFileContent, stopBuild, startPreviewServer, getPreviewServerPort, rerunBuildAgent } from '@/lib/agents/build-manager';

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('sessionId');
  const action = req.nextUrl.searchParams.get('action');

  if (!sessionId) return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });

  switch (action) {
    case 'status': {
      const status = getBuildStatus(sessionId);
      return NextResponse.json({ status });
    }

    case 'events': {
      const since = req.nextUrl.searchParams.get('since');
      const events = getBuildEvents(sessionId, since ? parseInt(since) : undefined);
      return NextResponse.json({ events });
    }

    case 'files': {
      const files = getBuildFiles(sessionId);
      return NextResponse.json({ files });
    }

    case 'file': {
      const filePath = req.nextUrl.searchParams.get('path');
      if (!filePath) return NextResponse.json({ error: 'Missing path' }, { status: 400 });
      const content = getFileContent(sessionId, filePath);
      if (content === null) return NextResponse.json({ error: 'File not found' }, { status: 404 });
      return NextResponse.json({ content, path: filePath });
    }

    case 'preview': {
      const port = getPreviewServerPort(sessionId);
      return NextResponse.json({ port });
    }

    default:
      return NextResponse.json({ error: 'Unknown action. Use: status, events, files, file, preview' }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { sessionId, action, role: agentRoleParam } = body;

  if (!sessionId) return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });

  switch (action) {
    case 'launch': {
      const session = getSession(sessionId);
      if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

      // Get the generated artifacts
      const agents = getAgentRuns(sessionId);
      const artifacts = getArtifacts(sessionId);

      const extractorOutput = agents.find(a => a.role === 'extractor')?.output || '';
      const forgerOutput = agents.find(a => a.role === 'forger')?.output || '';
      const builderOutput = agents.find(a => a.role === 'builder')?.output || '';

      const specToBuild = artifacts.find(a => a.artifactType === 'spec-to-build')?.content || builderOutput;
      const taskList = artifacts.find(a => a.artifactType === 'task-list')?.content || 'See builder output.';
      const masterPrompt = artifacts.find(a => a.artifactType === 'master')?.content || '';

      // Extract product name and tagline from forger output
      let productName = 'Dream Product';
      let tagline = '';
      if (forgerOutput) {
        const allBold = [...forgerOutput.matchAll(/\*\*(.+?)\*\*/g)].map(m => m[1]);
        const skipLabels = ['product name', 'tagline', 'short pitch', 'tone', 'brand direction', 'voice', 'visual tone', 'copy style', 'emotional register'];
        const name = allBold.find(b => !skipLabels.includes(b.toLowerCase()));
        if (name) productName = name;
        const italicMatch = forgerOutput.match(/(?<!\*)\*([^*]+)\*(?!\*)/);
        const quoteMatch = forgerOutput.match(/"(.+?)"/);
        tagline = italicMatch?.[1] || quoteMatch?.[1] || '';
      }

      // Launch build async
      launchBuild(sessionId, {
        specToBuild,
        taskList,
        masterPrompt,
        productName,
        tagline,
      });

      return NextResponse.json({ launched: true, productName, tagline });
    }

    case 'stop': {
      stopBuild(sessionId);
      return NextResponse.json({ stopped: true });
    }

    case 'preview': {
      try {
        const result = await startPreviewServer(sessionId);
        return NextResponse.json({ port: result.port, alreadyRunning: result.alreadyRunning });
      } catch (err) {
        return NextResponse.json({ error: (err as Error).message }, { status: 500 });
      }
    }

    case 'rerun-agent': {
      if (!agentRoleParam) return NextResponse.json({ error: 'Missing role' }, { status: 400 });

      const session = getSession(sessionId);
      if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

      const agents = getAgentRuns(sessionId);
      const artifacts = getArtifacts(sessionId);

      const extractorOutput = agents.find(a => a.role === 'extractor')?.output || '';
      const forgerOutput = agents.find(a => a.role === 'forger')?.output || '';
      const builderOutput = agents.find(a => a.role === 'builder')?.output || '';

      const specToBuild = artifacts.find(a => a.artifactType === 'spec-to-build')?.content || builderOutput;
      const taskList = artifacts.find(a => a.artifactType === 'task-list')?.content || 'See builder output.';
      const masterPrompt = artifacts.find(a => a.artifactType === 'master')?.content || '';

      let productName = 'Dream Product';
      let tagline = '';
      if (forgerOutput) {
        const allBold = [...forgerOutput.matchAll(/\*\*(.+?)\*\*/g)].map(m => m[1]);
        const skipLabels = ['product name', 'tagline', 'short pitch', 'tone', 'brand direction', 'voice', 'visual tone', 'copy style', 'emotional register'];
        const name = allBold.find(b => !skipLabels.includes(b.toLowerCase()));
        if (name) productName = name;
        const italicMatch = forgerOutput.match(/(?<!\*)\*([^*]+)\*(?!\*)/);
        const quoteMatch = forgerOutput.match(/"(.+?)"/);
        tagline = italicMatch?.[1] || quoteMatch?.[1] || '';
      }

      rerunBuildAgent(sessionId, agentRoleParam, {
        specToBuild,
        taskList,
        masterPrompt,
        productName,
        tagline,
      });

      return NextResponse.json({ rerunning: true, role: agentRoleParam });
    }

    default:
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  }
}
