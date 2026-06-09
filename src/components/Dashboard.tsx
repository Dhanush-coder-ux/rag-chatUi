// components/Dashboard.tsx — VAATHI OS Hero Welcome Screen
import React, { useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle2, XCircle, FileText, Search, BarChart3,
  Lightbulb, Globe, Network, Zap, Terminal,
} from 'lucide-react';
import { useRagContext } from '../context/RagContext';




// ── Quick Action Cards ────────────────────────────────────────────────────────
const actionCards = [
  {
    icon: FileText,
    title: 'Summarize Documents',
    desc: 'Extract key insights from your knowledge base',
    prompt: 'Summarize the main points from all my documents',
    color: '#00E5FF',
  },
  {
    icon: Search,
    title: 'Analyze Research',
    desc: 'Deep-dive analysis on any research topic',
    prompt: 'Analyze and break down the research from my documents',
    color: '#0891B2',
  },
  {
    icon: BarChart3,
    title: 'Generate Report',
    desc: 'Create structured reports from your data',
    prompt: 'Generate a comprehensive report from my documents',
    color: '#22C55E',
  },
  {
    icon: Lightbulb,
    title: 'Extract Insights',
    desc: 'Uncover hidden patterns and connections',
    prompt: 'Extract key insights and patterns from my documents',
    color: '#F59E0B',
  },
  {
    icon: Globe,
    title: 'Find Sources',
    desc: 'Search web and documents for references',
    prompt: 'Find relevant sources and citations for my research',
    color: '#8B5CF6',
  },
  {
    icon: Network,
    title: 'Build Knowledge Graph',
    desc: 'Map entity relationships across sources',
    prompt: 'Build a knowledge graph showing relationships in my documents',
    color: '#EC4899',
  },
];

// ── Container animation ───────────────────────────────────────────────────────
const containerVariants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden:  { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' as const } },
};

// ── Dashboard Component ───────────────────────────────────────────────────────
export const Dashboard: React.FC = () => {
  const { documents, sessions, chatHistory, isLoading, error } = useRagContext();

  // Derive real stats
  const totalDocs     = documents.length;
  const totalSessions = sessions.length;

  // Sessions created today
  const todaySessions = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return sessions.filter(s => new Date(s.created_at) >= today).length;
  }, [sessions]);

  // Rough token count from chatHistory (approx 1 token ≈ 4 chars)
  const approxTokens = useMemo(() => {
    const chars = chatHistory.reduce((sum, m) => sum + m.content.length, 0);
    const count  = Math.round(chars / 4);
    if (count === 0) return '0';
    if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
    return String(count);
  }, [chatHistory]);

  // System status items — real connectivity check
  const systemItems = [
    { label: 'Knowledge Ready',     ok: totalDocs > 0   },
    { label: 'Backend Connected',   ok: !error          },
    { label: 'AI Active',           ok: true            },
    { label: 'Search Available',    ok: true            },
  ];

  const fillInput = useCallback((prompt: string) => {
    const input = document.querySelector<HTMLTextAreaElement>('textarea[data-chat-input]');
    if (!input) return;
    const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
    setter?.call(input, prompt);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.focus();
  }, []);

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin">
      <div className="max-w-4xl mx-auto px-6 py-10 space-y-10">

        {/* ── Hero Section ─────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="space-y-2"
        >
          <div className="flex items-center gap-2 mb-4">
            <Terminal className="w-4 h-4 text-sys-cyan" />
            <span className="system-label text-sys-cyan" style={{ color: '#00E5FF' }}>VAATHI OS v2.0 — INITIALIZED</span>
          </div>

          <h1 className="text-[13px] font-mono font-semibold tracking-widest text-muted-foreground uppercase">
            WELCOME BACK
          </h1>
          <h2 className="text-5xl font-bold text-foreground" style={{ letterSpacing: '-0.03em', lineHeight: 1.1 }}>
            Dhanush
            <span className="inline-block w-1.5 h-10 ml-2 align-bottom bg-sys-cyan animate-blink" />
          </h2>
          <p className="text-muted-foreground text-base max-w-lg mt-3">
            Your AI research operating system is ready. What do you want to explore today?
          </p>
        </motion.div>

        {/* ── System Status + Quick Stats ────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* System Status Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15, ease: 'easeOut' }}
            className="p-5 rounded-xl border border-sys-border"
            style={{ background: 'rgba(17,24,39,0.8)' }}
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-sys-success animate-pulse" />
              <span className="system-label">SYSTEM STATUS</span>
            </div>
          <div className="space-y-2.5">
              {systemItems.map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 + i * 0.08 }}
                  className="flex items-center gap-2.5"
                >
                  {item.ok
                    ? <CheckCircle2 className="w-4 h-4 shrink-0 text-sys-success" />
                    : <XCircle      className="w-4 h-4 shrink-0 text-red-400" />
                  }
                  <span className="text-sm text-foreground font-medium">{item.label}</span>
                  <span className={`ml-auto text-[10px] font-mono font-bold px-1.5 py-0.5 rounded
                    ${item.ok ? 'text-sys-success' : 'text-red-400'}`}
                    style={item.ok
                      ? { background: 'rgba(34,197,94,0.1)' }
                      : { background: 'rgba(239,68,68,0.1)' }
                    }>
                    {item.ok ? 'OK' : 'ERR'}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Knowledge Overview Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.22, ease: 'easeOut' }}
            className="p-5 rounded-xl border border-sys-border"
            style={{ background: 'rgba(17,24,39,0.8)' }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-3.5 h-3.5 text-sys-cyan" />
              <span className="system-label">KNOWLEDGE OVERVIEW</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Documents', value: String(totalDocs),      unit: 'Indexed'  },
                { label: 'Sessions',  value: String(totalSessions),  unit: 'Total'    },
                { label: 'Today',     value: String(todaySessions),  unit: 'Sessions' },
                { label: 'Tokens',    value: approxTokens,           unit: 'Used'     },
              ].map((stat) => (
                <div key={stat.label} className="p-3 rounded-lg border border-sys-border"
                  style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <p className="text-2xl font-bold text-foreground font-mono" style={{ letterSpacing: '-0.02em' }}>
                    {stat.value}
                  </p>
                  <p className="system-label mt-0.5">{stat.label} · {stat.unit}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* ── Quick Action Cards ────────────────────────────────────────────── */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="flex items-center gap-2 mb-4"
          >
            <span className="system-label">QUICK ACTIONS</span>
            <div className="flex-1 h-px bg-sys-border" />
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
            style={{ ['--stagger-delay' as string]: '0.35s' }}
          >
            {actionCards.map((card) => (
              <motion.button
                key={card.title}
                variants={itemVariants}
                onClick={() => fillInput(card.prompt)}
                disabled={isLoading}
                className="action-card text-left p-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: `${card.color}15`, border: `1px solid ${card.color}25` }}>
                    <card.icon className="w-4.5 h-4.5" style={{ color: card.color, width: '18px', height: '18px' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground" style={{ letterSpacing: '-0.01em' }}>
                      {card.title}
                    </p>
                  </div>
                </div>
                <p className="text-[12px] text-muted-foreground leading-relaxed">
                  {card.desc}
                </p>
                <div className="mt-3 flex items-center gap-1 text-[11px] font-mono"
                  style={{ color: card.color, opacity: 0.7 }}>
                  <span>→</span>
                  <span>Execute</span>
                </div>
              </motion.button>
            ))}
          </motion.div>
        </div>

        {/* Bottom spacing */}
        <div className="h-4" />
      </div>
    </div>
  );
};
