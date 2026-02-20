import { Outlet } from 'react-router-dom';
import { MessageSquare, Users, Zap, Shield } from 'lucide-react';

const features = [
  { icon: Zap, text: 'Respostas em tempo real via WhatsApp' },
  { icon: Users, text: 'Múltiplos atendentes simultâneos' },
  { icon: Shield, text: 'Bot inteligente com handover humano' },
];

export function AuthLayout() {
  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div
        className="hidden lg:flex w-[52%] flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #060d1a 0%, #0B1120 50%, #0d1f18 100%)' }}
      >
        {/* Decorative rings */}
        <div
          className="auth-decoration-ring"
          style={{ width: 600, height: 600, top: -120, right: -200 }}
        />
        <div
          className="auth-decoration-ring"
          style={{ width: 380, height: 380, top: 60, right: -60 }}
        />
        <div
          className="auth-decoration-ring"
          style={{ width: 180, height: 180, top: 200, right: 80, borderColor: 'rgba(16,185,129,0.12)' }}
        />

        {/* Decorative glow */}
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            width: 320,
            height: 320,
            top: -80,
            right: -80,
            background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)',
          }}
        />
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            width: 200,
            height: 200,
            bottom: 120,
            left: 60,
            background: 'radial-gradient(circle, rgba(16,185,129,0.06) 0%, transparent 70%)',
          }}
        />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <MessageSquare size={20} className="text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-lg leading-tight">Suporte</p>
              <p className="text-emerald-400 text-xs font-semibold">WhatsApp</p>
            </div>
          </div>
        </div>

        {/* Center content */}
        <div className="relative z-10">
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Atendimento
            <br />
            <span className="text-emerald-400">inteligente</span>
            <br />
            no WhatsApp
          </h1>
          <p className="text-slate-400 text-base leading-relaxed mb-10 max-w-sm">
            Gerencie todas as conversas do seu WhatsApp em um painel centralizado e eficiente.
          </p>

          {/* Features */}
          <div className="space-y-4">
            {features.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <Icon size={14} className="text-emerald-400" />
                </div>
                <span className="text-sm text-slate-400 font-medium">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div className="relative z-10">
          <p className="text-slate-700 text-xs">
            © {new Date().getFullYear()} WhatsApp Support — Todos os direitos reservados
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center bg-white p-8">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center">
              <MessageSquare size={16} className="text-white" />
            </div>
            <p className="font-bold text-slate-900">Suporte WhatsApp</p>
          </div>

          <Outlet />
        </div>
      </div>
    </div>
  );
}
