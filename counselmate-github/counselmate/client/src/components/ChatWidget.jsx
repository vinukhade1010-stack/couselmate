import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errorMessage } from '../api.js';
import { formatFees } from '../utils/format.js';

const QUICK = [
  'Engineering colleges in Pune under 2 lakh',
  'What documents do I need?',
  'What is a cutoff?',
  'Show my shortlist',
];
const GREETING = {
  role: 'bot',
  text: "Hi, I'm the CounselMate assistant. Ask me about colleges by city, course, fees or cutoff, or about documents and admission steps.",
};

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([GREETING]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState(null);
  const logRef = useRef(null);
  const inputRef = useRef(null);

  // Other pages can open the chat (optionally with a question typed in):
  //   window.dispatchEvent(new CustomEvent('counselmate:chat', { detail: { prompt: '...' } }))
  useEffect(() => {
    const onOpen = (e) => {
      setOpen(true);
      if (e.detail?.prompt) setInput(String(e.detail.prompt).slice(0, 300));
    };
    window.addEventListener('counselmate:chat', onOpen);
    return () => window.removeEventListener('counselmate:chat', onOpen);
  }, []);

  useEffect(() => { if (open) inputRef.current?.focus(); }, [open]);

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages, busy, open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  async function send(text) {
    const message = (text ?? input).trim();
    if (!message || busy) return;
    const history = messages
      .filter((m) => m !== GREETING && !m.error)
      .slice(-6)
      .map((m) => ({ role: m.role, text: m.text.slice(0, 800) }));
    setMessages((m) => [...m, { role: 'user', text: message }]);
    setInput('');
    setBusy(true);
    try {
      const { data } = await api.post('/chat', { message, history });
      setMode(data.mode);
      setMessages((m) => [...m, { role: 'bot', text: data.reply, colleges: data.colleges }]);
    } catch (err) {
      setMessages((m) => [...m, { role: 'bot', error: true, text: errorMessage(err, 'I could not answer that just now. Please try again.') }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {open && (
        <section className="chat" role="dialog" aria-label="CounselMate assistant">
          <header className="chat-head">
            <div>
              <strong>CounselMate assistant</strong>
              <span className={`mode${mode === 'basic' ? ' basic' : ''}`}>
                {mode === 'basic' ? 'Basic mode' : mode === 'ai' ? 'AI answers' : 'Ready'}
              </span>
            </div>
            <button type="button" className="chat-close" onClick={() => setOpen(false)} aria-label="Close assistant">&#10005;</button>
          </header>

          <div className="chat-log" ref={logRef} role="log" aria-live="polite">
            {messages.map((m, i) => (
              <div key={i} className={`msg msg-${m.role}${m.error ? ' msg-error' : ''}`}>
                <p>{m.text}</p>
                {m.colleges?.length > 0 && (
                  <ul className="msg-cards">
                    {m.colleges.map((c) => (
                      <li key={c.id}>
                        <Link to={`/colleges/${c.id}`} onClick={() => setOpen(false)}>
                          <strong>{c.name}</strong>
                          <span>{c.city} &middot; {formatFees(c.fees)} a year &middot; cutoff {c.cutoff}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
            {busy && (
              <div className="msg msg-bot typing" aria-label="The assistant is typing">
                <i /><i /><i />
              </div>
            )}
            {messages.length === 1 && !busy && (
              <div className="quick">
                {QUICK.map((q) => (
                  <button key={q} type="button" className="chip-btn" onClick={() => send(q)}>{q}</button>
                ))}
              </div>
            )}
          </div>

          <form className="chat-form" onSubmit={(e) => { e.preventDefault(); send(); }}>
            <label className="sr-only" htmlFor="chat-input">Your question</label>
            <input
              id="chat-input"
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={300}
              placeholder="Ask about colleges or admissions"
              autoComplete="off"
            />
            <button type="submit" className="btn btn-sm" disabled={busy || !input.trim()}>Send</button>
          </form>
          <p className="chat-note">
            {input.length > 240 ? `${300 - input.length} characters left. ` : ''}
            Answers use CounselMate&apos;s sample records. Check details on the college website.
          </p>
        </section>
      )}

      <button
        type="button"
        className={`chat-fab${open ? ' is-open' : ''}`}
        aria-expanded={open}
        aria-label={open ? 'Close assistant' : 'Open assistant'}
        onClick={() => setOpen((o) => !o)}
      >
        {open ? (
          <span aria-hidden="true">&#10005;</span>
        ) : (
          <>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M4 5h16v11H9l-5 4z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            </svg>
            <span>Ask</span>
          </>
        )}
      </button>
    </>
  );
}
