import { useState, useRef, useCallback, useId, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import {
  FileSpreadsheet,
  CheckSquare,
  Square,
  MessageSquare,
  Send,
  X,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Users,
  Zap,
  BarChart3,
  RefreshCw,
  Eye,
  EyeOff,
  LayoutTemplate,
} from 'lucide-react';
import { massMessageService, MassMessageResult, MassMessageHistoryEntry, TemplateVarMapping } from '../services/mass-message.service';
import { socketService } from '../services/socket.service';
import { useTheme } from '../contexts/ThemeContext';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Student {
  id: string;
  rm: string;
  name: string;
  turma: string;
  email: string;
  phone: string;
  status: string;
  phoneValid: boolean;
}

type Step = 'upload' | 'compose' | 'sending' | 'results';

interface ActiveTemplate {
  name: string;
  language: string;
  body: string;
  variables: number[];
}

const STUDENT_FIELDS: { key: string; label: string }[] = [
  { key: 'name', label: 'Nome do Aluno' },
  { key: 'turma', label: 'Turma' },
  { key: 'rm', label: 'RM / RA' },
  { key: 'status', label: 'Status' },
  { key: 'email', label: 'E-mail' },
];

interface SendResults {
  successCount: number;
  failureCount: number;
  total: number;
  results: MassMessageResult[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function normalizeSinglePhone(part: string): { phone: string; valid: boolean } {
  const digits = part.replace(/\D/g, '');
  if (!digits) return { phone: '', valid: false };

  let normalized = digits;
  if (normalized.startsWith('55') && normalized.length >= 12) {
    // already in international format
  } else if (normalized.length === 11) {
    normalized = '55' + normalized;
  } else if (normalized.length === 10) {
    normalized = '55' + normalized;
  } else {
    return { phone: digits, valid: false };
  }

  return { phone: normalized, valid: true };
}

function normalizePhone(raw: unknown): { phone: string; valid: boolean } {
  if (!raw) return { phone: '', valid: false };
  const str = String(raw).trim();
  if (!str) return { phone: '', valid: false };

  // Split by common separators — cells sometimes contain 2 numbers (e.g. "11 9xxxx / 11 9yyyy")
  const parts = str.split(/[\/\\\n\r;,|]+/).map((p) => p.trim()).filter(Boolean);

  for (const part of parts) {
    const result = normalizeSinglePhone(part);
    if (result.valid) return result;
  }

  // None valid — return best-effort (first part digits) so display isn't a concat mess
  const fallback = (parts[0] ?? str).replace(/\D/g, '');
  return { phone: fallback, valid: false };
}

// ─── Robust column matching ───────────────────────────────────────────────────

/** Normaliza um nome de coluna: lowercase, sem acentos, sem pontuação/espaços.
 *  Ex: "E-mail" → "email", "Contato Aluno" → "contatoaluno", "R.A." → "ra" */
function normKey(s: string): string {
  return String(s)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos: é→e, ã→a, ç→c
    .replace(/[^a-z0-9]/g, '');      // remove tudo que não é letra/dígito
}

/** Busca um valor na linha usando lista de candidatos normalizados.
 *  Primeiro tenta match exato normalizado; depois startsWith (lida com sufixos
 *  como "_1" que o xlsx adiciona em colunas duplicadas). */
function findCol(normRow: Map<string, unknown>, candidates: string[]): unknown {
  for (const c of candidates) {
    if (normRow.has(c)) return normRow.get(c);
  }
  for (const c of candidates) {
    for (const [k, v] of normRow) {
      if (k.startsWith(c) || c.startsWith(k)) return v;
    }
  }
  return '';
}

function parseFile(buffer: ArrayBuffer, fileName: string): Student[] {
  let wb: ReturnType<typeof XLSX.read>;

  if (/\.csv$/i.test(fileName)) {
    // UTF-8 decode first, then parse as CSV string
    const text = new TextDecoder('utf-8').decode(buffer);
    wb = XLSX.read(text, { type: 'string' });
  } else {
    wb = XLSX.read(buffer, { type: 'array' });
  }

  const sheetName = wb.SheetNames[0] ?? '';
  const ws = wb.Sheets[sheetName];
  if (!ws) return [];

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });
  const students: Student[] = [];

  rows.forEach((row, idx) => {
    // Constrói mapa normalizado para esta linha
    const normRow = new Map<string, unknown>();
    for (const [k, v] of Object.entries(row)) {
      normRow.set(normKey(k), v);
    }

    const phoneRaw = findCol(normRow, [
      'telefone', 'fone', 'celular', 'tel',
      'contatoaluno', 'contato', 'whatsapp',
    ]);
    const { phone, valid } = normalizePhone(phoneRaw);

    students.push({
      id: `row-${idx}`,
      rm:     String(findCol(normRow, ['ra', 'rm', 'matricula', 'registro', 'cod'])),
      name:   String(findCol(normRow, ['nome', 'aluno', 'nomealuno', 'nomecompl', 'nomecomplet', 'nomecompleto'])),
      turma:  String(findCol(normRow, ['turma', 'classe', 'serie', 'turno', 'curso'])),
      email:  String(findCol(normRow, ['email', 'emailaluno', 'emailresponsavel', 'correio'])),
      phone,
      status: String(findCol(normRow, ['status', 'situacao', 'situacaoaluno', 'situacaomatricula'])),
      phoneValid: valid,
    });
  });

  return students.filter((s) => s.name || s.rm);
}

function interpolatePreview(template: string, student: Student): string {
  return template
    .replace(/\{nome\}/gi, student.name || '{nome}')
    .replace(/\{turma\}/gi, student.turma || '{turma}')
    .replace(/\{rm\}/gi, student.rm || '{rm}')
    .replace(/\{status\}/gi, student.status || '{status}')
    .replace(/\{email\}/gi, student.email || '{email}');
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function VariableChip({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold transition-all duration-150"
      style={{
        background: 'rgba(16,185,129,0.12)',
        color: '#34d399',
        border: '1px solid rgba(16,185,129,0.25)',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = 'rgba(16,185,129,0.22)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = 'rgba(16,185,129,0.12)';
      }}
    >
      {label}
    </button>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  color: string;
}) {
  return (
    <div className="rounded-xl p-4 flex items-center gap-3 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.07]">
      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}20` }}>
        <Icon size={16} style={{ color }} />
      </div>
      <div>
        <p className="text-xs text-slate-500 font-medium">{label}</p>
        <p className="text-lg font-bold text-slate-900 dark:text-white leading-tight">{value}</p>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MassMessage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const uid = useId();
  const location = useLocation();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState<ActiveTemplate | null>(null);
  const [variableMapping, setVariableMapping] = useState<TemplateVarMapping>({});

  const [sendResults, setSendResults] = useState<SendResults | null>(null);
  const [previewStudent, setPreviewStudent] = useState<Student | null>(null);
  const [showInvalid, setShowInvalid] = useState(false);
  const [expandedResult, setExpandedResult] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'send' | 'history'>('send');
  const [sendProgress, setSendProgress] = useState<{ sent: number; total: number } | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [history, setHistory] = useState<MassMessageHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Load history from DB when history tab is opened
  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const data = await massMessageService.getHistory();
      setHistory(data);
    } catch {
      // ignore
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'history') fetchHistory();
  }, [activeTab, fetchHistory]);

  // Receive template from Templates page navigation
  useEffect(() => {
    const state = location.state as { template?: ActiveTemplate } | null;
    if (state?.template) {
      setActiveTemplate(state.template);
      // Build default variable mapping: {{1}} → name, {{2}} → turma, etc.
      const defaults: TemplateVarMapping = {};
      const fields = ['name', 'turma', 'rm', 'status', 'email'];
      state.template.variables.forEach((idx, i) => {
        defaults[idx] = fields[i] ?? 'name';
      });
      setVariableMapping(defaults);
    }
  }, [location.state]);

  const validStudents = students.filter((s) => s.phoneValid);
  const invalidStudents = students.filter((s) => !s.phoneValid);

  const selectedStudents = students.filter((s) => selected.has(s.id) && s.phoneValid);

  // ── File handling ────────────────────────────────────────────────────────

  const processFile = useCallback((file: File) => {
    if (!file.name.match(/\.(xls|xlsx|csv)$/i)) {
      setSendError('Formato não suportado. Envie um arquivo .xls, .xlsx ou .csv');
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        const parsed = parseFile(buffer, file.name);
        if (parsed.length === 0) {
          setSendError(
            'Nenhum aluno encontrado no arquivo. Verifique se as colunas Nome/Aluno e RA/RM existem e têm dados.',
          );
          return;
        }
        setStudents(parsed);
        setSelected(new Set(parsed.filter((s) => s.phoneValid).map((s) => s.id)));
        setSendError(null);
        setStep('compose');
      } catch (err) {
        setSendError(
          'Erro ao ler o arquivo: ' + (err instanceof Error ? err.message : 'formato inválido'),
        );
      }
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile],
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
    },
    [processFile],
  );

  // ── Selection ────────────────────────────────────────────────────────────

  const toggleSelect = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    const validIds = validStudents.map((s) => s.id);
    setSelected((prev) => {
      const allSelected = validIds.every((id) => prev.has(id));
      if (allSelected) return new Set();
      return new Set(validIds);
    });
  }, [validStudents]);

  // ── Message ──────────────────────────────────────────────────────────────

  const insertVariable = useCallback((variable: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    setMessage((prev) => prev.slice(0, start) + variable + prev.slice(end));
    setTimeout(() => {
      ta.focus();
      ta.selectionStart = ta.selectionEnd = start + variable.length;
    }, 0);
  }, []);

  // ── Send ─────────────────────────────────────────────────────────────────

  const handleSend = useCallback(async () => {
    if (selectedStudents.length === 0) return;
    if (!activeTemplate && !message.trim()) return;
    setConfirmOpen(false);
    setStep('sending');
    setSendProgress({ sent: 0, total: selectedStudents.length });
    setSendError(null);

    const contacts = selectedStudents.map((s) => ({
      phone: s.phone,
      name: s.name,
      rm: s.rm,
      turma: s.turma,
      email: s.email,
      status: s.status,
    }));

    // Subscribe to socket progress
    const onProgress = (data: unknown) => {
      const p = data as { sent: number; total: number };
      setSendProgress(p);
    };
    socketService.on('mass_message_progress', onProgress);

    try {
      let results;
      if (activeTemplate) {
        results = await massMessageService.sendTemplate(
          contacts,
          activeTemplate.name,
          variableMapping,
          activeTemplate.language,
        );
      } else {
        results = await massMessageService.send(contacts, message.trim());
      }

      socketService.off('mass_message_progress', onProgress);

      // Refresh history from DB (backend saved it)
      massMessageService.getHistory().then(setHistory).catch(() => {});

      setSendResults(results);
      setSendProgress(null);
      setStep('results');
    } catch (err) {
      socketService.off('mass_message_progress', onProgress);
      setSendProgress(null);
      const msg = err instanceof Error ? err.message : 'Erro desconhecido';
      setSendError(msg);
      setStep('compose');
    }
  }, [message, selectedStudents, activeTemplate, variableMapping]);

  const handleClearTemplate = useCallback(() => {
    setActiveTemplate(null);
    setVariableMapping({});
    navigate('.', { replace: true, state: null });
  }, [navigate]);

  const handleReset = useCallback(() => {
    setStep('upload');
    setStudents([]);
    setSelected(new Set());
    setMessage('');
    setFileName('');
    setSendResults(null);
    setPreviewStudent(null);
    setActiveTemplate(null);
    setVariableMapping({});
    setSendError(null);
    setSendProgress(null);
    navigate('.', { replace: true, state: null });
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [navigate]);

  // ── Render ───────────────────────────────────────────────────────────────

  const allValidSelected =
    validStudents.length > 0 && validStudents.every((s) => selected.has(s.id));
  const someSelected =
    validStudents.some((s) => selected.has(s.id)) && !allValidSelected;

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-white dark:bg-[#0B1120] text-slate-800 dark:text-slate-200">
      {/* ── Header ── */}
      <div className="shrink-0 px-6 py-5 flex items-center justify-between border-b border-slate-200 dark:border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg"
            style={{ background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 0 20px rgba(16,185,129,0.3)' }}
          >
            <Zap size={16} className="text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900 dark:text-white tracking-wide">Envio em Massa</h1>
            <p className="text-[11px] text-slate-500">WhatsApp · Alunos</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.07]">
          {(['send', 'history'] as const).map((tab) => {
            const labels = { send: 'Novo Envio', history: `Histórico${history.length ? ` (${history.length})` : ''}` };
            const active = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-150"
                style={{
                  background: active ? 'rgba(16,185,129,0.15)' : 'transparent',
                  color: active ? '#34d399' : '#64748b',
                  border: active ? '1px solid rgba(16,185,129,0.3)' : '1px solid transparent',
                }}
              >
                {labels[tab]}
              </button>
            );
          })}
        </div>

        {/* Step indicator */}
        <div className="hidden sm:flex items-center gap-1.5">
          {(['upload', 'compose', 'results'] as const).map((s, i) => {
            const labels = ['Importar', 'Compor', 'Resultado'];
            const stepOrder: Step[] = ['upload', 'compose', 'sending', 'results'];
            const currentIdx = stepOrder.indexOf(step);
            const thisIdx = ['upload', 'compose', 'results'].indexOf(s);
            const active = s === step || (s === 'results' && step === 'sending');
            const done =
              (s === 'upload' && currentIdx >= 1) ||
              (s === 'compose' && currentIdx >= 3);

            return (
              <div key={s} className="flex items-center gap-1.5">
                {i > 0 && (
                  <div
                    className="w-6 h-px"
                    style={{ background: done ? '#10b981' : (isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0') }}
                  />
                )}
                <div className="flex items-center gap-1">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-300"
                    style={{
                      background: done ? '#10b981' : active ? 'rgba(16,185,129,0.2)' : (isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9'),
                      border: active ? '1px solid #10b981' : (isDark ? '1px solid transparent' : '1px solid #e2e8f0'),
                      color: done ? 'white' : active ? '#10b981' : '#64748b',
                    }}
                  >
                    {done ? '✓' : i + 1}
                  </div>
                  <span className="text-[11px] font-medium" style={{ color: active ? (isDark ? '#e2e8f0' : '#1e293b') : '#64748b' }}>
                    {labels[thisIdx]}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex-1 p-6 space-y-5">

        {/* ═══════════════════════════════════════════════════════════════
            STEP: UPLOAD
        ═══════════════════════════════════════════════════════════════ */}
        {activeTab === 'send' && step === 'upload' && (
          <div className="max-w-2xl mx-auto pt-8 space-y-4">
            {/* Error banner */}
            {sendError && (
              <div
                className="flex items-start gap-3 rounded-xl px-4 py-3"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}
              >
                <XCircle size={15} style={{ color: '#f87171' }} className="shrink-0 mt-0.5" />
                <p className="text-xs text-red-400 flex-1">{sendError}</p>
                <button onClick={() => setSendError(null)} className="text-slate-600 hover:text-slate-400 shrink-0">
                  <X size={13} />
                </button>
              </div>
            )}
            {/* Drop zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="relative rounded-2xl cursor-pointer transition-all duration-300 flex flex-col items-center justify-center gap-4 py-16 px-8"
              style={{
                border: isDragging ? '2px dashed #10b981' : (isDark ? '2px dashed rgba(255,255,255,0.1)' : '2px dashed #e2e8f0'),
                background: isDragging ? 'rgba(16,185,129,0.05)' : (isDark ? 'rgba(255,255,255,0.02)' : '#f8fafc'),
                boxShadow: isDragging ? '0 0 40px rgba(16,185,129,0.1) inset' : 'none',
              }}
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300"
                style={{
                  background: isDragging ? 'rgba(16,185,129,0.2)' : (isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9'),
                  border: isDragging ? '1px solid rgba(16,185,129,0.4)' : (isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0'),
                }}
              >
                <FileSpreadsheet size={28} style={{ color: isDragging ? '#10b981' : '#64748b' }} />
              </div>

              <div className="text-center">
                <p className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
                  {isDragging ? 'Solte o arquivo aqui' : 'Arraste sua planilha ou clique para selecionar'}
                </p>
                <p className="text-xs text-slate-500">Formatos aceitos: .xls, .xlsx, .csv</p>
              </div>

              <div
                className="px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-150"
                style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)' }}
              >
                Selecionar arquivo
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".xls,.xlsx,.csv"
                className="hidden"
                id={uid}
                onChange={handleFileChange}
              />
            </div>

            {/* Column reference */}
            <div className="rounded-xl p-4 bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06]">
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">
                Colunas reconhecidas automaticamente
              </p>

              {/* Key fields with accepted names */}
              <div className="space-y-2 mb-3">
                {[
                  { field: 'Nome / Aluno', accepts: 'Nome, Aluno, Nome Aluno, Nome Completo' },
                  { field: 'Telefone', accepts: 'Telefone, Fone, Celular, Tel, Contato Aluno, WhatsApp' },
                  { field: 'RA / RM', accepts: 'RA, RM, Matrícula, Registro, Cod' },
                  { field: 'Turma', accepts: 'Turma, Classe, Serie, Curso' },
                  { field: 'E-mail', accepts: 'E-mail, Email, E-Mail' },
                  { field: 'Status', accepts: 'Status, Situação, Situação Aluno' },
                ].map(({ field, accepts }) => (
                  <div key={field} className="flex items-baseline gap-2">
                    <span
                      className="text-[11px] font-bold shrink-0 px-1.5 py-0.5 rounded"
                      style={{ background: 'rgba(16,185,129,0.12)', color: '#34d399', border: '1px solid rgba(16,185,129,0.2)' }}
                    >
                      {field}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-600 leading-relaxed">{accepts}</span>
                  </div>
                ))}
              </div>

              <p className="text-[10px] text-slate-400 dark:text-slate-600 mt-2">
                A detecção ignora maiúsculas, minúsculas, acentos e pontuação — funciona mesmo após salvar no Excel.
                Aceita .xls, .xlsx e .csv.
              </p>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            STEP: COMPOSE
        ═══════════════════════════════════════════════════════════════ */}
        {activeTab === 'send' && step === 'compose' && (
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-5 h-full">

            {/* Left: Student table */}
            <div className="flex flex-col gap-4 min-h-0">
              {/* Error banner */}
              {sendError && (
                <div
                  className="flex items-start gap-3 rounded-xl px-4 py-3"
                  style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}
                >
                  <XCircle size={15} style={{ color: '#f87171' }} className="shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-red-400">Erro no envio</p>
                    <p className="text-[11px] text-slate-400 mt-0.5 break-all">{sendError}</p>
                    <p className="text-[10px] text-slate-600 mt-1">O backend pode ter continuado enviando. Verifique os logs antes de reenviar.</p>
                  </div>
                  <button onClick={() => setSendError(null)} className="text-slate-600 hover:text-slate-400">
                    <X size={13} />
                  </button>
                </div>
              )}
              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3">
                <StatCard icon={Users} label="Total importado" value={students.length} color="#10b981" />
                <StatCard icon={CheckSquare} label="Selecionados" value={selectedStudents.length} color="#3b82f6" />
                {invalidStudents.length > 0 && (
                  <StatCard icon={AlertTriangle} label="Sem telefone" value={invalidStudents.length} color="#f59e0b" />
                )}
                {invalidStudents.length === 0 && (
                  <StatCard icon={FileSpreadsheet} label="Arquivo" value={fileName.replace(/\.(xlsx|xls)$/i, '')} color="#8b5cf6" />
                )}
              </div>

              {/* File label + reset */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet size={13} className="text-slate-500" />
                  <span className="text-xs text-slate-400 font-medium">{fileName}</span>
                </div>
                <div className="flex items-center gap-2">
                  {invalidStudents.length > 0 && (
                    <button
                      onClick={() => setShowInvalid((v) => !v)}
                      className="flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-lg transition-all duration-150"
                      style={{
                        background: showInvalid ? 'rgba(245,158,11,0.15)' : (isDark ? 'rgba(255,255,255,0.04)' : '#f1f5f9'),
                        color: showInvalid ? '#fbbf24' : '#64748b',
                        border: showInvalid ? '1px solid rgba(245,158,11,0.3)' : (isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #e2e8f0'),
                      }}
                    >
                      {showInvalid ? <EyeOff size={11} /> : <Eye size={11} />}
                      {showInvalid ? 'Ocultar inválidos' : `Ver ${invalidStudents.length} inválidos`}
                    </button>
                  )}
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-lg transition-all duration-150"
                    style={{
                      background: isDark ? 'rgba(255,255,255,0.04)' : '#f1f5f9',
                      color: '#64748b',
                      border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #e2e8f0',
                    }}
                  >
                    <RefreshCw size={11} />
                    Trocar arquivo
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="flex-1 rounded-xl overflow-hidden flex flex-col border border-slate-200 dark:border-white/[0.07]">
                {/* Table header */}
                <div
                  className="grid items-center px-4 py-3 gap-3 text-[10px] font-bold uppercase tracking-widest shrink-0 bg-slate-50 dark:bg-white/[0.03] border-b border-slate-200 dark:border-white/[0.06] text-slate-500"
                  style={{ gridTemplateColumns: '32px 80px 1fr 100px 140px 90px' }}
                >
                  <button
                    onClick={toggleSelectAll}
                    className="flex items-center justify-center transition-colors duration-150"
                    style={{ color: allValidSelected ? '#10b981' : someSelected ? '#10b981' : '#475569' }}
                    title="Selecionar todos"
                  >
                    {allValidSelected ? (
                      <CheckSquare size={14} />
                    ) : someSelected ? (
                      <div className="w-3.5 h-3.5 rounded-sm border-2 flex items-center justify-center" style={{ borderColor: '#10b981' }}>
                        <div className="w-1.5 h-0.5 rounded" style={{ background: '#10b981' }} />
                      </div>
                    ) : (
                      <Square size={14} />
                    )}
                  </button>
                  <span>RM</span>
                  <span>Aluno</span>
                  <span>Turma</span>
                  <span>Contato</span>
                  <span>Status</span>
                </div>

                {/* Table body */}
                <div className="flex-1 overflow-y-auto" style={{ maxHeight: '380px' }}>
                  {(showInvalid ? students : validStudents).map((student) => {
                    const isSelected = selected.has(student.id);
                    const isPreview = previewStudent?.id === student.id;

                    return (
                      <div
                        key={student.id}
                        className="grid items-center px-4 py-2.5 gap-3 transition-all duration-150 group"
                        style={{
                          gridTemplateColumns: '32px 80px 1fr 100px 140px 90px',
                          background: isPreview
                            ? 'rgba(16,185,129,0.07)'
                            : isSelected
                            ? (isDark ? 'rgba(255,255,255,0.025)' : '#f8fafc')
                            : 'transparent',
                          borderBottom: isDark ? '1px solid rgba(255,255,255,0.04)' : '1px solid #f1f5f9',
                          opacity: student.phoneValid ? 1 : 0.5,
                        }}
                        onMouseEnter={() => student.phoneValid && setPreviewStudent(student)}
                        onMouseLeave={() => setPreviewStudent(null)}
                      >
                        {/* Checkbox */}
                        <button
                          onClick={() => student.phoneValid && toggleSelect(student.id)}
                          disabled={!student.phoneValid}
                          className="flex items-center justify-center transition-colors duration-150"
                          style={{ color: isSelected ? '#10b981' : '#334155' }}
                        >
                          {!student.phoneValid ? (
                            <AlertTriangle size={13} style={{ color: '#f59e0b' }} />
                          ) : isSelected ? (
                            <CheckSquare size={14} />
                          ) : (
                            <Square size={14} />
                          )}
                        </button>

                        {/* RM */}
                        <span className="text-[11px] font-mono text-slate-400 truncate">{student.rm || '—'}</span>

                        {/* Name */}
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate">{student.name || '—'}</span>

                        {/* Turma */}
                        <span
                          className="text-[11px] font-medium truncate px-2 py-0.5 rounded-md w-fit"
                          style={{
                            background: student.turma ? 'rgba(99,102,241,0.12)' : 'transparent',
                            color: student.turma ? '#818cf8' : '#475569',
                          }}
                        >
                          {student.turma || '—'}
                        </span>

                        {/* Phone */}
                        <span
                          className="text-[11px] font-mono truncate"
                          style={{ color: student.phoneValid ? '#34d399' : '#f59e0b' }}
                        >
                          {student.phone || 'Inválido'}
                        </span>

                        {/* Status */}
                        <span
                          className="text-[11px] font-medium truncate px-2 py-0.5 rounded-full w-fit"
                          style={{
                            background: student.status.toLowerCase().includes('ativ')
                              ? 'rgba(16,185,129,0.12)'
                              : student.status.toLowerCase().includes('cancel')
                              ? 'rgba(239,68,68,0.12)'
                              : isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                            color: student.status.toLowerCase().includes('ativ')
                              ? '#34d399'
                              : student.status.toLowerCase().includes('cancel')
                              ? '#f87171'
                              : '#94a3b8',
                          }}
                        >
                          {student.status || '—'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right: Message composer */}
            <div className="flex flex-col gap-4">
              <div className="rounded-xl p-5 flex flex-col gap-4 flex-1 bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.07]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {activeTemplate ? (
                      <LayoutTemplate size={14} className="text-violet-400" />
                    ) : (
                      <MessageSquare size={14} className="text-emerald-400" />
                    )}
                    <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-widest">
                      {activeTemplate ? 'Template Ativo' : 'Mensagem'}
                    </span>
                  </div>
                  <button
                    onClick={() => navigate('/templates')}
                    className="flex items-center gap-1 text-[10px] font-semibold transition-colors"
                    style={{ color: '#8b5cf6' }}
                  >
                    <LayoutTemplate size={10} />
                    {activeTemplate ? 'Trocar template' : 'Usar template'}
                  </button>
                </div>

                {/* ── TEMPLATE MODE ── */}
                {activeTemplate ? (
                  <>
                    {/* Active template banner */}
                    <div
                      className="rounded-xl p-3 flex items-start gap-3"
                      style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.25)' }}
                    >
                      <LayoutTemplate size={14} className="text-violet-400 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-violet-300 font-mono truncate">
                          {activeTemplate.name}
                        </p>
                        <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5 line-clamp-3 whitespace-pre-wrap">
                          {activeTemplate.body}
                        </p>
                      </div>
                      <button
                        onClick={handleClearTemplate}
                        className="text-slate-600 hover:text-slate-400 transition-colors shrink-0"
                      >
                        <X size={13} />
                      </button>
                    </div>

                    {/* Variable mapping */}
                    {activeTemplate.variables.length > 0 && (
                      <div>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2">
                          Mapear variáveis do template
                        </p>
                        <div className="space-y-2">
                          {activeTemplate.variables.map((idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <span
                                className="text-[11px] font-mono font-bold px-2 py-1 rounded shrink-0"
                                style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa' }}
                              >
                                {`{{${idx}}}`}
                              </span>
                              <span className="text-slate-400 dark:text-slate-600 text-xs shrink-0">→</span>
                              <select
                                value={variableMapping[idx] ?? 'name'}
                                onChange={(e) =>
                                  setVariableMapping((prev) => ({ ...prev, [idx]: e.target.value }))
                                }
                                className="flex-1 rounded-lg px-2 py-1.5 text-xs outline-none appearance-none bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.08] text-slate-800 dark:text-slate-200 cursor-pointer"
                              >
                                {STUDENT_FIELDS.map((f) => (
                                  <option key={f.key} value={f.key}>
                                    {f.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Template preview for hovered student */}
                    {previewStudent && (
                      <div
                        className="rounded-xl p-3"
                        style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.2)' }}
                      >
                        <p className="text-[10px] text-violet-400 font-bold uppercase tracking-widest mb-2">
                          Preview · {previewStudent.name}
                        </p>
                        <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                          {activeTemplate.body.replace(/\{\{(\d+)\}\}/g, (_m, idx) => {
                            const field = variableMapping[Number(idx)];
                            return field
                              ? (previewStudent[field as keyof Student] as string) || `{{${idx}}}`
                              : `{{${idx}}}`;
                          })}
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {/* ── FREE TEXT MODE ── */}
                    {/* Variables */}
                    <div>
                      <p className="text-[10px] text-slate-500 font-medium mb-2 uppercase tracking-widest">
                        Inserir variável
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        <VariableChip label="{nome}" onClick={() => insertVariable('{nome}')} />
                        <VariableChip label="{turma}" onClick={() => insertVariable('{turma}')} />
                        <VariableChip label="{rm}" onClick={() => insertVariable('{rm}')} />
                        <VariableChip label="{status}" onClick={() => insertVariable('{status}')} />
                        <VariableChip label="{email}" onClick={() => insertVariable('{email}')} />
                      </div>
                    </div>

                    {/* Textarea */}
                    <div className="flex flex-col gap-1 flex-1">
                      <textarea
                        ref={textareaRef}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder={`Olá {nome}! 👋\n\nInformamos que sua turma {turma} tem uma novidade importante...\n\nAtt,\nEquipe Suporte`}
                        rows={9}
                        className="flex-1 resize-none rounded-xl text-sm leading-relaxed outline-none transition-all duration-150 placeholder:text-slate-400 dark:placeholder:text-slate-600 bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] text-slate-800 dark:text-slate-200"
                        style={{ padding: '12px 14px', fontFamily: 'inherit' }}
                        onFocus={(e) => { e.currentTarget.style.border = isDark ? '1px solid rgba(16,185,129,0.4)' : '1px solid #6ee7b7'; }}
                        onBlur={(e) => { e.currentTarget.style.border = isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0'; }}
                      />
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-slate-400 dark:text-slate-600">{message.length} caracteres</span>
                        {message.length > 1000 && (
                          <span className="text-[10px] text-amber-400 flex items-center gap-1">
                            <AlertTriangle size={10} /> Mensagem longa
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Preview */}
                    {previewStudent && message && (
                      <div
                        className="rounded-xl p-3"
                        style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)' }}
                      >
                        <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mb-2">
                          Preview · {previewStudent.name}
                        </p>
                        <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                          {interpolatePreview(message, previewStudent)}
                        </p>
                      </div>
                    )}

                    {!previewStudent && (
                      <p className="text-[10px] text-slate-400 dark:text-slate-600 text-center">
                        Passe o mouse sobre um aluno para pré-visualizar a mensagem
                      </p>
                    )}
                  </>
                )}
              </div>

              {/* Send button */}
              <button
                disabled={selectedStudents.length === 0 || (!activeTemplate && !message.trim())}
                onClick={() => setConfirmOpen(true)}
                className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200 ${
                  selectedStudents.length === 0 || (!activeTemplate && !message.trim())
                    ? 'bg-slate-100 dark:bg-white/[0.05] text-slate-400 dark:text-slate-600 cursor-not-allowed'
                    : 'text-white cursor-pointer'
                }`}
                style={
                  selectedStudents.length > 0 && (activeTemplate || message.trim())
                    ? {
                        background: activeTemplate ? 'linear-gradient(135deg, #8b5cf6, #6d28d9)' : 'linear-gradient(135deg, #10b981, #059669)',
                        boxShadow: activeTemplate ? '0 4px 20px rgba(139,92,246,0.35)' : '0 4px 20px rgba(16,185,129,0.35)',
                      }
                    : undefined
                }
              >
                <Send size={15} />
                Enviar para {selectedStudents.length} aluno{selectedStudents.length !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            STEP: SENDING
        ═══════════════════════════════════════════════════════════════ */}
        {activeTab === 'send' && step === 'sending' && (
          <div className="flex flex-col items-center justify-center min-h-[400px] gap-6">
            <div className="relative">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}
              >
                <Send size={32} style={{ color: '#10b981' }} />
              </div>
              <div
                className="absolute inset-0 rounded-full animate-ping"
                style={{ background: 'rgba(16,185,129,0.1)' }}
              />
            </div>
            <div className="text-center">
              <p className="text-base font-bold text-slate-900 dark:text-white mb-1">Enviando mensagens...</p>
              {sendProgress ? (
                <p className="text-2xl font-bold tabular-nums" style={{ color: '#34d399' }}>
                  {sendProgress.sent}
                  <span className="text-base text-slate-500">/{sendProgress.total}</span>
                </p>
              ) : (
                <p className="text-sm text-slate-400">
                  Aguarde. Enviando para {selectedStudents.length} contatos.
                </p>
              )}
              <p className="text-xs text-slate-600 mt-1">
                Isso pode levar alguns minutos para evitar bloqueios
              </p>
            </div>
            <div className="w-64 h-1.5 rounded-full overflow-hidden bg-slate-200 dark:bg-white/[0.06]">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  background: 'linear-gradient(90deg, #10b981, #059669)',
                  width: sendProgress
                    ? `${(sendProgress.sent / sendProgress.total) * 100}%`
                    : '5%',
                }}
              />
            </div>
            {sendProgress && (
              <p className="text-[11px] text-slate-500 font-mono">
                {Math.round((sendProgress.sent / sendProgress.total) * 100)}% concluído
              </p>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            STEP: RESULTS
        ═══════════════════════════════════════════════════════════════ */}
        {activeTab === 'send' && step === 'results' && sendResults && (
          <div className="flex flex-col gap-5">
            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-3">
              <StatCard icon={BarChart3} label="Total enviado" value={sendResults.total} color="#10b981" />
              <StatCard icon={CheckCircle2} label="Sucesso" value={sendResults.successCount} color="#10b981" />
              <StatCard icon={XCircle} label="Falhas" value={sendResults.failureCount} color="#ef4444" />
            </div>

            {/* Progress bar */}
            <div>
              <div className="flex justify-between text-[11px] font-medium mb-1.5">
                <span style={{ color: '#34d399' }}>
                  {Math.round((sendResults.successCount / sendResults.total) * 100)}% entregues
                </span>
                <span style={{ color: '#64748b' }}>
                  {sendResults.successCount}/{sendResults.total}
                </span>
              </div>
              <div className="h-2 rounded-full overflow-hidden bg-slate-200 dark:bg-white/[0.06]">
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{
                    width: `${(sendResults.successCount / sendResults.total) * 100}%`,
                    background: 'linear-gradient(90deg, #10b981, #059669)',
                  }}
                />
              </div>
            </div>

            {/* Results table */}
            <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-white/[0.07]">
              <div
                className="grid px-4 py-3 text-[10px] font-bold uppercase tracking-widest bg-slate-50 dark:bg-white/[0.03] border-b border-slate-200 dark:border-white/[0.06] text-slate-500"
                style={{ gridTemplateColumns: '28px 1fr 160px 1fr' }}
              >
                <span />
                <span>Aluno</span>
                <span>Telefone</span>
                <span>Observação</span>
              </div>

              <div className="overflow-y-auto" style={{ maxHeight: '360px' }}>
                {sendResults.results.map((r, i) => (
                  <div
                    key={i}
                    className="grid px-4 py-2.5 items-center gap-3 cursor-pointer transition-colors duration-150"
                    style={{
                      gridTemplateColumns: '28px 1fr 160px 1fr',
                      borderBottom: isDark ? '1px solid rgba(255,255,255,0.04)' : '1px solid #f1f5f9',
                      background:
                        expandedResult === String(i)
                          ? (isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc')
                          : 'transparent',
                    }}
                    onClick={() =>
                      setExpandedResult((prev) => (prev === String(i) ? null : String(i)))
                    }
                  >
                    <div className="flex items-center justify-center">
                      {r.success ? (
                        <CheckCircle2 size={14} style={{ color: '#10b981' }} />
                      ) : (
                        <XCircle size={14} style={{ color: '#ef4444' }} />
                      )}
                    </div>
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate">
                      {r.name || '—'}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400 truncate">{r.phone}</span>
                    <span
                      className="text-[11px] truncate"
                      style={{ color: r.success ? '#34d399' : '#f87171' }}
                    >
                      {r.success ? 'Enviado com sucesso' : r.error ?? 'Erro desconhecido'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 text-slate-500 bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.08] hover:bg-slate-200 dark:hover:bg-white/[0.08]"
              >
                <RefreshCw size={14} />
                Novo envio
              </button>
            </div>
          </div>
        )}
      </div>

        {/* ═══════════════════════════════════════════════════════════════
            TAB: HISTORY
        ═══════════════════════════════════════════════════════════════ */}
        {activeTab === 'history' && (
          <div className="max-w-3xl mx-auto w-full space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Histórico de Envios</h2>
              <button
                onClick={fetchHistory}
                disabled={historyLoading}
                className="flex items-center gap-1.5 text-[11px] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
              >
                <RefreshCw size={11} className={historyLoading ? 'animate-spin' : ''} />
                Atualizar
              </button>
            </div>

            {historyLoading ? (
              <div className="flex items-center justify-center py-16">
                <RefreshCw size={20} className="animate-spin text-slate-600" />
              </div>
            ) : history.length === 0 ? (
              <div className="rounded-xl py-16 flex flex-col items-center gap-3 bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06]">
                <BarChart3 size={32} className="text-slate-400 dark:text-slate-700" />
                <p className="text-sm text-slate-500">Nenhum envio realizado ainda</p>
                <p className="text-[11px] text-slate-400 dark:text-slate-700">Os envios aparecerão aqui após a conclusão</p>
              </div>
            ) : (
              <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-white/[0.07]">
                <div
                  className="grid px-4 py-3 text-[10px] font-bold uppercase tracking-widest bg-slate-50 dark:bg-white/[0.03] border-b border-slate-200 dark:border-white/[0.06] text-slate-500"
                  style={{ gridTemplateColumns: '1fr 120px 80px 80px 80px 110px' }}
                >
                  <span>Mensagem / Template</span>
                  <span>Enviado por</span>
                  <span>Total</span>
                  <span>Sucesso</span>
                  <span>Falhas</span>
                  <span>Data/Hora</span>
                </div>
                {history.map((entry) => {
                  const dt = new Date(entry.sentAt);
                  const dateStr = dt.toLocaleDateString('pt-BR');
                  const timeStr = dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                  return (
                    <div
                      key={entry.id}
                      className="grid px-4 py-3 items-center gap-3"
                      style={{
                        gridTemplateColumns: '1fr 120px 80px 80px 80px 110px',
                        borderBottom: isDark ? '1px solid rgba(255,255,255,0.04)' : '1px solid #f1f5f9',
                      }}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {entry.type === 'template' ? (
                          <LayoutTemplate size={12} className="text-violet-400 shrink-0" />
                        ) : (
                          <MessageSquare size={12} className="text-emerald-400 shrink-0" />
                        )}
                        <span className="text-xs text-slate-700 dark:text-slate-300 truncate font-medium" title={entry.label}>
                          {entry.label}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 truncate">{entry.user.fullName}</span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white tabular-nums">{entry.total}</span>
                      <span className="text-xs font-bold tabular-nums" style={{ color: '#34d399' }}>{entry.successCount}</span>
                      <span
                        className="text-xs font-bold tabular-nums"
                        style={{ color: entry.failureCount > 0 ? '#f87171' : '#475569' }}
                      >
                        {entry.failureCount}
                      </span>
                      <div>
                        <p className="text-[11px] text-slate-400">{dateStr}</p>
                        <p className="text-[10px] text-slate-600">{timeStr}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      {/* ═══════════════════════════════════════════════════════════════
          CONFIRMATION MODAL
      ═══════════════════════════════════════════════════════════════ */}
      {confirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => e.target === e.currentTarget && setConfirmOpen(false)}
        >
          <div
            className="rounded-2xl p-6 w-full max-w-md"
            style={{
              background: isDark ? '#0f1929' : 'white',
              border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0',
              boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
            }}
          >
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)' }}
                >
                  <Send size={18} style={{ color: '#10b981' }} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">Confirmar envio</h2>
                  <p className="text-xs text-slate-500">Esta ação não pode ser desfeita</p>
                </div>
              </div>
              <button
                onClick={() => setConfirmOpen(false)}
                className="text-slate-500 hover:text-slate-300 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div
              className="rounded-xl p-4 mb-5"
              style={{
                background: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc',
                border: isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid #e2e8f0',
              }}
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-0.5">Destinatários</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{selectedStudents.length}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-0.5">Caracteres</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{message.length}</p>
                </div>
              </div>
            </div>

            {activeTemplate && (
              <div
                className="rounded-xl p-3 mb-4 flex items-center gap-2"
                style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.25)' }}
              >
                <LayoutTemplate size={13} className="text-violet-400 shrink-0" />
                <p className="text-xs text-violet-300">
                  Template: <span className="font-bold font-mono">{activeTemplate.name}</span>
                </p>
              </div>
            )}
            <p className="text-xs text-slate-400 mb-5 leading-relaxed">
              Você está prestes a enviar uma mensagem WhatsApp para{' '}
              <span className="font-bold text-emerald-400">{selectedStudents.length} aluno{selectedStudents.length !== 1 ? 's' : ''}</span>.
              As mensagens serão enviadas com um intervalo de 500ms entre cada envio.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setConfirmOpen(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 text-slate-500 bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.08] hover:bg-slate-200 dark:hover:bg-white/[0.08]"
              >
                Cancelar
              </button>
              <button
                onClick={handleSend}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all duration-200"
                style={{
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: 'white',
                  boxShadow: '0 4px 20px rgba(16,185,129,0.4)',
                }}
              >
                <Send size={14} />
                Confirmar envio
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
