import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://flukyubjlnhhcfadqdib.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZsdWt5dWJqbG5oaGNmYWRxZGliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNDIwODAsImV4cCI6MjA5MDYxODA4MH0.S7L855AZjYdOghmiwyI_yKeEt-tvEp_O-dytoe2nVaY'
);

// Inject Google Fonts
(function () {
  if (!document.getElementById('frame-fonts')) {
    const link = document.createElement('link');
    link.id = 'frame-fonts';
    link.rel = 'stylesheet';
    link.href =
      'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Lora:ital,wght@0,400;0,500;1,400&family=JetBrains+Mono:wght@400;500&display=swap';
    document.head.appendChild(link);
  }
})();

// ─── Colour palette ───────────────────────────────────────────────────────────
const C = {
  bg:          '#f5f0e8',
  paper:       '#fdfaf5',
  terracotta:  '#c4704f',
  sage:        '#7a9e7e',
  dustyBlue:   '#6b8cae',
  gold:        '#d4a843',
  rose:        '#c4758a',
  violet:      '#8b7ab8',
  dark:        '#2c2416',
  mid:         '#5a4a3a',
  light:       '#8a7a6a',
  border:      '#e8ddd0',
  borderMid:   '#d4c4b0',
  overlay:     'rgba(44,36,22,0.52)',
};

// ─── Section metadata ─────────────────────────────────────────────────────────
const SECTION_META = {
  storyScript:    { label: 'Story / Script',            color: C.terracotta },
  visualsShots:   { label: 'Visuals / Shots',           color: C.dustyBlue  },
  motionGraphics: { label: 'Motion Graphics',           color: C.violet     },
  soundEffects:   { label: 'Sound Effects',             color: C.gold       },
  bRoll:          { label: 'B-Roll List',               color: C.sage       },
  subtitles:      { label: 'Subtitles / On-Screen Text',color: C.rose       },
};
const SECTION_KEYS = Object.keys(SECTION_META);

// ─── Default data ─────────────────────────────────────────────────────────────
const DEFAULT_CHECKLIST = [
  'Location confirmed',
  'Props assembled',
  'Lighting gear packed',
  'Microphone tested',
  'Camera charged & card formatted',
  'Shot list printed / accessible',
  'Talent / subjects confirmed',
  'Release forms signed',
  'Backup storage ready',
  'Call sheet shared with crew',
];

const DEFAULT_BEATS = [
  { label: 'Cold Open',         tension: 7  },
  { label: 'Setup',             tension: 3  },
  { label: 'Inciting Incident', tension: 6  },
  { label: 'Rising Action',     tension: 8  },
  { label: 'Climax',            tension: 10 },
  { label: 'Resolution',        tension: 5  },
  { label: 'Outro / CTA',       tension: 2  },
];

// ─── ID generator ─────────────────────────────────────────────────────────────
let _seq = 0;
const uid = () => `${Date.now()}-${++_seq}`;

// ─── Factory helpers ──────────────────────────────────────────────────────────
const makeProject = (name) => ({
  id: uid(),
  name,
  hookStatement: '',
  hookScore: 5,
  arcBeats: DEFAULT_BEATS.map((b) => ({ ...b, id: uid() })),
  checklist: DEFAULT_CHECKLIST.map((label) => ({ id: uid(), label, checked: false })),
  sections: Object.fromEntries(SECTION_KEYS.map((k) => [k, []])),
  collapsed: Object.fromEntries(SECTION_KEYS.map((k) => [k, false])),
});

const makeItem = () => ({ id: uid(), scene: '', content: '', links: [] });

// ─── Shared style helpers ─────────────────────────────────────────────────────
const FONT_SERIF   = "'Lora', Georgia, serif";
const FONT_DISPLAY = "'Playfair Display', Georgia, serif";
const FONT_MONO    = "'JetBrains Mono', 'Courier New', monospace";

const cardStyle = {
  background: C.paper,
  borderRadius: 12,
  border: `1px solid ${C.border}`,
  padding: '20px 24px',
};

const btnStyle = (bg, fg = '#fff') => ({
  background: bg,
  color: fg,
  border: 'none',
  borderRadius: 8,
  padding: '10px 20px',
  fontFamily: FONT_SERIF,
  fontSize: 14,
  fontWeight: 500,
  cursor: 'pointer',
});

const ghostStyle = (color) => ({
  background: 'transparent',
  color,
  border: `1.5px solid ${color}`,
  borderRadius: 8,
  padding: '7px 16px',
  fontFamily: FONT_SERIF,
  fontSize: 13,
  cursor: 'pointer',
});

const inputStyle = {
  width: '100%',
  background: C.bg,
  border: `1px solid ${C.border}`,
  borderRadius: 8,
  padding: '8px 12px',
  fontFamily: FONT_SERIF,
  fontSize: 14,
  color: C.dark,
  boxSizing: 'border-box',
  height: 38,
  outline: 'none',
};

const textareaStyle = {
  width: '100%',
  background: C.bg,
  border: `1px solid ${C.border}`,
  borderRadius: 8,
  padding: '10px 12px',
  fontFamily: FONT_SERIF,
  fontSize: 14,
  color: C.dark,
  resize: 'vertical',
  lineHeight: 1.6,
  boxSizing: 'border-box',
  outline: 'none',
};

const monoStyle = { fontFamily: FONT_MONO, fontSize: 12 };

// ─── HookScore badge ──────────────────────────────────────────────────────────
function HookScore({ score }) {
  const tier =
    score >= 9 ? { label: 'Magnetic',   color: C.sage      } :
    score >= 7 ? { label: 'Strong',     color: C.dustyBlue } :
    score >= 5 ? { label: 'Decent',     color: C.gold      } :
    score >= 3 ? { label: 'Weak',       color: C.rose      } :
                 { label: 'Needs Work', color: C.terracotta };
  return (
    <span style={{
      ...monoStyle,
      background: tier.color + '22',
      color: tier.color,
      border: `1px solid ${tier.color}55`,
      borderRadius: 6,
      padding: '2px 10px',
    }}>
      {score}/10 — {tier.label}
    </span>
  );
}

// ─── Tension Arc (read-only) ──────────────────────────────────────────────────
function TensionArcReadOnly({ beats }) {
  const W = 580, H = 110, PAD = 28;
  const n = beats.length;
  if (n === 0) return null;
  const xStep = (W - PAD * 2) / Math.max(n - 1, 1);
  const pts = beats.map((b, i) => ({
    x: PAD + i * xStep,
    y: PAD + (1 - b.tension / 10) * (H - PAD * 2),
  }));
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < n; i++) {
    const c1x = pts[i - 1].x + xStep * 0.4;
    const c2x = pts[i].x - xStep * 0.4;
    d += ` C ${c1x} ${pts[i-1].y}, ${c2x} ${pts[i].y}, ${pts[i].x} ${pts[i].y}`;
  }
  const fill = d + ` L ${pts[n-1].x} ${H - 4} L ${pts[0].x} ${H - 4} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: W, display: 'block' }}>
      <defs>
        <linearGradient id="roGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.terracotta} stopOpacity="0.25" />
          <stop offset="100%" stopColor={C.terracotta} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={fill} fill="url(#roGrad)" />
      <path d={d} fill="none" stroke={C.terracotta} strokeWidth="2" strokeLinecap="round" />
      {pts.map((pt, i) => (
        <g key={beats[i].id}>
          <circle cx={pt.x} cy={pt.y} r={4} fill={C.paper} stroke={C.terracotta} strokeWidth={1.5} />
          <text x={pt.x} y={H - 1} textAnchor="middle" fontSize={8} fill={C.light} fontFamily={FONT_SERIF}>
            {beats[i].label.length > 9 ? beats[i].label.slice(0, 8) + '…' : beats[i].label}
          </text>
        </g>
      ))}
    </svg>
  );
}

// ─── Tension Arc (interactive) ────────────────────────────────────────────────
function TensionArc({ beats, onChange }) {
  const W = 620, H = 180, PAD = 40;
  const n = beats.length;
  const svgRef = useRef(null);
  const [dragging, setDragging] = useState(null);

  if (n === 0) return null;
  const xStep = (W - PAD * 2) / Math.max(n - 1, 1);
  const pts = beats.map((b, i) => ({
    x: PAD + i * xStep,
    y: PAD + (1 - b.tension / 10) * (H - PAD * 2 - 20),
  }));

  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < n; i++) {
    const c1x = pts[i-1].x + xStep * 0.4;
    const c2x = pts[i].x - xStep * 0.4;
    d += ` C ${c1x} ${pts[i-1].y}, ${c2x} ${pts[i].y}, ${pts[i].x} ${pts[i].y}`;
  }
  const fill = d + ` L ${pts[n-1].x} ${H - 20} L ${pts[0].x} ${H - 20} Z`;

  const handleMouseMove = (e) => {
    if (dragging === null) return;
    const rect = svgRef.current.getBoundingClientRect();
    const relY = (e.clientY - rect.top) / rect.height;
    const svgY = relY * H;
    const t = Math.min(10, Math.max(1, Math.round((1 - (svgY - PAD) / (H - PAD * 2 - 20)) * 10)));
    onChange(dragging, t, null);
  };

  return (
    <div>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: '100%', maxWidth: W, display: 'block', cursor: dragging !== null ? 'grabbing' : 'default', userSelect: 'none' }}
        onMouseMove={handleMouseMove}
        onMouseUp={() => setDragging(null)}
        onMouseLeave={() => setDragging(null)}
      >
        <defs>
          <linearGradient id="arcGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={C.terracotta} stopOpacity="0.28" />
            <stop offset="100%" stopColor={C.terracotta} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {/* Y-axis guide lines */}
        {[2, 5, 8].map(v => {
          const gy = PAD + (1 - v / 10) * (H - PAD * 2 - 20);
          return (
            <g key={v}>
              <line x1={PAD} y1={gy} x2={W - PAD} y2={gy} stroke={C.border} strokeWidth={1} strokeDasharray="4 4" />
              <text x={PAD - 4} y={gy + 4} textAnchor="end" fontSize={8} fill={C.light} fontFamily={FONT_MONO}>{v}</text>
            </g>
          );
        })}
        <path d={fill} fill="url(#arcGrad)" />
        <path d={d} fill="none" stroke={C.terracotta} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((pt, i) => (
          <g key={beats[i].id}>
            <circle
              cx={pt.x} cy={pt.y} r={9}
              fill={dragging === i ? C.terracotta : C.paper}
              stroke={C.terracotta} strokeWidth={2}
              style={{ cursor: 'grab' }}
              onMouseDown={(e) => { e.preventDefault(); setDragging(i); }}
            />
            <text x={pt.x} y={pt.y - 14} textAnchor="middle" fontSize={9} fill={C.mid} fontFamily={FONT_MONO}>
              {beats[i].tension}
            </text>
            <text x={pt.x} y={H - 5} textAnchor="middle" fontSize={9} fill={C.light} fontFamily={FONT_SERIF}>
              {beats[i].label.length > 9 ? beats[i].label.slice(0, 8) + '…' : beats[i].label}
            </text>
          </g>
        ))}
      </svg>

      {/* Beat editor strip */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
        {beats.map((beat, i) => (
          <div key={beat.id} style={{ flex: '1 1 110px', background: C.bg, borderRadius: 8, padding: '8px 10px', border: `1px solid ${C.border}` }}>
            <div style={{ ...monoStyle, color: C.light, marginBottom: 3 }}>Beat {i + 1}</div>
            <input
              style={{ ...inputStyle, fontSize: 12, height: 28, padding: '3px 7px', marginBottom: 5 }}
              value={beat.label}
              placeholder="Name"
              onChange={(e) => onChange(i, null, e.target.value)}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input
                type="range" min={1} max={10} value={beat.tension}
                style={{ flex: 1, accentColor: C.terracotta }}
                onChange={(e) => onChange(i, Number(e.target.value), null)}
              />
              <span style={{ ...monoStyle, color: C.terracotta, minWidth: 16, textAlign: 'right' }}>{beat.tension}</span>
            </div>
          </div>
        ))}
      </div>
      <button style={{ ...ghostStyle(C.terracotta), fontSize: 12, marginTop: 10 }} onClick={() => onChange('add', null, null)}>
        + Add Beat
      </button>
    </div>
  );
}

// ─── Section Box ──────────────────────────────────────────────────────────────
function SectionBox({ sectionKey, items, collapsed, allSections, onToggle, onAdd, onUpdate, onRemove, onAddLink, onRemoveLink }) {
  const meta = SECTION_META[sectionKey];

  const allItems = SECTION_KEYS.flatMap((k) =>
    allSections[k].map((it) => ({ ...it, sectionKey: k }))
  );

  return (
    <div style={{ ...cardStyle, marginBottom: 16, borderLeft: `4px solid ${meta.color}` }}>
      {/* Header row */}
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none' }}
        onClick={onToggle}
      >
        <span style={{ fontFamily: FONT_DISPLAY, fontSize: 17, fontWeight: 600, color: meta.color, flex: 1 }}>
          {meta.label}
        </span>
        <span style={{ ...monoStyle, color: C.light }}>{items.length} item{items.length !== 1 ? 's' : ''}</span>
        <span style={{ color: C.light, fontSize: 12, marginLeft: 4 }}>{collapsed ? '▶' : '▼'}</span>
      </div>

      {!collapsed && (
        <div style={{ marginTop: 16 }}>
          {items.length === 0 && (
            <p style={{ color: C.light, fontSize: 13, fontStyle: 'italic', margin: '0 0 14px' }}>
              No items yet — add a scene below.
            </p>
          )}

          {items.map((item) => (
            <div key={item.id} style={{ background: C.bg, borderRadius: 10, padding: '14px 16px', marginBottom: 12, border: `1px solid ${C.border}` }}>
              {/* Scene name row */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                <input
                  style={{ ...inputStyle, flex: '0 0 180px', fontSize: 13 }}
                  placeholder="Scene / Act name"
                  value={item.scene}
                  onChange={(e) => onUpdate(item.id, 'scene', e.target.value)}
                />
                <div style={{ flex: 1 }} />
                <button
                  style={{ ...ghostStyle(C.rose), padding: '4px 10px', fontSize: 12 }}
                  onClick={() => onRemove(item.id)}
                >Remove</button>
              </div>

              {/* Content */}
              <textarea
                style={{ ...textareaStyle, minHeight: 80 }}
                placeholder={`${meta.label} notes for this scene…`}
                value={item.content}
                onChange={(e) => onUpdate(item.id, 'content', e.target.value)}
              />

              {/* Links */}
              <div style={{ marginTop: 10 }}>
                <div style={{ ...monoStyle, color: C.light, marginBottom: 6 }}>LINKED SCENES</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
                  {item.links.map((linkId) => {
                    const linked = allItems.find((x) => x.id === linkId);
                    if (!linked) return null;
                    const lc = SECTION_META[linked.sectionKey].color;
                    return (
                      <span key={linkId} style={{
                        ...monoStyle,
                        background: lc + '22', color: lc,
                        border: `1px solid ${lc}44`,
                        borderRadius: 5, padding: '2px 8px',
                        display: 'flex', alignItems: 'center', gap: 4,
                      }}>
                        {SECTION_META[linked.sectionKey].label}: {linked.scene || 'Unnamed'}
                        <span style={{ cursor: 'pointer', opacity: 0.7 }} onClick={() => onRemoveLink(item.id, linkId)}>×</span>
                      </span>
                    );
                  })}
                </div>
                <select
                  style={{
                    ...monoStyle,
                    background: C.bg, border: `1px solid ${C.border}`,
                    borderRadius: 6, padding: '4px 8px', color: C.mid, cursor: 'pointer',
                  }}
                  value=""
                  onChange={(e) => { if (e.target.value) onAddLink(item.id, e.target.value); }}
                >
                  <option value="">+ Link to another scene…</option>
                  {allItems
                    .filter((x) => x.id !== item.id && !item.links.includes(x.id))
                    .map((x) => (
                      <option key={x.id} value={x.id}>
                        [{SECTION_META[x.sectionKey].label}] {x.scene || 'Unnamed scene'}
                      </option>
                    ))}
                </select>
              </div>
            </div>
          ))}

          <button style={{ ...ghostStyle(meta.color), fontSize: 13 }} onClick={onAdd}>
            + Add Scene
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function Modal({ onClose, children }) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: C.overlay, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
      onClick={onClose}
    >
      <div
        style={{ ...cardStyle, width: '90%', maxWidth: 420, padding: '32px 36px', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

// ─── Moodboard View ───────────────────────────────────────────────────────────
function MoodboardView({ project }) {
  const checked = project.checklist.filter((c) => c.checked).length;
  const readiness = Math.round((checked / project.checklist.length) * 100);

  return (
    <div>
      {/* Hook */}
      <div style={{ ...cardStyle, borderLeft: `4px solid ${C.gold}`, marginBottom: 20 }}>
        <div style={{ ...monoStyle, color: C.gold, marginBottom: 8 }}>HOOK STATEMENT</div>
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 20, fontStyle: 'italic', color: C.dark, marginBottom: 10, lineHeight: 1.5 }}>
          "{project.hookStatement || 'No hook statement written yet.'}"
        </div>
        <HookScore score={project.hookScore} />
      </div>

      {/* Tension Arc */}
      <div style={{ ...cardStyle, marginBottom: 20 }}>
        <div style={{ ...monoStyle, color: C.terracotta, marginBottom: 12 }}>TENSION ARC</div>
        <TensionArcReadOnly beats={project.arcBeats} />
      </div>

      {/* Readiness bar */}
      <div style={{ ...cardStyle, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ ...monoStyle, color: C.sage }}>FILMING READINESS</div>
          <span style={{ ...monoStyle, color: C.sage }}>{readiness}%</span>
        </div>
        <div style={{ background: C.border, borderRadius: 99, height: 8, overflow: 'hidden' }}>
          <div style={{ width: `${readiness}%`, background: C.sage, height: '100%', borderRadius: 99, transition: 'width 0.4s' }} />
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px', marginTop: 12 }}>
          {project.checklist.map((item) => (
            <span key={item.id} style={{ ...monoStyle, color: item.checked ? C.sage : C.light, textDecoration: item.checked ? 'none' : 'none' }}>
              {item.checked ? '✓' : '○'} {item.label}
            </span>
          ))}
        </div>
      </div>

      {/* Sections grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: 16 }}>
        {SECTION_KEYS.map((key) => {
          const meta = SECTION_META[key];
          const items = project.sections[key];
          return (
            <div key={key} style={{ ...cardStyle, borderTop: `3px solid ${meta.color}` }}>
              <div style={{ ...monoStyle, color: meta.color, marginBottom: 12 }}>{meta.label.toUpperCase()}</div>
              {items.length === 0 ? (
                <p style={{ color: C.light, fontSize: 12, fontStyle: 'italic', margin: 0 }}>Nothing added yet.</p>
              ) : (
                items.map((item, idx) => (
                  <div key={item.id} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: idx < items.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                    {item.scene && (
                      <div style={{ ...monoStyle, color: meta.color, marginBottom: 4 }}>{item.scene}</div>
                    )}
                    <div style={{ fontSize: 13, color: C.mid, lineHeight: 1.55, whiteSpace: 'pre-wrap', fontFamily: FONT_SERIF }}>
                      {item.content || <em style={{ color: C.light }}>Empty</em>}
                    </div>
                    {item.links.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                        {item.links.map((lid) => {
                          const allItems = SECTION_KEYS.flatMap((k) => project.sections[k].map((it) => ({ ...it, sectionKey: k })));
                          const linked = allItems.find((x) => x.id === lid);
                          if (!linked) return null;
                          const lc = SECTION_META[linked.sectionKey].color;
                          return (
                            <span key={lid} style={{ ...monoStyle, fontSize: 10, background: lc + '22', color: lc, border: `1px solid ${lc}44`, borderRadius: 4, padding: '1px 6px' }}>
                              {linked.scene || 'Unnamed'}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Project Screen ───────────────────────────────────────────────────────────
function ProjectScreen({ project, onBack, onUpdate }) {
  const [tab, setTab] = useState('plan');

  const set = (patch) => onUpdate({ ...project, ...patch });

  const updateArc = (idxOrCmd, tension, label) => {
    if (idxOrCmd === 'add') {
      set({ arcBeats: [...project.arcBeats, { id: uid(), label: `Beat ${project.arcBeats.length + 1}`, tension: 5 }] });
    } else {
      set({
        arcBeats: project.arcBeats.map((b, i) =>
          i === idxOrCmd
            ? { ...b, tension: tension !== null ? tension : b.tension, label: label !== null ? label : b.label }
            : b
        ),
      });
    }
  };

  const toggleCheck = (id) =>
    set({ checklist: project.checklist.map((c) => (c.id === id ? { ...c, checked: !c.checked } : c)) });

  const updateCheckLabel = (id, label) =>
    set({ checklist: project.checklist.map((c) => (c.id === id ? { ...c, label } : c)) });

  const removeCheckItem = (id) =>
    set({ checklist: project.checklist.filter((c) => c.id !== id) });

  const addCheckItem = () =>
    set({ checklist: [...project.checklist, { id: uid(), label: '', checked: false }] });

  const toggleSection = (key) =>
    set({ collapsed: { ...project.collapsed, [key]: !project.collapsed[key] } });

  const addItem = (key) =>
    set({ sections: { ...project.sections, [key]: [...project.sections[key], makeItem()] } });

  const updateItem = (key, id, field, value) =>
    set({
      sections: {
        ...project.sections,
        [key]: project.sections[key].map((it) => (it.id === id ? { ...it, [field]: value } : it)),
      },
    });

  const removeItem = (key, id) =>
    set({ sections: { ...project.sections, [key]: project.sections[key].filter((it) => it.id !== id) } });

  const addLink = (key, itemId, linkId) =>
    set({
      sections: {
        ...project.sections,
        [key]: project.sections[key].map((it) => (it.id === itemId ? { ...it, links: [...it.links, linkId] } : it)),
      },
    });

  const removeLink = (key, itemId, linkId) =>
    set({
      sections: {
        ...project.sections,
        [key]: project.sections[key].map((it) =>
          it.id === itemId ? { ...it, links: it.links.filter((l) => l !== linkId) } : it
        ),
      },
    });

  const checked = project.checklist.filter((c) => c.checked).length;
  const readiness = Math.round((checked / project.checklist.length) * 100);

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: FONT_SERIF }}>
      {/* Top bar */}
      <div style={{ background: C.dark, padding: '18px 32px' }}>
        <button
          style={{ ...monoStyle, background: 'transparent', border: 'none', color: C.light, cursor: 'pointer', padding: 0, marginBottom: 8, display: 'block' }}
          onClick={onBack}
        >
          ← All Projects
        </button>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 26, fontWeight: 700, color: C.paper, letterSpacing: '-0.3px' }}>
            {project.name}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[['plan', 'Plan'], ['moodboard', 'Moodboard']].map(([key, label]) => (
              <button
                key={key}
                style={{
                  ...btnStyle(tab === key ? C.terracotta : 'transparent', tab === key ? '#fff' : C.light),
                  border: `1.5px solid ${tab === key ? C.terracotta : C.light}`,
                  fontSize: 13,
                  padding: '8px 18px',
                }}
                onClick={() => setTab(key)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 880, margin: '0 auto', padding: '32px 24px' }}>
        {tab === 'moodboard' ? (
          <MoodboardView project={project} />
        ) : (
          <>
            {/* ── Hook Statement ── */}
            <div style={{ ...cardStyle, marginBottom: 20, borderLeft: `4px solid ${C.gold}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
                <div style={{ fontFamily: FONT_DISPLAY, fontSize: 17, fontWeight: 600, color: C.gold }}>Hook Statement</div>
                <HookScore score={project.hookScore} />
              </div>
              <textarea
                style={{ ...textareaStyle, minHeight: 72 }}
                placeholder="The single sentence that makes viewers stop scrolling. E.g. 'What if everything you know about X is wrong?'"
                value={project.hookStatement}
                onChange={(e) => set({ hookStatement: e.target.value })}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
                <span style={{ fontSize: 13, color: C.light }}>Hook strength:</span>
                <input
                  type="range" min={1} max={10} value={project.hookScore}
                  style={{ flex: 1, accentColor: C.gold }}
                  onChange={(e) => set({ hookScore: Number(e.target.value) })}
                />
                <span style={{ ...monoStyle, color: C.gold, minWidth: 24 }}>{project.hookScore}</span>
              </div>
            </div>

            {/* ── Tension Arc ── */}
            <div style={{ ...cardStyle, marginBottom: 20, borderLeft: `4px solid ${C.terracotta}` }}>
              <div style={{ fontFamily: FONT_DISPLAY, fontSize: 17, fontWeight: 600, color: C.terracotta, marginBottom: 4 }}>
                Tension Arc
              </div>
              <div style={{ fontSize: 13, color: C.light, marginBottom: 16 }}>
                Drag the points to shape narrative tension across your story beats.
              </div>
              <TensionArc beats={project.arcBeats} onChange={updateArc} />
            </div>

            {/* ── Filming Readiness Checklist ── */}
            <div style={{ ...cardStyle, marginBottom: 20, borderLeft: `4px solid ${C.sage}` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
                <div style={{ fontFamily: FONT_DISPLAY, fontSize: 17, fontWeight: 600, color: C.sage }}>Filming Readiness</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ ...monoStyle, color: C.sage }}>{checked}/{project.checklist.length}</span>
                  <div style={{ width: 90, background: C.border, borderRadius: 99, height: 6, overflow: 'hidden' }}>
                    <div style={{ width: `${readiness}%`, background: C.sage, height: '100%', borderRadius: 99, transition: 'width 0.3s' }} />
                  </div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '8px 12px' }}>
                {project.checklist.map((item) => (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="checkbox" checked={item.checked}
                      onChange={() => toggleCheck(item.id)}
                      style={{ accentColor: C.sage, width: 15, height: 15, flexShrink: 0, cursor: 'pointer' }}
                    />
                    <input
                      style={{
                        ...monoStyle,
                        background: 'transparent', border: 'none',
                        borderBottom: `1px solid ${C.border}`,
                        color: item.checked ? C.light : C.dark,
                        textDecoration: item.checked ? 'line-through' : 'none',
                        flex: 1, padding: '2px 4px', outline: 'none',
                      }}
                      value={item.label}
                      onChange={(e) => updateCheckLabel(item.id, e.target.value)}
                      placeholder="Checklist item"
                    />
                    <button
                      style={{ background: 'none', border: 'none', color: C.light, cursor: 'pointer', fontSize: 15, padding: 0, lineHeight: 1 }}
                      onClick={() => removeCheckItem(item.id)}
                    >×</button>
                  </div>
                ))}
              </div>
              <button style={{ ...ghostStyle(C.sage), fontSize: 12, marginTop: 14 }} onClick={addCheckItem}>
                + Add Item
              </button>
            </div>

            {/* ── 6 Collapsible Section Boxes ── */}
            {SECTION_KEYS.map((key) => (
              <SectionBox
                key={key}
                sectionKey={key}
                items={project.sections[key]}
                collapsed={project.collapsed[key]}
                allSections={project.sections}
                onToggle={() => toggleSection(key)}
                onAdd={() => addItem(key)}
                onUpdate={(id, field, value) => updateItem(key, id, field, value)}
                onRemove={(id) => removeItem(key, id)}
                onAddLink={(itemId, linkId) => addLink(key, itemId, linkId)}
                onRemoveLink={(itemId, linkId) => removeLink(key, itemId, linkId)}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Login Screen ─────────────────────────────────────────────────────────────
function LoginScreen() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [message, setMessage]   = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSignIn = async () => {
    setError(''); setMessage(''); setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) setError(err.message);
  };

  const handleSignUp = async () => {
    setError(''); setMessage(''); setLoading(true);
    const { error: err } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (err) setError(err.message);
    else setMessage('Check your email to confirm your account, then sign in.');
  };

  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT_SERIF }}>
      <div style={{ ...cardStyle, width: '100%', maxWidth: 400, padding: '40px 36px' }}>
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 32, fontWeight: 700, color: C.dark, marginBottom: 4 }}>Frame.</div>
        <div style={{ ...monoStyle, color: C.light, marginBottom: 32 }}>VIDEO PRE-PRODUCTION PLANNER</div>
        <input
          style={{ ...inputStyle, marginBottom: 12 }}
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSignIn()}
          autoFocus
        />
        <input
          style={{ ...inputStyle, marginBottom: 20 }}
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSignIn()}
        />
        {error   && <div style={{ color: C.rose, fontSize: 13, marginBottom: 14 }}>{error}</div>}
        {message && <div style={{ color: C.sage, fontSize: 13, marginBottom: 14 }}>{message}</div>}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            style={{ ...btnStyle(C.terracotta), flex: 1, opacity: loading ? 0.6 : 1 }}
            onClick={handleSignIn}
            disabled={loading}
          >
            Sign In
          </button>
          <button
            style={{ ...ghostStyle(C.dustyBlue), flex: 1, opacity: loading ? 0.6 : 1 }}
            onClick={handleSignUp}
            disabled={loading}
          >
            Create Account
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Home Screen ──────────────────────────────────────────────────────────────
function HomeScreen({ projects, onCreate, onOpen, onDelete, onSignOut, userEmail }) {
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState('');

  const handleCreate = () => {
    if (newName.trim()) {
      onCreate(newName.trim());
      setNewName('');
      setShowModal(false);
    }
  };

  const ACCENT_CYCLE = [C.terracotta, C.sage, C.dustyBlue, C.gold, C.rose, C.violet];

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: FONT_SERIF }}>
      {/* Header */}
      <div style={{ background: C.dark, padding: '28px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 32, fontWeight: 700, color: C.paper, letterSpacing: '-0.5px' }}>
            Frame.
          </div>
          <div style={{ ...monoStyle, color: C.light, marginTop: 3 }}>VIDEO PRE-PRODUCTION PLANNER</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button style={{ ...btnStyle(C.terracotta) }} onClick={() => setShowModal(true)}>
            + New Project
          </button>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
            <span style={{ ...monoStyle, color: C.light, fontSize: 11 }}>{userEmail}</span>
            <button style={{ ...ghostStyle(C.light), padding: '4px 12px', fontSize: 12 }} onClick={onSignOut}>
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ maxWidth: 940, margin: '0 auto', padding: '44px 28px' }}>
        {projects.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 26, color: C.mid, marginBottom: 10 }}>No projects yet</div>
            <div style={{ color: C.light, fontSize: 15, marginBottom: 28 }}>
              Create your first video project to start planning.
            </div>
            <button style={{ ...btnStyle(C.terracotta) }} onClick={() => setShowModal(true)}>
              + New Project
            </button>
          </div>
        ) : (
          <>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 600, color: C.dark, marginBottom: 24 }}>
              Your Projects
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
              {projects.map((p, idx) => {
                const accent = ACCENT_CYCLE[idx % ACCENT_CYCLE.length];
                const totalItems = SECTION_KEYS.reduce((n, k) => n + p.sections[k].length, 0);
                const doneCount = p.checklist.filter((c) => c.checked).length;
                return (
                  <div
                    key={p.id}
                    style={{ ...cardStyle, borderTop: `4px solid ${accent}`, cursor: 'pointer', position: 'relative' }}
                    onClick={() => onOpen(p.id)}
                    onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,0,0,0.11)')}
                    onMouseLeave={(e) => (e.currentTarget.style.boxShadow = 'none')}
                  >
                    <button
                      title="Delete project"
                      style={{
                        position: 'absolute', top: 10, right: 10,
                        background: 'transparent', border: 'none', cursor: 'pointer',
                        color: C.light, fontSize: 15, lineHeight: 1, padding: '2px 5px', borderRadius: 4,
                      }}
                      onClick={(e) => { e.stopPropagation(); onDelete(p.id); }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = C.rose)}
                      onMouseLeave={(e) => (e.currentTarget.style.color = C.light)}
                    >
                      ✕
                    </button>
                    <div style={{ fontFamily: FONT_DISPLAY, fontSize: 17, fontWeight: 600, color: C.dark, marginBottom: 6, paddingRight: 24 }}>
                      {p.name}
                    </div>
                    {p.hookStatement && (
                      <div style={{ color: C.mid, fontSize: 13, fontStyle: 'italic', lineHeight: 1.45, marginBottom: 10 }}>
                        "{p.hookStatement.length > 90 ? p.hookStatement.slice(0, 88) + '…' : p.hookStatement}"
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 8 }}>
                      <span style={{ ...monoStyle, color: C.light }}>{totalItems} scene items</span>
                      <span style={{ ...monoStyle, color: C.light }}>·</span>
                      <span style={{ ...monoStyle, color: doneCount === p.checklist.length ? C.sage : C.gold }}>
                        {doneCount}/{p.checklist.length} ready
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {showModal && (
        <Modal onClose={() => setShowModal(false)}>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 600, color: C.dark, marginBottom: 6 }}>
            New Project
          </div>
          <div style={{ color: C.light, fontSize: 13, marginBottom: 20 }}>What's the name of this video?</div>
          <input
            style={{ ...inputStyle, marginBottom: 18 }}
            placeholder="e.g. Brand Documentary — Spring 2025"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            autoFocus
          />
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button style={{ ...ghostStyle(C.mid) }} onClick={() => setShowModal(false)}>Cancel</button>
            <button style={{ ...btnStyle(C.terracotta) }} onClick={handleCreate}>Create Project</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser]         = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [activeId, setActiveId] = useState(null);

  // Resolve the initial session, then subscribe to auth changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Persist to localStorage as fallback whenever projects change
  useEffect(() => {
    if (!user) return;
    try {
      localStorage.setItem('frame-app-projects', JSON.stringify(projects));
    } catch {}
  }, [projects, user]);

  // Fetch projects from Supabase when user signs in; clear on sign-out
  useEffect(() => {
    if (!user) {
      setProjects([]);
      setActiveId(null);
      return;
    }
    // Show localStorage data instantly while the network request is in flight
    try {
      const saved = localStorage.getItem('frame-app-projects');
      if (saved) setProjects(JSON.parse(saved));
    } catch {}

    async function fetchProjects() {
      console.log('[Supabase] fetchProjects: starting fetch for user', user.id);
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('id, text, updated_at')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false });
        if (error) throw error;
        console.log('[Supabase] fetchProjects: received', data?.length ?? 0, 'rows', data);
        if (!data || data.length === 0) return;
        const localMap = new Map();
        try {
          const saved = localStorage.getItem('frame-app-projects');
          if (saved) JSON.parse(saved).forEach((p) => localMap.set(String(p.id), p));
        } catch {}
        // Supabase wins on conflict; append any local-only projects not yet synced
        const merged = data.map((row) => ({
          ...row.text,
          id: row.text.id ?? row.id,
        }));
        localMap.forEach((lp) => {
          if (!merged.find((p) => String(p.id) === String(lp.id))) merged.push(lp);
        });
        console.log('[Supabase] fetchProjects: merged projects', merged);
        setProjects(merged);
      } catch (err) {
        console.warn('[Supabase] fetchProjects failed, using localStorage:', err);
      }
    }
    fetchProjects();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const createProject = async (name) => {
    const p = makeProject(name);
    setProjects((prev) => [...prev, p]);
    setActiveId(p.id);
    // Do NOT send the `id` column — it's int8 but our ids are strings.
    // The string id lives inside the `text` jsonb field only.
    console.log('[Supabase] createProject: inserting', { name: p.name, appId: p.id });
    try {
      const { data, error } = await supabase.from('projects').insert({
        text: p,
        user_id: user.id,
        updated_at: new Date().toISOString(),
      }).select();
      if (error) throw error;
      console.log('[Supabase] createProject: insert success', data);
    } catch (err) {
      console.warn('[Supabase] createProject: insert failed', err);
    }
  };

  const updateProject = async (updated) => {
    setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    // Filter by user_id + text->>'id' (string id stored in jsonb)
    console.log('[Supabase] updateProject: updating', { appId: updated.id, name: updated.name });
    try {
      const payload = { text: updated, updated_at: new Date().toISOString() };
      const { data: rows, error } = await supabase.from('projects')
        .update(payload)
        .eq('user_id', user.id)
        .eq('text->>id', updated.id)
        .select();
      if (error) throw error;
      if (!rows || rows.length === 0) {
        // Row missing (e.g. created offline) — insert it
        console.log('[Supabase] updateProject: no row found, inserting instead');
        const { data: inserted, error: insertErr } = await supabase.from('projects')
          .insert({ text: updated, user_id: user.id, updated_at: new Date().toISOString() })
          .select();
        if (insertErr) throw insertErr;
        console.log('[Supabase] updateProject: insert success', inserted);
      } else {
        console.log('[Supabase] updateProject: update success', rows);
      }
    } catch (err) {
      console.warn('[Supabase] updateProject: failed', err);
    }
  };

  const deleteProject = async (id) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    console.log('[Supabase] deleteProject: deleting', { appId: id });
    try {
      const { error } = await supabase.from('projects')
        .delete()
        .eq('user_id', user.id)
        .eq('text->>id', id);
      if (error) throw error;
      console.log('[Supabase] deleteProject: delete success', { appId: id });
    } catch (err) {
      console.warn('[Supabase] deleteProject: delete failed', err);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('frame-app-projects');
  };

  if (authLoading) return (
    <div style={{ fontFamily: FONT_SERIF, background: C.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.light }}>
      Loading…
    </div>
  );

  if (!user) return <LoginScreen />;

  const active = projects.find((p) => p.id === activeId);

  return (
    <div style={{ fontFamily: FONT_SERIF, background: C.bg, minHeight: '100vh', color: C.dark }}>
      {active ? (
        <ProjectScreen project={active} onBack={() => setActiveId(null)} onUpdate={updateProject} />
      ) : (
        <HomeScreen
          projects={projects}
          onCreate={createProject}
          onOpen={setActiveId}
          onDelete={deleteProject}
          onSignOut={signOut}
          userEmail={user.email}
        />
      )}
    </div>
  );
}
