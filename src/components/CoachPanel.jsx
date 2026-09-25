// Circuit Coach side panel: follows a guided build step by step, or runs the
// general checks on a free build, and lists every problem in build order with
// a concrete fix and a "Show me" button.

import { useState } from 'react';
import {
  CircleCheck, CircleX, CircleDashed, ArrowRight, Eye, RotateCcw, Hammer,
  LogOut, Lightbulb, Stethoscope, ChevronDown, ChevronRight, Info, TriangleAlert,
} from 'lucide-react';
import { LayoutDiagram } from './Diagrams';

const SEVERITY = {
  error: { color: '#ff7766', bg: '#2a1414', border: '#6a2a2a', label: 'Problem' },
  warn: { color: '#ffcc55', bg: '#2a2410', border: '#5a4a1a', label: 'Check' },
  info: { color: '#6aa2ff', bg: '#141c2a', border: '#2a3a5a', label: 'Tip' },
  todo: { color: '#999', bg: '#1a1a1a', border: '#333', label: 'To do' },
};

const smallBtn = {
  display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 9px',
  background: '#1f2a3d', border: '1px solid #33507a', borderRadius: 6,
  color: '#9cc2ff', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600,
};
const footBtn = {
  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
  padding: '8px 6px', background: '#1f1f1f', border: '1px solid #3a3a3a', borderRadius: 8,
  color: '#ccc', cursor: 'pointer', fontSize: '0.74rem',
};

function IssueCard({ issue, index, onShow }) {
  const sev = SEVERITY[issue.severity] || SEVERITY.info;
  const Icon = issue.severity === 'error' ? CircleX : issue.severity === 'warn' ? TriangleAlert : Info;
  return (
    <div style={{ background: sev.bg, border: `1px solid ${sev.border}`, borderRadius: 8, padding: 10 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <span style={{
          minWidth: 20, height: 20, borderRadius: 10, background: sev.color, color: '#111',
          fontSize: '0.7rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>{index}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: sev.color, fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            <Icon size={12} /> {sev.label}{issue.step ? ` · step ${issue.step}` : ''}
          </div>
          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#eee', marginTop: 2 }}>{issue.title}</div>
          {issue.detail && <div style={{ fontSize: '0.74rem', color: '#9a9a9a', marginTop: 4, lineHeight: 1.45 }}>{issue.detail}</div>}
          {issue.fix && (
            <div style={{ fontSize: '0.75rem', color: '#d8d8d8', marginTop: 6, lineHeight: 1.45 }}>
              <strong style={{ color: '#8ef0ab' }}>How to fix: </strong>{issue.fix}
            </div>
          )}
          {(issue.partIds?.length > 0 || issue.cells?.length > 0) && (
            <button onClick={() => onShow(issue)} style={{ ...smallBtn, marginTop: 8 }}>
              <Eye size={13} /> Show me
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function StepRow({ step, index, state, isCurrent, onShow }) {
  const Icon = state.status === 'done' ? CircleCheck : state.status === 'error' ? CircleX : isCurrent ? ArrowRight : CircleDashed;
  const color = state.status === 'done' ? '#22c55e' : state.status === 'error' ? '#ff7766' : isCurrent ? '#6aa2ff' : '#555';
  return (
    <div style={{
      display: 'flex', gap: 8, padding: '7px 8px', borderRadius: 8,
      background: isCurrent ? '#15223a' : 'transparent',
      border: isCurrent ? '1px solid #2a4a7a' : '1px solid transparent',
    }}>
      <Icon size={16} color={color} style={{ flexShrink: 0, marginTop: 1 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.78rem', lineHeight: 1.45, color: state.status === 'done' ? '#777' : '#ddd' }}>
          <strong style={{ color: '#888', marginRight: 4 }}>{index + 1}.</strong>{step.text}
        </div>
        {state.issue && state.status === 'error' && (
          <div style={{ fontSize: '0.72rem', color: '#ff9988', marginTop: 3, lineHeight: 1.4 }}>
            ✗ {state.issue.title}
          </div>
        )}
        {isCurrent && state.action && (
          <button onClick={() => onShow({ partIds: state.action.partIds, cells: [] })} style={{ ...smallBtn, marginTop: 6 }}>
            <Eye size={13} /> Select it
          </button>
        )}
      </div>
    </div>
  );
}

export default function CoachPanel({
  project, result, freeIssues, onShow, onExit, onRestart, onBuildForMe, onOpenProjects,
  showGhost, onToggleGhost,
}) {
  const [layoutOpen, setLayoutOpen] = useState(true);

  const header = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ background: '#1e2a3f', color: '#6aa2ff', borderRadius: 8, padding: 7, display: 'flex' }}>
        <Stethoscope size={16} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>Circuit Coach</div>
        <div style={{ fontSize: '0.7rem', color: '#777' }}>
          {project ? project.name : 'Free build — general checks'}
        </div>
      </div>
    </div>
  );

  if (!project) {
    const problems = freeIssues.filter((i) => i.severity === 'error' || i.severity === 'warn');
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {header}
        {problems.length === 0 && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: 10, background: '#10261a', border: '1px solid #1f5a35', borderRadius: 8, color: '#8ef0ab', fontSize: '0.8rem' }}>
            <CircleCheck size={16} /> No wiring problems found.
          </div>
        )}
        {freeIssues.map((issue, k) => <IssueCard key={k} issue={issue} index={k + 1} onShow={onShow} />)}
        <div style={{ fontSize: '0.74rem', color: '#777', lineHeight: 1.5, borderTop: '1px solid #262626', paddingTop: 10 }}>
          The coach checks for missing power, loose legs and wires, backwards LEDs and diodes,
          shorted parts, and burned-out parts. For step-by-step checking against a known
          circuit, start a guided project.
        </div>
        <button onClick={onOpenProjects} style={{ ...footBtn, flex: 'none', color: '#ffcc55', border: '1px solid #5a4a1a' }}>
          <Lightbulb size={14} /> Choose a guided project
        </button>
      </div>
    );
  }

  const { steps, issues, current, done } = result;
  const doneCount = steps.filter((s) => s.status === 'done').length;
  const problems = issues.filter((i) => i.severity !== 'todo');
  const nextStep = current >= 0 ? project.steps[current] : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {header}

      {/* progress */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#888', marginBottom: 4 }}>
          <span>Progress</span><span>{doneCount} / {steps.length} steps</span>
        </div>
        <div style={{ height: 6, background: '#222', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ width: `${(doneCount / steps.length) * 100}%`, height: '100%', background: done ? '#22c55e' : '#3b82f6', transition: 'width 0.3s' }} />
        </div>
      </div>

      {done ? (
        <div style={{ padding: 12, background: '#10261a', border: '1px solid #1f5a35', borderRadius: 8 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: '#8ef0ab', fontWeight: 700, fontSize: '0.88rem' }}>
            <CircleCheck size={18} /> Circuit complete — it works!
          </div>
          {project.explore?.length > 0 && (
            <>
              <div style={{ fontSize: '0.72rem', color: '#8aa', marginTop: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Now try</div>
              <ul style={{ margin: '4px 0 0', paddingLeft: 18, fontSize: '0.76rem', color: '#bcd', lineHeight: 1.5 }}>
                {project.explore.map((t, k) => <li key={k}>{t}</li>)}
              </ul>
            </>
          )}
        </div>
      ) : nextStep && (
        <div style={{ padding: 10, background: '#15223a', border: '1px solid #2a4a7a', borderRadius: 8 }}>
          <div style={{ fontSize: '0.68rem', color: '#6aa2ff', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Next · step {current + 1}
          </div>
          <div style={{ fontSize: '0.84rem', color: '#eee', marginTop: 3, lineHeight: 1.45 }}>{nextStep.text}</div>
        </div>
      )}

      {problems.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: '0.7rem', color: '#ff9988', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {problems.length} problem{problems.length > 1 ? 's' : ''} found, in build order
          </div>
          {problems.map((issue, k) => <IssueCard key={k} issue={issue} index={k + 1} onShow={onShow} />)}
        </div>
      )}

      <div>
        <div style={{ fontSize: '0.7rem', color: '#777', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
          Build steps
        </div>
        {project.steps.map((step, k) => (
          <StepRow key={k} step={step} index={k} state={steps[k]} isCurrent={k === current} onShow={onShow} />
        ))}
      </div>

      <div>
        <button
          onClick={() => setLayoutOpen((v) => !v)}
          style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: '#999', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, padding: 0 }}
        >
          {layoutOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />} Layout reference
        </button>
        {layoutOpen && (
          <div style={{ marginTop: 6 }}>
            <LayoutDiagram project={project} />
            <div style={{ fontSize: '0.68rem', color: '#666', marginTop: 4, lineHeight: 1.4 }}>
              Blue numbers mark the step that places each part. Your layout can differ, because the coach checks
              connections, not exact positions.
            </div>
          </div>
        )}
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: '0.74rem', color: '#aaa', cursor: 'pointer' }}>
          <input type="checkbox" checked={showGhost} onChange={onToggleGhost} />
          Show where the next part goes on the board
        </label>
      </div>

      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={onRestart} style={footBtn} title="Clear the board and build it yourself">
          <RotateCcw size={13} /> Start over
        </button>
        <button onClick={onBuildForMe} style={footBtn} title="Place every part for me">
          <Hammer size={13} /> Build for me
        </button>
        <button onClick={onExit} style={footBtn} title="Stop following this project">
          <LogOut size={13} /> Exit
        </button>
      </div>
    </div>
  );
}
