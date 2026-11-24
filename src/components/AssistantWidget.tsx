import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Bot, FileText, Loader2, MessageCircle, Mic, RotateCcw, Send, Square, Volume2, X } from 'lucide-react';
import { useI18n } from '../i18n';
import { useCurrentUser } from '../store/selectors';
import { AssistantOfflineError, askAssistant, clearAssistantSession, type AssistantLang, type AssistantSource } from '../services/assistant';

interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  text: string;
  sources?: AssistantSource[];
  status?: 'streaming' | 'error' | 'done';
}

// ───────────── Mise en forme minimale du markdown (sans HTML injecté) ─────────────
function inline(text: string, keyPrefix: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? <strong key={`${keyPrefix}-${i}`}>{part.slice(2, -2)}</strong> : part.replace(/(^|\s)\*([^*]+)\*/g, '$1$2'),
  );
}

/** Retire les citations brutes de fichiers (« 【cahier-des-charges-v1.md | …】 », « (source : x.md) ») : le nombre de sources est affiché à part. */
function stripCitations(text: string): string {
  return text
    .replace(/\s*【[^】]*】/g, '')
    .replace(/\s*\*?\((?:source|sources|المصدر|المصادر)\s*[:：][^)]*\)\*?/gi, '')
    .replace(/\s*\[[^\]]*\.md[^\]]*\]/g, '');
}

function Markdown({ text }: { text: string }) {
  const lines = stripCitations(text).split('\n');
  const blocks: ReactNode[] = [];
  let list: { ordered: boolean; items: { depth: number; text: string }[] } | null = null;
  const flush = () => {
    if (!list) return;
    const Tag = list.ordered ? 'ol' : 'ul';
    blocks.push(
      <Tag key={`l${blocks.length}`} className={`my-1 space-y-0.5 ps-5 ${list.ordered ? 'list-decimal' : 'list-disc'}`}>
        {list.items.map((it, i) => (
          <li key={i} style={{ marginInlineStart: it.depth * 12 }}>
            {inline(it.text, `li${i}`)}
          </li>
        ))}
      </Tag>,
    );
    list = null;
  };
  lines.forEach((raw, i) => {
    const bullet = raw.match(/^(\s*)[-*•]\s+(.*)$/);
    const numbered = raw.match(/^(\s*)\d+[.)]\s+(.*)$/);
    const heading = raw.match(/^#{1,4}\s+(.*)$/);
    if (bullet || numbered) {
      const m = (bullet ?? numbered)!;
      const ordered = !bullet;
      const depth = Math.min(2, Math.floor(m[1].length / 2));
      if (!list || (list.ordered !== ordered && depth === 0)) {
        flush();
        list = { ordered, items: [] };
      }
      list.items.push({ depth, text: m[2] });
      return;
    }
    flush();
    if (!raw.trim()) return;
    if (heading) blocks.push(<p key={i} className="mt-1 font-bold">{inline(heading[1], `h${i}`)}</p>);
    else blocks.push(<p key={i} className="my-0.5">{inline(raw, `p${i}`)}</p>);
  });
  flush();
  return <>{blocks}</>;
}

const plainText = (md: string) => md.replace(/[*#_`>]/g, '').replace(/\s+/g, ' ').trim();

// ───────────── Session (une par onglet) ─────────────
function sessionId(): string {
  const KEY = 'khirna-assistant-session';
  let id = sessionStorage.getItem(KEY);
  if (!id) {
    id = `web-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    sessionStorage.setItem(KEY, id);
  }
  return id;
}

type SpeechRec = {
  lang: string;
  interimResults: boolean;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
};
const SpeechRecognitionCtor: (new () => SpeechRec) | undefined =
  typeof window !== 'undefined'
    ? ((window as unknown as Record<string, unknown>).SpeechRecognition as new () => SpeechRec) ??
      ((window as unknown as Record<string, unknown>).webkitSpeechRecognition as new () => SpeechRec)
    : undefined;
const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window;

export function AssistantWidget() {
  const { t, lang } = useI18n();
  const user = useCurrentUser();
  const [open, setOpen] = useState(false);
  const [chatLang, setChatLang] = useState<AssistantLang>(lang);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [speakingId, setSpeakingId] = useState<number | null>(null);
  const seq = useRef(1);
  const scroller = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abort = useRef<AbortController | null>(null);
  const recognition = useRef<SpeechRec | null>(null);

  // La langue des réponses suit la langue de l'interface (modifiable dans le panneau).
  useEffect(() => {
    setChatLang(lang);
  }, [lang]);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: 'smooth' });
  }, [messages, open]);

  useEffect(() => {
    if (open) window.setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  useEffect(
    () => () => {
      abort.current?.abort();
      if (canSpeak) window.speechSynthesis.cancel();
    },
    [],
  );

  const send = async (text: string) => {
    const message = text.trim();
    if (!message || busy) return;
    setInput('');
    const userMsg: ChatMessage = { id: seq.current++, role: 'user', text: message };
    const botId = seq.current++;
    setMessages((m) => [...m, userMsg, { id: botId, role: 'assistant', text: '', status: 'streaming' }]);
    setBusy(true);
    const controller = new AbortController();
    abort.current = controller;
    try {
      const { sources } = await askAssistant(
        { session_id: sessionId(), message, language: chatLang, user_role: user?.role ?? 'visitor' },
        (delta) => setMessages((m) => m.map((x) => (x.id === botId ? { ...x, text: x.text + delta } : x))),
        controller.signal,
      );
      setMessages((m) => m.map((x) => (x.id === botId ? { ...x, sources, status: 'done' } : x)));
    } catch (e) {
      if (controller.signal.aborted) return;
      const text = e instanceof AssistantOfflineError ? t('assistant.offline') : t('assistant.error');
      setMessages((m) => m.map((x) => (x.id === botId ? { ...x, text, status: 'error' } : x)));
    } finally {
      setBusy(false);
      abort.current = null;
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void send(input);
  };

  const reset = () => {
    abort.current?.abort();
    if (canSpeak) window.speechSynthesis.cancel();
    setSpeakingId(null);
    setMessages([]);
    setBusy(false);
    void clearAssistantSession(sessionId());
  };

  const toggleMic = () => {
    if (!SpeechRecognitionCtor) return;
    if (listening) {
      recognition.current?.stop();
      return;
    }
    const rec = new SpeechRecognitionCtor();
    rec.lang = chatLang === 'fr' ? 'fr-FR' : 'ar-TN';
    rec.interimResults = false;
    rec.onresult = (e) => {
      const transcript = e.results[0]?.[0]?.transcript ?? '';
      if (transcript) void send(transcript);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recognition.current = rec;
    setListening(true);
    rec.start();
  };

  const toggleSpeak = (msg: ChatMessage) => {
    if (!canSpeak) return;
    window.speechSynthesis.cancel();
    if (speakingId === msg.id) {
      setSpeakingId(null);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(plainText(msg.text));
    utterance.lang = chatLang === 'fr' ? 'fr-FR' : 'ar';
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);
    setSpeakingId(msg.id);
    window.speechSynthesis.speak(utterance);
  };

  const suggestions = [t('assistant.s1'), t('assistant.s2'), t('assistant.s3')];
  const langs: { id: AssistantLang; label: string }[] = [
    { id: 'fr', label: t('assistant.langFr') },
    { id: 'ar', label: t('assistant.langAr') },
    { id: 'tn', label: t('assistant.langTn') },
  ];

  return (
    <>
      {/* Panneau de conversation */}
      {open && (
        <section
          role="dialog"
          aria-label={t('assistant.title')}
          className="fixed inset-x-2 bottom-[8.5rem] top-[4.5rem] z-[950] flex flex-col overflow-hidden rounded-3xl border border-ink/10 bg-white shadow-2xl animate-fadeUp md:inset-x-auto md:bottom-24 md:right-6 md:top-auto md:h-[min(620px,calc(100vh-8rem))] md:w-[400px]"
        >
          <header className="flex items-center gap-3 bg-primary px-4 py-3 text-white">
            <span className="rounded-full bg-white/15 p-2">
              <Bot size={20} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-bold leading-tight text-white">{t('assistant.title')}</p>
              <p className="truncate text-[11px] text-white/75">{t('assistant.subtitle')}</p>
            </div>
            <button className="rounded-full p-2 hover:bg-white/15" onClick={reset} title={t('assistant.clear')} aria-label={t('assistant.clear')}>
              <RotateCcw size={17} />
            </button>
            <button className="rounded-full p-2 hover:bg-white/15" onClick={() => setOpen(false)} aria-label={t('assistant.close')}>
              <X size={18} />
            </button>
          </header>

          <div className="flex items-center justify-between gap-2 border-b border-ink/5 bg-cream px-4 py-2">
            <span className="text-[11px] font-semibold text-ink-muted">{t('assistant.language')}</span>
            <div className="flex rounded-full bg-white p-0.5 shadow-card" role="group" aria-label={t('assistant.language')}>
              {langs.map((l) => (
                <button
                  key={l.id}
                  onClick={() => setChatLang(l.id)}
                  className={`rounded-full px-3 py-1 text-xs font-bold transition ${chatLang === l.id ? 'bg-primary text-white' : 'text-ink-soft hover:bg-ink/5'}`}
                  aria-pressed={chatLang === l.id}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          <div ref={scroller} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            <div className="flex gap-2">
              <span className="mt-1 shrink-0 rounded-full bg-primary-50 p-1.5 text-primary">
                <Bot size={16} />
              </span>
              <div className="rounded-2xl rounded-ss-sm bg-cream px-3 py-2 text-sm text-ink">{t('assistant.welcome')}</div>
            </div>
            {messages.length === 0 && (
              <div className="flex flex-wrap gap-2 ps-9">
                {suggestions.map((s) => (
                  <button key={s} onClick={() => void send(s)} className="rounded-full border border-primary/25 bg-white px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary-50">
                    {s}
                  </button>
                ))}
              </div>
            )}
            {messages.map((m) =>
              m.role === 'user' ? (
                <div key={m.id} className="flex justify-end">
                  <div dir="auto" className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-se-sm bg-primary px-3 py-2 text-sm text-white">
                    {m.text}
                  </div>
                </div>
              ) : (
                <div key={m.id} className="flex gap-2">
                  <span className="mt-1 h-fit shrink-0 rounded-full bg-primary-50 p-1.5 text-primary">
                    <Bot size={16} />
                  </span>
                  <div className="min-w-0 max-w-[88%]">
                    <div
                      dir="auto"
                      className={`rounded-2xl rounded-ss-sm px-3 py-2 text-sm leading-relaxed ${m.status === 'error' ? 'bg-red-50 text-red-700' : 'bg-cream text-ink'}`}
                    >
                      {m.text ? (
                        <Markdown text={m.text} />
                      ) : (
                        <span className="flex items-center gap-2 text-ink-muted">
                          <Loader2 size={14} className="animate-spin" /> {t('assistant.thinking')}
                        </span>
                      )}
                    </div>
                    {m.status === 'done' && (
                      <div className="mt-1 flex flex-wrap items-center gap-2 ps-1 text-[11px] text-ink-muted">
                        {!!m.sources?.length && (
                          <span className="flex items-center gap-1" title={Array.from(new Set(m.sources.map((s) => s.filename))).join(' · ')}>
                            <FileText size={12} /> {t('assistant.sources', { n: m.sources.length })}
                          </span>
                        )}
                        {canSpeak && (
                          <button className="flex items-center gap-1 font-semibold text-primary hover:underline" onClick={() => toggleSpeak(m)}>
                            {speakingId === m.id ? <Square size={11} /> : <Volume2 size={12} />}
                            {speakingId === m.id ? t('assistant.stopSpeak') : t('assistant.speak')}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ),
            )}
          </div>

          <form onSubmit={onSubmit} className="border-t border-ink/5 p-3">
            <div className="flex items-end gap-2">
              {SpeechRecognitionCtor && (
                <button
                  type="button"
                  onClick={toggleMic}
                  disabled={busy}
                  className={`shrink-0 rounded-full p-2.5 transition ${listening ? 'animate-pulse bg-red-500 text-white' : 'bg-ink/5 text-ink-soft hover:bg-ink/10'}`}
                  aria-label={t('assistant.mic')}
                  title={listening ? t('assistant.listening') : t('assistant.mic')}
                >
                  <Mic size={18} />
                </button>
              )}
              <textarea
                ref={inputRef}
                dir="auto"
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void send(input);
                  }
                }}
                placeholder={listening ? t('assistant.listening') : t('assistant.placeholder')}
                maxLength={4000}
                className="input max-h-28 min-h-[42px] flex-1 resize-none py-2.5"
              />
              <button type="submit" disabled={busy || !input.trim()} className="btn-primary shrink-0 rounded-full p-2.5" aria-label={t('assistant.send')}>
                {busy ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className="rtl:-scale-x-100" />}
              </button>
            </div>
            <p className="mt-2 text-center text-[10px] leading-tight text-ink-muted">{t('assistant.disclaimer')}</p>
          </form>
        </section>
      )}

      {/* Bouton flottant, en bas à droite (au-dessus de la barre de navigation sur mobile) */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-20 right-4 z-[950] flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-xl ring-4 ring-white transition hover:scale-105 hover:bg-primary-dark md:bottom-6 md:right-6"
        aria-label={open ? t('assistant.close') : t('assistant.open')}
        aria-expanded={open}
        title={t('assistant.title')}
      >
        {open ? <X size={24} /> : <MessageCircle size={26} />}
        {!open && <span className="absolute -top-0.5 right-0 h-3.5 w-3.5 rounded-full bg-wheat ring-2 ring-white" />}
      </button>
    </>
  );
}
