/**
 * CLUES Question Library — Admin Dashboard
 * Full React port of the standalone HTML question library manager.
 * 26 modules, 2,500 questions, all response types.
 *
 * Preserves the exact layout, styles, and functionality of the original.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  questionLibraryData,
  type QuestionLibraryData,
  type QuestionModule,
  type QuestionItem,
} from '../../data/questions';
import './QuestionLibrary.css';

// ─── MODULE ICONS ───
const MODULE_ICONS: Record<string, string> = {
  main_module: '\u{1F3E0}', general_questions: '\u{1F4AC}', tradeoff_questions: '\u2696\uFE0F',
  arts_culture: '\u{1F3A8}', climate_weather: '\u{1F324}\uFE0F', cultural_heritage_traditions: '\u{1F3DB}\uFE0F',
  education_learning: '\u{1F4DA}', entertainment_nightlife: '\u{1F3AD}', environment_community_appearance: '\u{1F33F}',
  family_children: '\u{1F468}\u200D\u{1F469}\u200D\u{1F467}', financial_banking: '\u{1F4B0}', food_dining: '\u{1F37D}\uFE0F',
  health_wellness: '\u{1F3E5}', housing_property: '\u{1F3E1}', legal_immigration: '\u2696\uFE0F',
  neighborhood_urban_design: '\u{1F3D9}\uFE0F', outdoor_recreation: '\u{1F3C3}', pets_animals: '\u{1F43E}',
  professional_career: '\u{1F4BC}', religion_spirituality: '\u{1F54A}\uFE0F', safety_security: '\u{1F6E1}\uFE0F',
  sexual_beliefs_practices_laws: '\u{1F308}', shopping_services: '\u{1F6CD}\uFE0F', social_values_governance: '\u{1F5F3}\uFE0F',
  technology_connectivity: '\u{1F4E1}', transportation_mobility: '\u{1F68C}',
};

// ─── TYPE BADGE CLASSES ───
function getBadgeClass(type: string): string {
  const t = (type || '').toLowerCase();
  if (t.includes('likert')) return 'ql-badge-likert';
  if (t.includes('dealbreaker')) return 'ql-badge-dealbreaker';
  if (t.includes('yes/no') || t === 'yes/no/maybe' || t === 'yes/no/in progress') return 'ql-badge-yesno';
  if (t.includes('multi')) return 'ql-badge-multiselect';
  if (t.includes('single')) return 'ql-badge-singleselect';
  if (t.includes('range') || t.includes('slider') || t.includes('temperature') || t.includes('speed') || t.includes('humidity') || t.includes('aqi') || t.includes('percentage') || t.includes('budget')) return 'ql-badge-range';
  if (t.includes('rank')) return 'ql-badge-ranking';
  if (t.includes('text') || t.includes('open')) return 'ql-badge-text';
  if (t.includes('scale') || t.includes('priority') || t.includes('attachment') || t.includes('concern') || t.includes('comfort') || t.includes('dependency') || t.includes('frustration') || t.includes('tolerance') || t.includes('sensitivity') || t.includes('difficulty') || t.includes('confidence') || t.includes('impact') || t.includes('proficiency')) return 'ql-badge-scale';
  return 'ql-badge-default';
}

// ─── ANSWER PREVIEW BUILDER ───
const SCALE_LABELS: Record<string, string[]> = {
  'likert-importance': ['Not Important', 'Slightly Important', 'Moderately Important', 'Very Important', 'Essential'],
  'likert-concern': ['Not Concerned', 'Slightly Concerned', 'Moderately Concerned', 'Very Concerned', 'Extremely Concerned'],
  'likert-comfort': ['Very Uncomfortable', 'Uncomfortable', 'Neutral', 'Comfortable', 'Very Comfortable'],
  'likert-willingness': ['Not Willing', 'Slightly Willing', 'Moderately Willing', 'Very Willing', 'Completely Willing'],
  'likert-frequency': ['Never', 'Rarely', 'Sometimes', 'Often', 'Very Frequently'],
  'likert-satisfaction': ['Very Dissatisfied', 'Dissatisfied', 'Neutral', 'Satisfied', 'Very Satisfied'],
  'likert-agreement': ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'],
  'dealbreaker': ['Mild Preference to Avoid', 'Would Rather Avoid', 'Significant Concern', 'Strong Aversion', 'Absolute Deal-Breaker'],
};

function AnswerPreview({ type }: { type: string }) {
  const t = (type || '').toLowerCase();

  if (SCALE_LABELS[t]) {
    const isDealbreaker = t === 'dealbreaker';
    const dcColors = ['#7f1d1d', '#991b1b', '#b91c1c', '#dc2626', '#ef4444'];
    return (
      <div className="ql-preview-scale">
        {SCALE_LABELS[t].map((lbl, i) => (
          <div
            key={i}
            className="ql-preview-scale-item"
            style={isDealbreaker ? { background: `${dcColors[i]}26`, color: '#f87171', borderColor: 'rgba(239,68,68,0.2)' } : undefined}
          >
            {i + 1}<br /><span style={{ fontSize: '9px' }}>{lbl.split(' ')[0]}</span>
          </div>
        ))}
      </div>
    );
  }

  if (t === 'yes/no' || t.startsWith('yes/no')) {
    const hasThird = t === 'yes/no/maybe' || t === 'yes/no/in progress';
    return (
      <div style={{ display: 'flex', gap: '10px' }}>
        <div className="ql-preview-scale-item" style={{ flex: 1, padding: '10px', textAlign: 'center', borderColor: 'rgba(16,185,129,0.3)', color: '#34d399' }}>
          {hasThird ? 'Yes' : '\u2713 Yes'}
        </div>
        {hasThird && (
          <div className="ql-preview-scale-item" style={{ flex: 1, padding: '10px', textAlign: 'center' }}>Maybe</div>
        )}
        <div className="ql-preview-scale-item" style={{ flex: 1, padding: '10px', textAlign: 'center', borderColor: 'rgba(239,68,68,0.3)', color: '#f87171' }}>
          {hasThird ? 'No' : '\u2715 No'}
        </div>
      </div>
    );
  }

  if (t === 'ranking') {
    return (
      <>
        {['Item 1', 'Item 2', 'Item 3', 'Item 4', 'Item 5'].map((it, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '13px', color: 'var(--ql-text-secondary)' }}>
            <span style={{ color: 'var(--ql-gold)', fontWeight: 700, minWidth: '20px' }}>{i + 1}</span>
            <span style={{ flex: 1 }}>{it}</span>
            <span style={{ color: 'var(--ql-text-muted)', fontSize: '16px' }}>{'\u2807'}</span>
          </div>
        ))}
      </>
    );
  }

  if (t.includes('multi')) {
    return (
      <>
        {['Option A', 'Option B', 'Option C', 'Option D'].map((it) => (
          <div key={it} className="ql-answer-item"><div className="ql-preview-check" />{it}</div>
        ))}
      </>
    );
  }

  if (t.includes('single')) {
    return (
      <>
        {['Option A', 'Option B', 'Option C', 'Option D'].map((it, i) => (
          <div key={it} className="ql-answer-item">
            <div className="ql-preview-dot" style={i === 0 ? { background: 'var(--ql-sapphire)' } : undefined} />{it}
          </div>
        ))}
      </>
    );
  }

  if (t.includes('range') || t.includes('slider') || t.includes('temperature') || t.includes('speed') || t.includes('humidity') || t.includes('percentage')) {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--ql-text-muted)', marginBottom: '6px' }}>
          <span>Min</span><span style={{ color: 'var(--ql-gold)' }}>Selected Range</span><span>Max</span>
        </div>
        <div className="ql-scale-bar" />
        <div className="ql-scale-labels"><span>Low</span><span>High</span></div>
      </div>
    );
  }

  if (t.includes('text') || t.includes('open')) {
    return (
      <div style={{ padding: '12px', background: 'var(--ql-bg-glass)', border: '1px dashed var(--ql-border)', borderRadius: '8px', color: 'var(--ql-text-muted)', fontSize: '13px', lineHeight: 1.6 }}>
        Free text response area&hellip;<br /><span style={{ fontSize: '11px', opacity: 0.6 }}>Multi-line textarea input</span>
      </div>
    );
  }

  if (t.includes('scale')) {
    return (
      <div className="ql-preview-scale">
        {[1, 2, 3, 4, 5].map(n => <div key={n} className="ql-preview-scale-item">{n}</div>)}
      </div>
    );
  }

  return (
    <div style={{ color: 'var(--ql-text-muted)', fontSize: '13px' }}>
      Response type: <strong style={{ color: 'var(--ql-text-primary)' }}>{type}</strong>
    </div>
  );
}

// ─── HIGHLIGHT HELPER ───
function highlightText(text: string, query: string) {
  if (!query) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase()
      ? <mark key={i} className="ql-highlight">{part}</mark>
      : part
  );
}

// ─── MAIN COMPONENT ───
export function QuestionLibrary() {
  const [data, setData] = useState<QuestionLibraryData>(() => JSON.parse(JSON.stringify(questionLibraryData)));
  const [currentModuleId, setCurrentModuleId] = useState<string | null>(null);
  const [currentSectionIdx, setCurrentSectionIdx] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [sidebarFilter, setSidebarFilter] = useState('');

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerRef, setDrawerRef] = useState<{ modIdx: number; secIdx: number; qIdx: number } | null>(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRef, setEditingRef] = useState<{ modIdx: number; secIdx: number; qIdx: number } | null>(null);
  const [editModule, setEditModule] = useState('');
  const [editSection, setEditSection] = useState(0);
  const [editQuestion, setEditQuestion] = useState('');
  const [editNumber, setEditNumber] = useState(0);
  const [editType, setEditType] = useState('');

  // Collapsed sections
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  // Toast
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  }, []);

  // All unique types
  const allTypes = (() => {
    const types = new Set<string>();
    data.modules.forEach(m => m.sections.forEach(s => s.questions.forEach(q => { if (q.type) types.add(q.type); })));
    return [...types].sort();
  })();

  // Total questions
  const totalQuestions = data.modules.reduce((s, m) => s + m.sections.reduce((ss, sec) => ss + sec.questions.length, 0), 0);

  // Select module
  const selectModule = useCallback((moduleId: string | null, sectionIdx: number | null = null) => {
    setCurrentModuleId(moduleId);
    setCurrentSectionIdx(sectionIdx);
    setSearchQuery('');
    setTypeFilter('');
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setModalOpen(false); setDrawerOpen(false); }
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        document.getElementById('ql-search-input')?.focus();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // Toggle section collapse
  const toggleSection = useCallback((key: string) => {
    setCollapsedSections(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }, []);

  // Open drawer
  const openDrawer = useCallback((modIdx: number, secIdx: number, qIdx: number) => {
    setDrawerRef({ modIdx, secIdx, qIdx });
    setDrawerOpen(true);
  }, []);

  // Open modal (add)
  const openAddModal = useCallback(() => {
    setEditingRef(null);
    setEditQuestion('');
    setEditNumber(0);
    setEditType(allTypes[0] || '');
    setEditModule(currentModuleId || data.modules[0]?.moduleId || '');
    setEditSection(0);
    setModalOpen(true);
  }, [allTypes, currentModuleId, data.modules]);

  // Open modal (edit)
  const openEditModal = useCallback((modIdx: number, secIdx: number, qIdx: number) => {
    const mod = data.modules[modIdx];
    const q = mod.sections[secIdx].questions[qIdx];
    setEditingRef({ modIdx, secIdx, qIdx });
    setEditModule(mod.moduleId);
    setEditSection(secIdx);
    setEditQuestion(q.question);
    setEditNumber(q.number);
    setEditType(q.type);
    setModalOpen(true);
  }, [data.modules]);

  // Save question
  const saveQuestion = useCallback(() => {
    if (!editQuestion.trim()) { alert('Please enter question text'); return; }
    setData(prev => {
      const next = JSON.parse(JSON.stringify(prev)) as QuestionLibraryData;
      const mod = next.modules.find(m => m.moduleId === editModule);
      if (!mod) return prev;
      if (editingRef) {
        mod.sections[editSection].questions[editingRef.qIdx] = { number: editNumber, question: editQuestion.trim(), type: editType };
      } else {
        mod.sections[editSection].questions.push({ number: editNumber || mod.sections[editSection].questions.length + 1, question: editQuestion.trim(), type: editType });
      }
      return next;
    });
    showToast(editingRef ? 'Question updated successfully' : 'Question added successfully');
    setModalOpen(false);
  }, [editModule, editSection, editQuestion, editNumber, editType, editingRef, showToast]);

  // Delete question
  const deleteQuestion = useCallback((modIdx: number, secIdx: number, qIdx: number) => {
    if (!confirm('Delete this question? This cannot be undone.')) return;
    setData(prev => {
      const next = JSON.parse(JSON.stringify(prev)) as QuestionLibraryData;
      next.modules[modIdx].sections[secIdx].questions.splice(qIdx, 1);
      return next;
    });
    showToast('Question deleted');
  }, [showToast]);

  // Get sections for selected edit module
  const editModSections = data.modules.find(m => m.moduleId === editModule)?.sections || [];

  // Determine what to render
  const isSearch = !!(searchQuery || typeFilter);
  const currentMod = currentModuleId ? data.modules.find(m => m.moduleId === currentModuleId) : null;
  const currentModIdx = currentMod ? data.modules.indexOf(currentMod) : -1;

  // Search results
  const searchResults = isSearch ? (() => {
    const q = searchQuery.toLowerCase();
    const results: { mod: QuestionModule; modIdx: number; secIdx: number; question: QuestionItem; qIdx: number }[] = [];
    data.modules.forEach((mod, modIdx) => {
      mod.sections.forEach((sec, secIdx) => {
        sec.questions.forEach((question, qIdx) => {
          const matchText = !q || question.question.toLowerCase().includes(q);
          const matchType = !typeFilter || question.type === typeFilter;
          if (matchText && matchType) results.push({ mod, modIdx, secIdx, question, qIdx });
        });
      });
    });
    return results;
  })() : [];

  // Sorted modules for sidebar
  const sortedModules = [...data.modules].sort((a, b) => a.moduleName.localeCompare(b.moduleName));
  const filteredModules = sidebarFilter
    ? sortedModules.filter(m => m.moduleName.toLowerCase().includes(sidebarFilter.toLowerCase()))
    : sortedModules;

  // Drawer question data
  const drawerQ = drawerRef ? (() => {
    const mod = data.modules[drawerRef.modIdx];
    const sec = mod.sections[drawerRef.secIdx];
    const q = sec.questions[drawerRef.qIdx];
    return { mod, sec, q };
  })() : null;

  return (
    <div className="ql-root">
      {/* ─── HEADER ─── */}
      <header className="ql-header">
        <div className="ql-logo">CLUES&trade;<span>Question Library</span></div>
        <div className="ql-header-divider" />
        <div className="ql-search-wrap">
          <span className="ql-search-icon" aria-hidden="true">{'\u2315'}</span>
          <input
            type="text"
            id="ql-search-input"
            className="ql-search-input"
            aria-label="Search questions across all modules"
            placeholder="Search 2,500+ questions across all modules\u2026"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          className="ql-type-filter"
          aria-label="Filter by response type"
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
        >
          <option value="">All Response Types</option>
          {allTypes.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <div className="ql-header-stats">
          <div className="ql-stat-chip"><strong>{data.modules.length}</strong> Modules</div>
          <div className="ql-stat-chip"><strong>{totalQuestions.toLocaleString()}</strong> Questions</div>
          <div className="ql-stat-chip"><strong>{isSearch ? searchResults.length.toLocaleString() : '\u2014'}</strong> Shown</div>
        </div>
        <button className="ql-add-btn" onClick={openAddModal}>{'\uFF0B'} Add Question</button>
      </header>

      <div className="ql-layout">
        {/* ─── SIDEBAR ─── */}
        <aside className="ql-sidebar" aria-label="Module navigation">
          <div className="ql-sidebar-header">
            <h3>Modules</h3>
            <input
              type="text"
              className="ql-sidebar-search"
              aria-label="Filter modules"
              placeholder="Filter modules\u2026"
              value={sidebarFilter}
              onChange={e => setSidebarFilter(e.target.value)}
            />
          </div>
          <div className="ql-module-list">
            {filteredModules.map(m => {
              const totalQ = m.sections.reduce((s, sec) => s + sec.questions.length, 0);
              const isActive = currentModuleId === m.moduleId;
              return (
                <div key={m.moduleId}>
                  <button
                    className={`ql-module-btn${isActive ? ' active' : ''}`}
                    onClick={() => selectModule(m.moduleId)}
                  >
                    <span className="ql-module-icon" aria-hidden="true">{MODULE_ICONS[m.moduleId] || '\u{1F4CB}'}</span>
                    <span className="ql-module-name">{m.moduleName}</span>
                    <span className="ql-module-count">{totalQ}</span>
                  </button>
                  {isActive && (
                    <div className="ql-section-list" style={{ display: 'block' }}>
                      {m.sections.map((s, idx) => (
                        <button
                          key={idx}
                          className={`ql-section-link${currentSectionIdx === idx ? ' active' : ''}`}
                          aria-label={`Go to ${s.title} section`}
                          onClick={e => { e.stopPropagation(); selectModule(m.moduleId, idx); }}
                        >
                          {s.title}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </aside>

        {/* ─── MAIN ─── */}
        <main className="ql-main">
          <div className="ql-breadcrumb">
            <span>
              {isSearch ? 'Search Results' : currentMod ? currentMod.moduleName : 'All Modules'}
            </span>
            {!isSearch && currentMod && currentSectionIdx !== null && (
              <> {'\u203A'} <span>{currentMod.sections[currentSectionIdx].title}</span></>
            )}
          </div>
          <div className="ql-content-area">
            {/* Results info for search */}
            {isSearch && (
              <div className="ql-results-info">
                Found <span>{searchResults.length.toLocaleString()}</span> questions
                {searchQuery && <> matching &ldquo;<strong style={{ color: 'var(--ql-text-primary)' }}>{searchQuery}</strong>&rdquo;</>}
                {typeFilter && <> of type <strong style={{ color: 'var(--ql-text-primary)' }}>{typeFilter}</strong></>}
              </div>
            )}

            {/* DASHBOARD VIEW */}
            {!isSearch && !currentMod && (
              <div className="ql-dashboard-grid">
                {sortedModules.map(m => {
                  const totalQ = m.sections.reduce((s, sec) => s + sec.questions.length, 0);
                  return (
                    <div
                      key={m.moduleId}
                      className="ql-dashboard-card"
                      role="button"
                      tabIndex={0}
                      aria-label={`View ${m.moduleName} module, ${totalQ} questions`}
                      onClick={() => selectModule(m.moduleId)}
                      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectModule(m.moduleId); } }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                        <span style={{ fontSize: '28px' }} aria-hidden="true">{MODULE_ICONS[m.moduleId] || '\u{1F4CB}'}</span>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--ql-text-primary)' }}>{m.moduleName}</div>
                          <div style={{ fontSize: '11px', color: 'var(--ql-text-muted)' }}>{m.sections.length} sections</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '24px', fontWeight: 700, color: 'var(--ql-gold)', fontFamily: "'Cinzel', serif" }}>{totalQ}</span>
                        <span style={{ fontSize: '11px', color: 'var(--ql-text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Questions</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* MODULE VIEW */}
            {!isSearch && currentMod && (
              <ModuleView
                mod={currentMod}
                modIdx={currentModIdx}
                onlySection={currentSectionIdx}
                searchQuery={searchQuery}
                collapsedSections={collapsedSections}
                onToggleSection={toggleSection}
                onOpenDrawer={openDrawer}
                onEdit={openEditModal}
                onDelete={deleteQuestion}
                onSelectModule={selectModule}
                moduleIcons={MODULE_ICONS}
              />
            )}

            {/* SEARCH RESULTS VIEW */}
            {isSearch && searchResults.length === 0 && (
              <div className="ql-empty-state">
                <div className="ql-icon">{'\u{1F50D}'}</div>
                <h3>No questions found</h3>
                <p>Try a different search term or filter</p>
              </div>
            )}
            {isSearch && searchResults.length > 0 && (
              <SearchResults
                results={searchResults}
                searchQuery={searchQuery}
                collapsedSections={collapsedSections}
                onToggleSection={toggleSection}
                onOpenDrawer={openDrawer}
                onEdit={openEditModal}
                onDelete={deleteQuestion}
                moduleIcons={MODULE_ICONS}
              />
            )}
          </div>
        </main>
      </div>

      {/* ─── DETAIL DRAWER ─── */}
      <div className={`ql-detail-drawer${drawerOpen ? ' open' : ''}`} role="dialog" aria-label="Question detail" aria-modal="false">
        <div className="ql-drawer-header">
          <h3>Question Detail</h3>
          <button className="ql-drawer-close" aria-label="Close question detail" onClick={() => setDrawerOpen(false)}>{'\u2715'}</button>
        </div>
        <div className="ql-drawer-content">
          {drawerQ && (
            <>
              <div className="ql-detail-q-num">Module: <strong>{drawerQ.mod.moduleName}</strong> {'\u203A'} {drawerQ.sec.title}</div>
              <div className="ql-detail-q-text">{drawerQ.q.question}</div>
              <div className="ql-detail-meta-row">
                <div className="ql-detail-meta-item">
                  <span className="ql-detail-meta-label">Question #</span>
                  <span className="ql-detail-meta-value" style={{ color: 'var(--ql-gold)' }}>Q{drawerQ.q.number}</span>
                </div>
                <div className="ql-detail-meta-item">
                  <span className="ql-detail-meta-label">Type</span>
                  <span className="ql-detail-meta-value">
                    <span className={`ql-type-badge ${getBadgeClass(drawerQ.q.type)}`}>{drawerQ.q.type}</span>
                  </span>
                </div>
              </div>
              <div className="ql-detail-section-title">Answer Structure</div>
              <div className="ql-detail-answer-container">
                <AnswerPreview type={drawerQ.q.type} />
              </div>
            </>
          )}
        </div>
        <div className="ql-drawer-actions">
          <button
            className="ql-drawer-edit-btn"
            onClick={() => {
              if (drawerRef) {
                setDrawerOpen(false);
                openEditModal(drawerRef.modIdx, drawerRef.secIdx, drawerRef.qIdx);
              }
            }}
          >
            Edit Question
          </button>
        </div>
      </div>

      {/* ─── MODAL ─── */}
      <div
        className={`ql-modal-overlay${modalOpen ? ' open' : ''}`}
        onClick={e => { if (e.target === e.currentTarget) setModalOpen(false); }}
      >
        <div className="ql-modal">
          <div className="ql-modal-header">
            <h2>{editingRef ? 'Edit Question' : 'Add New Question'}</h2>
            <button className="ql-modal-close" aria-label="Close modal" onClick={() => setModalOpen(false)}>{'\u2715'}</button>
          </div>
          <div className="ql-modal-body">
            <div className="ql-form-row-2">
              <div className="ql-form-row">
                <label>Module</label>
                <select value={editModule} onChange={e => { setEditModule(e.target.value); setEditSection(0); }}>
                  {sortedModules.map(m => <option key={m.moduleId} value={m.moduleId}>{m.moduleName}</option>)}
                </select>
              </div>
              <div className="ql-form-row">
                <label>Section</label>
                <select value={editSection} onChange={e => setEditSection(parseInt(e.target.value))}>
                  {editModSections.map((s, i) => <option key={i} value={i}>{s.title}</option>)}
                </select>
              </div>
            </div>
            <div className="ql-form-row">
              <label>Question Text</label>
              <textarea value={editQuestion} onChange={e => setEditQuestion(e.target.value)} placeholder="Enter the question text..." />
            </div>
            <div className="ql-form-row-2">
              <div className="ql-form-row">
                <label>Question Number</label>
                <input type="number" value={editNumber || ''} onChange={e => setEditNumber(parseInt(e.target.value) || 0)} />
              </div>
              <div className="ql-form-row">
                <label>Response Type</label>
                <select value={editType} onChange={e => setEditType(e.target.value)}>
                  {allTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="ql-answer-preview">
              <h4>Answer Preview</h4>
              <AnswerPreview type={editType} />
            </div>
          </div>
          <div className="ql-modal-footer">
            <button className="ql-btn-cancel" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="ql-btn-save" onClick={saveQuestion}>
              {editingRef ? 'Update Question' : 'Add Question'}
            </button>
          </div>
        </div>
      </div>

      {/* ─── TOAST ─── */}
      <div className={`ql-toast${toast ? ' show' : ''}`} role="status" aria-live="polite">
        <span className="ql-toast-icon" aria-hidden="true">{'\u2713'}</span>
        <span>{toast}</span>
      </div>
    </div>
  );
}

// ─── MODULE VIEW SUB-COMPONENT ───
function ModuleView({
  mod, modIdx, onlySection, searchQuery, collapsedSections,
  onToggleSection, onOpenDrawer, onEdit, onDelete, onSelectModule, moduleIcons,
}: {
  mod: QuestionModule;
  modIdx: number;
  onlySection: number | null;
  searchQuery: string;
  collapsedSections: Set<string>;
  onToggleSection: (key: string) => void;
  onOpenDrawer: (m: number, s: number, q: number) => void;
  onEdit: (m: number, s: number, q: number) => void;
  onDelete: (m: number, s: number, q: number) => void;
  onSelectModule: (id: string, sec?: number | null) => void;
  moduleIcons: Record<string, string>;
}) {
  const totalQ = mod.sections.reduce((s, sec) => s + sec.questions.length, 0);
  const sectionsToRender = onlySection !== null ? [mod.sections[onlySection]] : mod.sections;

  return (
    <>
      {/* Module header card */}
      <div className="ql-module-header">
        <div className="ql-mh-left">
          <h2><span aria-hidden="true">{moduleIcons[mod.moduleId] || '\u{1F4CB}'}</span> {mod.moduleName}</h2>
          <p>{mod.structure || mod.fileName || ''}</p>
        </div>
        <div className="ql-mh-stats">
          <div className="ql-mh-stat"><span className="ql-mh-stat-val">{totalQ}</span><span className="ql-mh-stat-lbl">Questions</span></div>
          <div className="ql-mh-stat"><span className="ql-mh-stat-val">{mod.sections.length}</span><span className="ql-mh-stat-lbl">Sections</span></div>
        </div>
      </div>

      {/* Section nav pills */}
      <div className="ql-section-nav-pills">
        <button
          className={`ql-section-pill${onlySection === null ? ' active' : ''}`}
          onClick={() => onSelectModule(mod.moduleId)}
        >All Sections</button>
        {mod.sections.map((s, idx) => (
          <button
            key={idx}
            className={`ql-section-pill${onlySection === idx ? ' active' : ''}`}
            onClick={() => onSelectModule(mod.moduleId, idx)}
          >{s.title}</button>
        ))}
      </div>

      {/* Sections + questions */}
      {sectionsToRender.map((sec, relIdx) => {
        const secIdx = onlySection !== null ? onlySection : relIdx;
        const collapseKey = `${mod.moduleId}-${secIdx}`;
        const isCollapsed = collapsedSections.has(collapseKey);
        return (
          <div key={secIdx} className="ql-section-block">
            <div
              className={`ql-section-heading${isCollapsed ? ' collapsed' : ''}`}
              role="button"
              tabIndex={0}
              aria-expanded={!isCollapsed}
              onClick={() => onToggleSection(collapseKey)}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggleSection(collapseKey); } }}
            >
              <h3>{sec.title}</h3>
              <span className="ql-section-num">{sec.questions.length} Questions</span>
              <span className="ql-section-toggle" aria-hidden="true">{'\u25BE'}</span>
            </div>
            <div className={`ql-questions-grid${isCollapsed ? ' hidden' : ''}`}>
              {sec.questions.map((q, qIdx) => (
                <QuestionCard
                  key={qIdx}
                  q={q}
                  modIdx={modIdx}
                  secIdx={secIdx}
                  qIdx={qIdx}
                  searchQuery={searchQuery}
                  onOpen={onOpenDrawer}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </div>
          </div>
        );
      })}
    </>
  );
}

// ─── SEARCH RESULTS SUB-COMPONENT ───
function SearchResults({
  results, searchQuery, collapsedSections,
  onToggleSection, onOpenDrawer, onEdit, onDelete, moduleIcons,
}: {
  results: { mod: QuestionModule; modIdx: number; secIdx: number; question: QuestionItem; qIdx: number }[];
  searchQuery: string;
  collapsedSections: Set<string>;
  onToggleSection: (key: string) => void;
  onOpenDrawer: (m: number, s: number, q: number) => void;
  onEdit: (m: number, s: number, q: number) => void;
  onDelete: (m: number, s: number, q: number) => void;
  moduleIcons: Record<string, string>;
}) {
  // Group by module
  const byMod: Record<string, { mod: QuestionModule; modIdx: number; items: typeof results }> = {};
  results.forEach(r => {
    if (!byMod[r.mod.moduleId]) byMod[r.mod.moduleId] = { mod: r.mod, modIdx: r.modIdx, items: [] };
    byMod[r.mod.moduleId].items.push(r);
  });

  return (
    <>
      {Object.values(byMod).map(({ mod, modIdx, items }) => {
        const collapseKey = `search-${mod.moduleId}`;
        const isCollapsed = collapsedSections.has(collapseKey);
        return (
          <div key={mod.moduleId} className="ql-section-block">
            <div
              className={`ql-section-heading${isCollapsed ? ' collapsed' : ''}`}
              role="button"
              tabIndex={0}
              aria-expanded={!isCollapsed}
              onClick={() => onToggleSection(collapseKey)}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggleSection(collapseKey); } }}
            >
              <h3><span aria-hidden="true">{moduleIcons[mod.moduleId] || '\u{1F4CB}'}</span> {mod.moduleName}</h3>
              <span className="ql-section-num">{items.length} match{items.length !== 1 ? 'es' : ''}</span>
              <span className="ql-section-toggle" aria-hidden="true">{'\u25BE'}</span>
            </div>
            <div className={`ql-questions-grid${isCollapsed ? ' hidden' : ''}`}>
              {items.map(({ question, secIdx, qIdx }, i) => (
                <QuestionCard
                  key={i}
                  q={question}
                  modIdx={modIdx}
                  secIdx={secIdx}
                  qIdx={qIdx}
                  searchQuery={searchQuery}
                  onOpen={onOpenDrawer}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </div>
          </div>
        );
      })}
    </>
  );
}

// ─── QUESTION CARD SUB-COMPONENT ───
function QuestionCard({
  q, modIdx, secIdx, qIdx, searchQuery,
  onOpen, onEdit, onDelete,
}: {
  q: QuestionItem;
  modIdx: number;
  secIdx: number;
  qIdx: number;
  searchQuery: string;
  onOpen: (m: number, s: number, q: number) => void;
  onEdit: (m: number, s: number, q: number) => void;
  onDelete: (m: number, s: number, q: number) => void;
}) {
  const badge = getBadgeClass(q.type);
  return (
    <div
      className="ql-q-card"
      role="button"
      tabIndex={0}
      aria-label={`View question Q${q.number}: ${q.question}`}
      onClick={() => onOpen(modIdx, secIdx, qIdx)}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(modIdx, secIdx, qIdx); } }}
    >
      <div className="ql-q-num" aria-hidden="true">Q{q.number}</div>
      <div className="ql-q-body">
        <div className="ql-q-text">{highlightText(q.question, searchQuery)}</div>
        <div className="ql-q-meta">
          <span className={`ql-type-badge ${badge}`}>{q.type}</span>
        </div>
      </div>
      <div className="ql-q-actions">
        <button className="ql-q-action-btn" aria-label={`Edit question Q${q.number}`} onClick={e => { e.stopPropagation(); onEdit(modIdx, secIdx, qIdx); }}>
          {'\u270E'} Edit
        </button>
        <button className="ql-q-action-btn delete" aria-label={`Delete question Q${q.number}`} onClick={e => { e.stopPropagation(); onDelete(modIdx, secIdx, qIdx); }}>
          {'\u2715'}
        </button>
      </div>
    </div>
  );
}
