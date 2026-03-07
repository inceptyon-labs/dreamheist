import { NextRequest, NextResponse } from 'next/server';
import { getArtifacts, getAgentRuns, getTranslation, getSession } from '@/lib/storage/db';
import fs from 'fs';
import path from 'path';

const AGENT_META: Record<string, { codename: string; title: string }> = {
  extractor: { codename: 'Cobb', title: 'Product Analyst' },
  forger: { codename: 'Eames', title: 'Brand Strategist' },
  architect: { codename: 'Ariadne', title: 'Technical Architect' },
  builder: { codename: 'Yusuf', title: 'Implementation Lead' },
  auditor: { codename: 'Arthur', title: 'Quality Reviewer' },
  shade: { codename: 'Mal', title: 'Test Engineer' },
};

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('sessionId');
  if (!sessionId) return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });

  const artifacts = getArtifacts(sessionId);
  return NextResponse.json({ artifacts });
}

export async function POST(req: NextRequest) {
  const { sessionId, action } = await req.json();

  if (action === 'write-to-disk') {
    const session = getSession(sessionId);
    if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const artifacts = getArtifacts(sessionId);
    const agents = getAgentRuns(sessionId);
    const translation = getTranslation(sessionId);

    const dir = path.join(process.cwd(), 'artifacts', `session-${sessionId}`);
    fs.mkdirSync(dir, { recursive: true });

    const files: string[] = [];

    // Write per-agent files with character name and title header
    for (const agent of agents) {
      if (agent.output) {
        const meta = AGENT_META[agent.role];
        const header = meta
          ? `# ${meta.codename} - ${meta.title}\n\n`
          : `# ${agent.role}\n\n`;
        const filename = meta
          ? `${meta.codename.toLowerCase()}-${agent.role}.md`
          : `${agent.role}.md`;
        const filePath = path.join(dir, filename);
        fs.writeFileSync(filePath, header + agent.output, 'utf-8');
        files.push(filePath);
      }
    }

    // Write system artifacts
    for (const artifact of artifacts) {
      if (artifact.role === 'system') {
        let filename: string;
        if (artifact.artifactType === 'master') filename = 'master.md';
        else if (artifact.artifactType === 'spec-to-build') filename = 'spec-to-build.md';
        else if (artifact.artifactType === 'task-list') filename = 'task-list.md';
        else if (artifact.artifactType === 'summary') filename = 'summary.json';
        else continue;

        const filePath = path.join(dir, filename);
        fs.writeFileSync(filePath, artifact.content, 'utf-8');
        files.push(filePath);
      }
    }

    // Write translation if available
    if (translation) {
      const filePath = path.join(dir, 'translation.json');
      fs.writeFileSync(filePath, JSON.stringify(translation, null, 2), 'utf-8');
      files.push(filePath);
    }

    return NextResponse.json({ written: true, directory: dir, files });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
