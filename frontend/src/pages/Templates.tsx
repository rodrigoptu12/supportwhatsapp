import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutTemplate,
  Plus,
  RefreshCw,
  Trash2,
  Send,
  CheckCircle2,
  Clock,
  XCircle,
  PauseCircle,
  Eye,
  ChevronRight,
  FileText,
  AlignLeft,
  AlignJustify,
  X,
  Info,
  Search,
  Zap,
} from 'lucide-react';
import {
  templatesService,
  WhatsAppTemplate,
  TemplateStatus,
  TemplateCategory,
  getTemplateBody,
  getTemplateHeader,
  getTemplateFooter,
  extractVariableIndices,
} from '../services/templates.service';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../contexts/ThemeContext';

// ─── Types ────────────────────────────────────────────────────────────────────

type FilterStatus = 'ALL' | TemplateStatus;

interface CreateForm {
  name: string;
  category: TemplateCategory;
  language: string;
  headerText: string;
  bodyText: string;
  footerText: string;
}

const EMPTY_FORM: CreateForm = {
  name: '',
  category: 'MARKETING',
  language: 'pt_BR',
  headerText: '',
  bodyText: '',
  footerText: '',
};

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  TemplateStatus,
  { label: string; color: string; bg: string; border: string; icon: React.ElementType }
> = {
  APPROVED: {
    label: 'Aprovado',
    color: '#34d399',
    bg: 'rgba(16,185,129,0.12)',
    border: 'rgba(16,185,129,0.3)',
    icon: CheckCircle2,
  },
  PENDING: {
    label: 'Pendente',
    color: '#fbbf24',
    bg: 'rgba(251,191,36,0.12)',
    border: 'rgba(251,191,36,0.3)',
    icon: Clock,
  },
  REJECTED: {
    label: 'Rejeitado',
    color: '#f87171',
    bg: 'rgba(239,68,68,0.12)',
    border: 'rgba(239,68,68,0.3)',
    icon: XCircle,
  },
  PAUSED: {
    label: 'Pausado',
    color: '#94a3b8',
    bg: 'rgba(148,163,184,0.1)',
    border: 'rgba(148,163,184,0.2)',
    icon: PauseCircle,
  },
  DISABLED: {
    label: 'Desativado',
    color: '#64748b',
    bg: 'rgba(100,116,139,0.1)',
    border: 'rgba(100,116,139,0.2)',
    icon: PauseCircle,
  },
  IN_APPEAL: {
    label: 'Em recurso',
    color: '#a78bfa',
    bg: 'rgba(167,139,250,0.12)',
    border: 'rgba(167,139,250,0.3)',
    icon: Clock,
  },
  DELETED: {
    label: 'Excluído',
    color: '#475569',
    bg: 'rgba(71,85,105,0.1)',
    border: 'rgba(71,85,105,0.2)',
    icon: XCircle,
  },
};

const CATEGORY_CONFIG: Record<
  TemplateCategory,
  { label: string; color: string; bg: string }
> = {
  MARKETING: { label: 'Marketing', color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
  UTILITY: { label: 'Utilidade', color: '#60a5fa', bg: 'rgba(96,165,250,0.12)' },
  AUTHENTICATION: { label: 'Autenticação', color: '#fb923c', bg: 'rgba(251,146,60,0.12)' },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: TemplateStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG['PENDING'];
  const Icon = cfg.icon;
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold"
      style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
    >
      <Icon size={10} />
      {cfg.label}
    </span>
  );
}

function CategoryBadge({ category }: { category: TemplateCategory }) {
  const cfg = CATEGORY_CONFIG[category];
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide"
      style={{ background: cfg.bg, color: cfg.color }}
    >
      {cfg.label}
    </span>
  );
}

function VariablePill({ text }: { text: string }) {
  // Highlight {{n}} variables in template text
  const parts = text.split(/(\{\{\d+\}\})/g);
  return (
    <span>
      {parts.map((p, i) =>
        /^\{\{\d+\}\}$/.test(p) ? (
          <span
            key={i}
            className="inline-flex items-center px-1 rounded text-[11px] font-mono font-bold mx-0.5"
            style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399' }}
          >
            {p}
          </span>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </span>
  );
}

// ─── Template Detail Drawer ────────────────────────────────────────────────────

function TemplateDetail({
  template,
  onClose,
  onUse,
  onDelete,
  isAdmin,
}: {
  template: WhatsAppTemplate;
  onClose: () => void;
  onUse: (t: WhatsAppTemplate) => void;
  onDelete: (t: WhatsAppTemplate) => void;
  isAdmin: boolean;
}) {
  const header = getTemplateHeader(template);
  const body = getTemplateBody(template);
  const footer = getTemplateFooter(template);
  const varIndices = extractVariableIndices(body);

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-[#0d1626] border-l border-slate-200 dark:border-white/[0.07]">
      {/* Drawer header */}
      <div className="flex items-center justify-between px-5 py-4 shrink-0 border-b border-slate-200 dark:border-white/[0.06]">
        <div>
          <p className="text-sm font-bold text-slate-900 dark:text-white font-mono">{template.name}</p>
          <div className="flex items-center gap-2 mt-1">
            <StatusBadge status={template.status} />
            <CategoryBadge category={template.category} />
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 dark:bg-white/[0.05] text-slate-500">
              {template.language}
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors p-1"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {/* WhatsApp message preview */}
        <div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">
            Preview da mensagem
          </p>
          <div
            className="rounded-2xl rounded-tl-sm p-4 max-w-xs space-y-2 bg-emerald-50 dark:bg-[#1e2f1e]"
            style={{ border: '1px solid rgba(16,185,129,0.2)' }}
          >
            {header && (
              <p className="text-xs font-bold text-slate-900 dark:text-white leading-relaxed">{header}</p>
            )}
            {body && (
              <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                <VariablePill text={body} />
              </p>
            )}
            {footer && (
              <p className="text-[10px] text-slate-500 leading-relaxed">{footer}</p>
            )}
            <p className="text-[10px] text-slate-400 dark:text-slate-600 text-right">
              {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>

        {/* Variables */}
        {varIndices.length > 0 && (
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">
              Variáveis do template
            </p>
            <div className="space-y-2">
              {varIndices.map((idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06]"
                >
                  <span
                    className="text-[11px] font-mono font-bold px-1.5 py-0.5 rounded shrink-0"
                    style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399' }}
                  >
                    {`{{${idx}}}`}
                  </span>
                  <ChevronRight size={12} className="text-slate-400 dark:text-slate-600 shrink-0" />
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    mapeado ao enviar em massa
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rejection reason */}
        {template.status === 'REJECTED' && template.rejected_reason && (
          <div
            className="rounded-xl p-3"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
          >
            <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
              <Info size={10} /> Motivo da rejeição
            </p>
            <p className="text-xs text-red-300">{template.rejected_reason}</p>
          </div>
        )}

        {/* Quality score */}
        {template.quality_score && (
          <div className="rounded-xl p-3 bg-slate-100 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06]">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
              Qualidade
            </p>
            <p className="text-sm font-bold text-slate-900 dark:text-white">{template.quality_score.score}</p>
          </div>
        )}

        {/* Timestamps */}
        <div className="space-y-1.5">
          {template.created_time && (
            <p className="text-[11px] text-slate-500">
              Criado em:{' '}
              {new Date(template.created_time).toLocaleDateString('pt-BR', {
                day: '2-digit', month: 'long', year: 'numeric',
              })}
            </p>
          )}
          {template.last_updated_time && (
            <p className="text-[11px] text-slate-500">
              Atualizado:{' '}
              {new Date(template.last_updated_time).toLocaleDateString('pt-BR', {
                day: '2-digit', month: 'long', year: 'numeric',
              })}
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="px-5 py-4 space-y-2 shrink-0 border-t border-slate-200 dark:border-white/[0.06]">
        {template.status === 'APPROVED' && (
          <button
            onClick={() => onUse(template)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all duration-200"
            style={{
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: 'white',
              boxShadow: '0 4px 16px rgba(16,185,129,0.35)',
            }}
          >
            <Zap size={14} />
            Usar no Envio em Massa
          </button>
        )}
        {isAdmin && template.status !== 'DELETED' && (
          <button
            onClick={() => onDelete(template)}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all duration-150"
            style={{
              background: 'rgba(239,68,68,0.08)',
              color: '#f87171',
              border: '1px solid rgba(239,68,68,0.2)',
            }}
          >
            <Trash2 size={12} />
            Excluir template
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Create Modal ─────────────────────────────────────────────────────────────

function CreateModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [form, setForm] = useState<CreateForm>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = <K extends keyof CreateForm>(k: K, v: CreateForm[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const autoSlug = (v: string) =>
    v.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');

  const bodyVars = extractVariableIndices(form.bodyText);

  const handleSubmit = async () => {
    if (!form.name.trim()) return setError('O nome é obrigatório');
    if (!form.bodyText.trim()) return setError('O corpo da mensagem é obrigatório');
    setError('');
    setLoading(true);
    try {
      await templatesService.create({
        name: form.name,
        category: form.category,
        language: form.language,
        headerText: form.headerText,
        bodyText: form.bodyText,
        footerText: form.footerText,
      });
      onCreated();
      onClose();
    } catch (e) {
      const msg =
        (e as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        (e instanceof Error ? e.message : 'Erro ao criar template');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'w-full rounded-xl px-3 py-2.5 text-sm outline-none transition-all duration-150 bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600';
  const focusBorder = isDark ? '1px solid rgba(16,185,129,0.4)' : '1px solid #6ee7b7';
  const blurBorder = isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-2xl rounded-2xl flex flex-col bg-white dark:bg-[#0f1929] border border-slate-200 dark:border-white/[0.1]"
        style={{ boxShadow: '0 30px 80px rgba(0,0,0,0.7)', maxHeight: '90vh' }}
      >
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-5 shrink-0 border-b border-slate-200 dark:border-white/[0.07]">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)' }}
            >
              <Plus size={16} className="text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">Novo Template</p>
              <p className="text-[11px] text-slate-500">Será enviado ao WhatsApp para aprovação</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Name + Category row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                Nome do template *
              </label>
              <input
                value={form.name}
                onChange={(e) => set('name', autoSlug(e.target.value))}
                placeholder="ex: boas_vindas_aluno"
                className={`${inputClass} font-mono`}
                onFocus={(e) => (e.currentTarget.style.border = focusBorder)}
                onBlur={(e) => (e.currentTarget.style.border = blurBorder)}
              />
              <p className="text-[10px] text-slate-400 dark:text-slate-600 mt-1">Apenas letras minúsculas, números e _</p>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                Categoria *
              </label>
              <select
                value={form.category}
                onChange={(e) => set('category', e.target.value as TemplateCategory)}
                className={`${inputClass} appearance-none cursor-pointer`}
              >
                <option value="MARKETING">Marketing</option>
                <option value="UTILITY">Utilidade</option>
                <option value="AUTHENTICATION">Autenticação</option>
              </select>
            </div>
          </div>

          {/* Language + Header row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                Idioma
              </label>
              <select
                value={form.language}
                onChange={(e) => set('language', e.target.value)}
                className={`${inputClass} appearance-none cursor-pointer`}
              >
                <option value="pt_BR">Português (BR)</option>
                <option value="en_US">English (US)</option>
                <option value="es">Español</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                <FileText size={10} className="inline mr-1" />
                Cabeçalho (opcional)
              </label>
              <input
                value={form.headerText}
                onChange={(e) => set('headerText', e.target.value)}
                placeholder="Título da mensagem"
                className={inputClass}
                onFocus={(e) => (e.currentTarget.style.border = focusBorder)}
                onBlur={(e) => (e.currentTarget.style.border = blurBorder)}
              />
              <p className="text-[10px] text-slate-400 dark:text-slate-600 mt-1">
                Sem emojis, asteriscos (*) ou quebras de linha
              </p>
            </div>
          </div>

          {/* Body */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                <AlignJustify size={10} className="inline mr-1" />
                Corpo da mensagem *
              </label>
              <span className="text-[10px] text-slate-400 dark:text-slate-600">
                Use {`{{1}}`}, {`{{2}}`}, {`{{3}}`} para variáveis
              </span>
            </div>
            <textarea
              value={form.bodyText}
              onChange={(e) => set('bodyText', e.target.value)}
              rows={5}
              placeholder={`Olá {{1}}, informamos que sua turma {{2}} terá aula amanhã.\n\nQualquer dúvida, entre em contato.`}
              className={`${inputClass} resize-none leading-relaxed`}
              onFocus={(e) => (e.currentTarget.style.border = focusBorder)}
              onBlur={(e) => (e.currentTarget.style.border = blurBorder)}
            />
            {bodyVars.length > 0 && (
              <p className="text-[10px] text-emerald-500 dark:text-emerald-400 mt-1 flex items-center gap-1">
                <CheckCircle2 size={10} />
                {bodyVars.length} variável{bodyVars.length > 1 ? 'is' : ''} detectada{bodyVars.length > 1 ? 's' : ''}:{' '}
                {bodyVars.map((v) => `{{${v}}}`).join(', ')}
              </p>
            )}
          </div>

          {/* Footer */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">
              <AlignLeft size={10} className="inline mr-1" />
              Rodapé (opcional)
            </label>
            <input
              value={form.footerText}
              onChange={(e) => set('footerText', e.target.value)}
              placeholder="ex: Equipe de Suporte"
              className={inputClass}
              onFocus={(e) => (e.currentTarget.style.border = focusBorder)}
              onBlur={(e) => (e.currentTarget.style.border = blurBorder)}
            />
          </div>

          {/* Info box */}
          <div
            className="rounded-xl p-3 flex gap-3"
            style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)' }}
          >
            <Info size={14} className="text-amber-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-700 dark:text-amber-300 leading-relaxed">
              Após criado, o template será enviado à Meta para revisão. O processo pode levar de
              minutos a horas. O status aparecerá como <strong>Pendente</strong> até a aprovação.
            </p>
          </div>

          {error && (
            <div
              className="rounded-xl p-3"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}
            >
              <p className="text-xs text-red-500 dark:text-red-400">{error}</p>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex gap-3 px-6 py-4 shrink-0 border-t border-slate-200 dark:border-white/[0.07]">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all bg-slate-100 dark:bg-white/[0.05] text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/[0.08]"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !form.name || !form.bodyText}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
              loading || !form.name || !form.bodyText
                ? 'bg-slate-100 dark:bg-white/[0.05] text-slate-400 dark:text-slate-600 cursor-not-allowed'
                : 'text-white cursor-pointer'
            }`}
            style={
              !loading && form.name && form.bodyText
                ? { background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 4px 16px rgba(16,185,129,0.35)' }
                : undefined
            }
          >
            {loading ? (
              <RefreshCw size={14} className="animate-spin" />
            ) : (
              <Send size={14} />
            )}
            {loading ? 'Enviando...' : 'Criar e enviar para aprovação'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Templates() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('ALL');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<WhatsAppTemplate | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<WhatsAppTemplate | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const data = await templatesService.list();
      setTemplates(data);
    } catch {
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchTemplates();
  }, [fetchTemplates]);

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      await templatesService.delete(deleteConfirm.name);
      setTemplates((prev) => prev.filter((t) => t.id !== deleteConfirm.id));
      if (selected?.id === deleteConfirm.id) setSelected(null);
      setDeleteConfirm(null);
    } catch {
      alert('Erro ao excluir template');
    } finally {
      setDeleting(false);
    }
  };

  const handleUse = (template: WhatsAppTemplate) => {
    // Navigate to mass message page passing template via location state
    navigate('/mass-message', {
      state: {
        template: {
          name: template.name,
          language: template.language,
          body: getTemplateBody(template),
          variables: extractVariableIndices(getTemplateBody(template)),
        },
      },
    });
  };

  // Filter logic
  const statusCounts = templates.reduce<Record<string, number>>((acc, t) => {
    acc[t.status] = (acc[t.status] ?? 0) + 1;
    return acc;
  }, {});

  const filtered = templates.filter((t) => {
    if (filterStatus !== 'ALL' && t.status !== filterStatus) return false;
    if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const filterTabs: { key: FilterStatus; label: string; count?: number }[] = [
    { key: 'ALL', label: 'Todos', count: templates.length },
    { key: 'APPROVED', label: 'Aprovados', count: statusCounts['APPROVED'] },
    { key: 'PENDING', label: 'Pendentes', count: statusCounts['PENDING'] },
    { key: 'REJECTED', label: 'Rejeitados', count: statusCounts['REJECTED'] },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white dark:bg-[#0B1120] text-slate-800 dark:text-slate-200">
      {/* ── Header ── */}
      <div className="shrink-0 px-6 py-5 flex items-center justify-between border-b border-slate-200 dark:border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', boxShadow: '0 0 20px rgba(139,92,246,0.3)' }}
          >
            <LayoutTemplate size={16} className="text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900 dark:text-white tracking-wide">Templates</h1>
            <p className="text-[11px] text-slate-500">WhatsApp Business · Meta</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => void fetchTemplates()}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all bg-slate-100 dark:bg-white/[0.04] text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/[0.07]"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            Atualizar
          </button>
          {isAdmin && (
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all text-white"
              style={{ background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 2px 12px rgba(16,185,129,0.3)' }}
            >
              <Plus size={13} />
              Novo Template
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Left: List ── */}
        <div
          className={`flex flex-col flex-1 min-w-0 overflow-hidden ${selected ? 'border-r border-slate-200 dark:border-white/[0.06]' : ''}`}
        >
          {/* Filter bar */}
          <div className="px-5 py-3 flex items-center gap-3 shrink-0 border-b border-slate-200 dark:border-white/[0.06]">
            {/* Status tabs */}
            <div className="flex gap-1">
              {filterTabs.map((tab) => {
                const active = filterStatus === tab.key;
                const statusKey = tab.key as TemplateStatus;
                const cfg = tab.key !== 'ALL' ? STATUS_CONFIG[statusKey] : null;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setFilterStatus(tab.key)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-150"
                    style={{
                      background: active
                        ? cfg ? cfg.bg : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)')
                        : 'transparent',
                      color: active
                        ? cfg ? cfg.color : (isDark ? '#e2e8f0' : '#1e293b')
                        : '#64748b',
                      border: active
                        ? cfg ? `1px solid ${cfg.border}` : (isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.12)')
                        : '1px solid transparent',
                    }}
                  >
                    {tab.label}
                    {tab.count !== undefined && tab.count > 0 && (
                      <span
                        className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                        style={{
                          background: active
                            ? cfg ? `${cfg.color}30` : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)')
                            : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'),
                          color: active ? (cfg?.color ?? (isDark ? '#e2e8f0' : '#1e293b')) : '#64748b',
                        }}
                      >
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Search */}
            <div className="flex-1 max-w-xs relative">
              <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar template..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs outline-none transition-all bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.07] text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600"
              />
            </div>
          </div>

          {/* Template list */}
          <div className="flex-1 overflow-y-auto p-5">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-48 gap-3">
                <RefreshCw size={24} className="text-slate-400 dark:text-slate-600 animate-spin" />
                <p className="text-sm text-slate-500">Carregando templates...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 gap-3">
                <LayoutTemplate size={32} className="text-slate-300 dark:text-slate-700" />
                <p className="text-sm text-slate-500">
                  {search ? 'Nenhum template encontrado' : 'Nenhum template cadastrado'}
                </p>
                {isAdmin && !search && (
                  <button
                    onClick={() => setShowCreate(true)}
                    className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-300 flex items-center gap-1 transition-colors"
                  >
                    <Plus size={12} /> Criar primeiro template
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {filtered.map((t) => {
                  const body = getTemplateBody(t);
                  const header = getTemplateHeader(t);
                  const isSelected = selected?.id === t.id;
                  const varIndices = extractVariableIndices(body);

                  return (
                    <div
                      key={t.id}
                      onClick={() => setSelected(isSelected ? null : t)}
                      className={`rounded-xl p-4 cursor-pointer transition-all duration-200 group flex flex-col gap-3 ${
                        isSelected
                          ? 'bg-purple-50 dark:bg-purple-500/[0.08] border border-purple-300 dark:border-purple-500/40'
                          : 'bg-slate-50 dark:bg-white/[0.025] border border-slate-200 dark:border-white/[0.07] hover:border-slate-300 dark:hover:border-white/[0.12]'
                      }`}
                      style={isSelected ? { boxShadow: '0 0 20px rgba(139,92,246,0.1)' } : undefined}
                    >
                      {/* Card header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-900 dark:text-white font-mono truncate mb-1">
                            {t.name}
                          </p>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <StatusBadge status={t.status} />
                            <CategoryBadge category={t.category} />
                          </div>
                        </div>
                        <Eye
                          size={14}
                          className="shrink-0 mt-1 transition-colors"
                          style={{ color: isSelected ? '#8b5cf6' : (isDark ? '#475569' : '#94a3b8') }}
                        />
                      </div>

                      {/* Message preview */}
                      <div className="rounded-lg p-3 flex-1 bg-slate-100/80 dark:bg-black/20">
                        {header && (
                          <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 truncate">
                            {header}
                          </p>
                        )}
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3">
                          {body || <span className="text-slate-400 dark:text-slate-600 italic">Sem corpo</span>}
                        </p>
                      </div>

                      {/* Card footer */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-slate-400 dark:text-slate-600">
                            {t.language}
                          </span>
                          {varIndices.length > 0 && (
                            <span
                              className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                              style={{ background: 'rgba(16,185,129,0.1)', color: '#34d399' }}
                            >
                              {varIndices.length} var{varIndices.length > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                        {t.status === 'APPROVED' && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleUse(t); }}
                            className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg transition-all"
                            style={{
                              background: 'rgba(16,185,129,0.12)',
                              color: '#34d399',
                              border: '1px solid rgba(16,185,129,0.25)',
                            }}
                          >
                            <Zap size={9} />
                            Usar
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Right: Detail Drawer ── */}
        {selected && (
          <div className="w-80 shrink-0 h-full overflow-hidden">
            <TemplateDetail
              template={selected}
              onClose={() => setSelected(null)}
              onUse={handleUse}
              onDelete={(t) => setDeleteConfirm(t)}
              isAdmin={isAdmin}
            />
          </div>
        )}
      </div>

      {/* ── Create Modal ── */}
      {showCreate && (
        <CreateModal
          onClose={() => setShowCreate(false)}
          onCreated={() => void fetchTemplates()}
        />
      )}

      {/* ── Delete Confirm ── */}
      {deleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
        >
          <div
            className="rounded-2xl p-6 w-full max-w-sm bg-white dark:bg-[#0f1929] border border-slate-200 dark:border-white/[0.1]"
            style={{ boxShadow: '0 25px 60px rgba(0,0,0,0.6)' }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}
              >
                <Trash2 size={16} className="text-red-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">Excluir template</p>
                <p className="text-xs text-slate-500 font-mono">{deleteConfirm.name}</p>
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 leading-relaxed">
              Esta ação não pode ser desfeita. O template será removido da sua conta Meta
              e não poderá mais ser utilizado.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all bg-slate-100 dark:bg-white/[0.05] text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/[0.08]"
              >
                Cancelar
              </button>
              <button
                onClick={() => void handleDelete()}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all"
                style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}
              >
                {deleting ? <RefreshCw size={13} className="animate-spin" /> : <Trash2 size={13} />}
                {deleting ? 'Excluindo...' : 'Confirmar exclusão'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
