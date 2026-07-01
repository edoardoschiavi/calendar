import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Plus, X, Check, Trash2, ChevronLeft, ChevronRight, Settings, Users, Clock, CircleDot, Menu } from "lucide-react";

/* ============================================================
   CourtCalendar — booking board for a tennis instructor
   Palette
     --clay     #C1543C  (terracotta, primary / confirmed)
     --grass    #4F7942  (court green, secondary)
     --chalk    #F7F4EC  (background)
     --ink      #20261F  (text)
     --line     #DCD5C3  (hairlines)
     --gold     #C99A3C  (draft state)
   Type: Fraunces (display) / Inter (UI) / JetBrains Mono (times)
   Signature: lesson "scorecards" — dashed clay-edge for draft,
   solid filled card for confirmed, with a ball-seam divider.
   ============================================================ */

const FONTS_LINK_ID = "court-calendar-fonts";
function useFonts() {
  useEffect(() => {
    if (document.getElementById(FONTS_LINK_ID)) return;
    const link = document.createElement("link");
    link.id = FONTS_LINK_ID;
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;0,9..144,700;1,9..144,500&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap";
    document.head.appendChild(link);
  }, []);
}

const DEFAULT_API_BASE = import.meta.env.VITE_API_BASE_URL;
const MOBILE_BREAKPOINT = 760;

function useIsMobile(breakpoint = MOBILE_BREAKPOINT) {
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < breakpoint);
  useEffect(() => {
    function onResize() {
      setIsMobile(window.innerWidth < breakpoint);
    }
    window.addEventListener("resize", onResize);
    onResize();
    return () => window.removeEventListener("resize", onResize);
  }, [breakpoint]);
  return isMobile;
}

/* ---------------- date helpers ---------------- */
const DAY_MS = 86400000;
function startOfWeek(d) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = (day === 0 ? -6 : 1) - day; // Monday start
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}
function addDays(d, n) {
  return new Date(d.getTime() + n * DAY_MS);
}
function fmtDayLabel(d) {
  return d.toLocaleDateString("it-IT", { weekday: "short", day: "numeric" });
}
function fmtMonthYear(d) {
  const s = d.toLocaleDateString("it-IT", { month: "long", year: "numeric" });
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function fmtTime(d) {
  return d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
}
function toLocalInputValue(d) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

const HOURS = Array.from({ length: 15 }, (_, i) => 8 + i); // 08:00 - 22:00

/* ---------------- root component ---------------- */
export default function CourtCalendar() {
  useFonts();

  const isMobile = useIsMobile();

  const [apiBase, setApiBase] = useState(DEFAULT_API_BASE);
  const [showSettings, setShowSettings] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const [cursor, setCursor] = useState(() => new Date());
  const weekStart = useMemo(() => startOfWeek(cursor), [cursor]);
  const days = useMemo(() => {
    if (isMobile) {
      const d = new Date(cursor);
      d.setHours(0, 0, 0, 0);
      return [d];
    }
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [cursor, isMobile, weekStart]);

  const [lessons, setLessons] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  const [showCreate, setShowCreate] = useState(false);
  const [createSlot, setCreateSlot] = useState(null);
  const [activeLesson, setActiveLesson] = useState(null);
  const [showStudents, setShowStudents] = useState(false);

  function pushToast(text, kind = "ok") {
    setToast({ text, kind });
    setTimeout(() => setToast(null), 3200);
  }

  const fetchLessons = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const start = weekStart.toISOString();
      const end = addDays(weekStart, 7).toISOString();
      const res = await fetch(`${apiBase}/lessons?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = await res.json();
      const data = (body.data || []).map((l) => ({
        ...l,
        startTime: new Date(l.startTime),
        endTime: new Date(l.endTime),
      }));
      setLessons(data);
    } catch (e) {
      setError("Impossibile contattare il server. Controlla l'indirizzo API nelle impostazioni.");
    } finally {
      setLoading(false);
    }
  }, [apiBase, weekStart]);

  const fetchStudents = useCallback(async () => {
    try {
      const res = await fetch(`${apiBase}/users/users`);
      if (!res.ok) throw new Error();
      const body = await res.json();
      setStudents(body.data || []);
    } catch (e) {
      // silent — endpoint may not exist yet on the backend
    }
  }, [apiBase]);

  useEffect(() => {
    fetchLessons();
  }, [fetchLessons]);
  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  async function handleConfirm(lessonId) {
    try {
      const res = await fetch(`${apiBase}/lessons/${lessonId}/confirm`, { method: "PUT" });
      if (!res.ok) throw new Error();
      pushToast("Lezione confermata");
      setActiveLesson(null);
      fetchLessons();
    } catch {
      pushToast("Conferma non riuscita", "error");
    }
  }

  async function handleDelete(lessonId) {
    try {
      const res = await fetch(`${apiBase}/lessons/${lessonId}/delete`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      pushToast("Bozza eliminata");
      setActiveLesson(null);
      fetchLessons();
    } catch {
      pushToast("Eliminazione non riuscita — l'endpoint DELETE /lessons/{id}/delete esiste sul backend?", "error");
    }
  }

  async function handleCreate({ startDate, endDate, userIds }) {
    try {
      const res = await fetch(`${apiBase}/lessons/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate,
          endDate,
          status: "DRAFT",
          users: userIds.map((id) => ({ id })),
        }),
      });
      if (!res.ok) throw new Error();
      pushToast("Bozza creata");
      setShowCreate(false);
      setCreateSlot(null);
      fetchLessons();
    } catch {
      pushToast("Creazione non riuscita", "error");
    }
  }

  function openSlot(day, hour) {
    const start = new Date(day);
    start.setHours(hour, 0, 0, 0);
    const end = new Date(start.getTime() + 60 * 60000);
    setCreateSlot({ start, end });
    setShowCreate(true);
  }

  const todayWeek = useMemo(
    () => (isMobile ? isSameDay(cursor, new Date()) : isSameDay(weekStart, startOfWeek(new Date()))),
    [cursor, isMobile, weekStart]
  );

  function goPrev() {
    setCursor((c) => addDays(c, isMobile ? -1 : -7));
  }
  function goNext() {
    setCursor((c) => addDays(c, isMobile ? 1 : 7));
  }
  function goToday() {
    setCursor(new Date());
  }

  return (
    <div style={styles.app}>
      <Sidebar
        onNew={() => {
          setCreateSlot(null);
          setShowCreate(true);
        }}
        onStudents={() => setShowStudents(true)}
        onSettings={() => setShowSettings(true)}
        lessonsCount={lessons.length}
        draftCount={lessons.filter((l) => l.status === "DRAFT").length}
      />

      <main style={styles.main}>
        <header style={styles.topbar}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
            <h1 style={styles.title}>{fmtMonthYear(weekStart)}</h1>
            <span style={styles.weekRange}>
              {days[0].toLocaleDateString("it-IT", { day: "numeric", month: "short" })} – {days[6].toLocaleDateString("it-IT", { day: "numeric", month: "short" })}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button style={styles.navBtn} onClick={() => setWeekStart(addDays(weekStart, -7))} aria-label="Settimana precedente">
              <ChevronLeft size={18} />
            </button>
            <button
              style={{ ...styles.todayBtn, opacity: todayWeek ? 0.5 : 1 }}
              onClick={() => setWeekStart(startOfWeek(new Date()))}
              disabled={todayWeek}
            >
              Oggi
            </button>
            <button style={styles.navBtn} onClick={() => setWeekStart(addDays(weekStart, 7))} aria-label="Settimana successiva">
              <ChevronRight size={18} />
            </button>
          </div>
        </header>

        {error && <div style={styles.errorBanner}>{error}</div>}

        <div style={styles.calendarWrap}>
          <WeekGrid days={days} lessons={lessons} loading={loading} onSlotClick={openSlot} onLessonClick={setActiveLesson} />
        </div>
      </main>

      {showCreate && (
        <CreateLessonModal
          students={students}
          initialSlot={createSlot}
          onClose={() => {
            setShowCreate(false);
            setCreateSlot(null);
          }}
          onSubmit={handleCreate}
        />
      )}

      {activeLesson && (
        <LessonDetailModal
          lesson={activeLesson}
          onClose={() => setActiveLesson(null)}
          onConfirm={() => handleConfirm(activeLesson.id)}
          onDelete={() => handleDelete(activeLesson.id)}
        />
      )}

      {showStudents && <StudentsModal apiBase={apiBase} students={students} onRefresh={fetchStudents} onClose={() => setShowStudents(false)} pushToast={pushToast} />}

      {showSettings && (
        <SettingsModal
          apiBase={apiBase}
          onSave={(v) => {
            setApiBase(v);
            setShowSettings(false);
          }}
          onClose={() => setShowSettings(false)}
        />
      )}

      {toast && (
        <div style={{ ...styles.toast, ...(toast.kind === "error" ? styles.toastError : {}) }}>
          {toast.text}
        </div>
      )}

      <style>{globalCss}</style>
    </div>
  );
}

/* ---------------- sidebar ---------------- */
function Sidebar({ onNew, onStudents, onSettings, lessonsCount, draftCount }) {
  return (
    <aside style={styles.sidebar}>
      <div style={styles.brand}>
        <CircleDot size={22} color="#C1543C" strokeWidth={2.5} />
        <span style={styles.brandText}>Court</span>
      </div>

      <button style={styles.newBtn} onClick={onNew}>
        <Plus size={18} /> Nuova lezione
      </button>

      <nav style={styles.navList}>
        <button style={styles.navItem} onClick={onStudents}>
          <Users size={17} /> Allievi
        </button>
        <button style={styles.navItem} onClick={onSettings}>
          <Settings size={17} /> Impostazioni
        </button>
      </nav>

      <div style={styles.statsBox}>
        <div style={styles.statsLine}>
          <span style={styles.dot("#4F7942")} /> {lessonsCount} lezioni questa settimana
        </div>
        <div style={styles.statsLine}>
          <span style={styles.dot("#C99A3C")} /> {draftCount} in bozza
        </div>
      </div>

      <div style={styles.sidebarFoot}>
        Ogni bozza resta in attesa di conferma.<br />Tocca una lezione per gestirla.
      </div>
    </aside>
  );
}

/* ---------------- week grid ---------------- */
function WeekGrid({ days, lessons, loading, onSlotClick, onLessonClick }) {
  const today = new Date();

  function lessonsForDay(day) {
    return lessons
      .filter((l) => isSameDay(l.startTime, day))
      .sort((a, b) => a.startTime - b.startTime);
  }

  return (
    <div style={styles.grid}>
      <div style={styles.gridHeadRow}>
        <div style={styles.gutterCell} />
        {days.map((d) => (
          <div key={d.toISOString()} style={styles.dayHeadCell}>
            <span style={{ ...styles.dayHeadNum, ...(isSameDay(d, today) ? styles.dayHeadNumToday : {}) }}>
              {d.getDate()}
            </span>
            <span style={styles.dayHeadLabel}>{fmtDayLabel(d).split(" ")[0]}</span>
          </div>
        ))}
      </div>

      <div style={styles.gridBody}>
        <div style={styles.gutterCol}>
          {HOURS.map((h) => (
            <div key={h} style={styles.hourLabel}>
              {String(h).padStart(2, "0")}:00
            </div>
          ))}
        </div>

        {days.map((day) => (
          <div key={day.toISOString()} style={styles.dayCol}>
            {HOURS.map((h) => (
              <div key={h} style={styles.hourCell} onClick={() => onSlotClick(day, h)} />
            ))}
            {lessonsForDay(day).map((l) => (
              <LessonBlock key={l.id} lesson={l} onClick={() => onLessonClick(l)} />
            ))}
          </div>
        ))}
      </div>

      {loading && <div style={styles.loadingOverlay}>Caricamento…</div>}
    </div>
  );
}

function LessonBlock({ lesson, onClick }) {
  const startHour = lesson.startTime.getHours() + lesson.startTime.getMinutes() / 60;
  const endHour = lesson.endTime.getHours() + lesson.endTime.getMinutes() / 60;
  const top = (startHour - HOURS[0]) * 56;
  const height = Math.max((endHour - startHour) * 56 - 4, 28);
  const isDraft = lesson.status === "DRAFT";
  const names = (lesson.users || []).map((u) => `${u.firstName} ${u.lastName?.[0] || ""}.`).join(", ");

  return (
    <button
      onClick={onClick}
      style={{
        ...styles.lessonBlock,
        top,
        height,
        background: isDraft ? "#FBF4E3" : "#3F6135",
        border: isDraft ? "1.5px dashed #C99A3C" : "1.5px solid #2E4827",
        color: isDraft ? "#6B4F18" : "#F7F4EC",
      }}
    >
      <span style={styles.lessonBlockTime}>{fmtTime(lesson.startTime)}</span>
      <span style={styles.lessonBlockNames}>{names || "Nessun allievo"}</span>
    </button>
  );
}

/* ---------------- create lesson modal ---------------- */
function CreateLessonModal({ students, initialSlot, onClose, onSubmit }) {
  const now = new Date();
  const defaultStart = initialSlot?.start || new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0);
  const defaultEnd = initialSlot?.end || new Date(defaultStart.getTime() + 60 * 60000);

  const [start, setStart] = useState(toLocalInputValue(defaultStart));
  const [end, setEnd] = useState(toLocalInputValue(defaultEnd));
  const [selectedIds, setSelectedIds] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  function toggleStudent(id) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function submit(e) {
    e.preventDefault();
    if (new Date(end) <= new Date(start)) return;
    setSubmitting(true);
    await onSubmit({
      startDate: new Date(start).toISOString(),
      endDate: new Date(end).toISOString(),
      userIds: selectedIds,
    });
    setSubmitting(false);
  }

  return (
    <ModalShell onClose={onClose} title="Nuova lezione" subtitle="Verrà salvata come bozza, da confermare dopo">
      <form onSubmit={submit} style={styles.form}>
        <div style={styles.formRow}>
          <label style={styles.label}>Inizio</label>
          <input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} style={styles.input} required />
        </div>
        <div style={styles.formRow}>
          <label style={styles.label}>Fine</label>
          <input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} style={styles.input} required />
        </div>

        <div style={styles.formRow}>
          <label style={styles.label}>Allievi</label>
          {students.length === 0 ? (
            <p style={styles.hintText}>
              Nessun allievo disponibile. Aggiungi un endpoint <code>GET /users</code> sul backend, oppure crea allievi
              dal pannello "Allievi".
            </p>
          ) : (
            <div style={styles.studentPicker}>
              {students.map((s) => {
                const active = selectedIds.includes(s.id);
                return (
                  <button
                    type="button"
                    key={s.id}
                    onClick={() => toggleStudent(s.id)}
                    style={{
                      ...styles.studentChip,
                      ...(active ? styles.studentChipActive : {}),
                    }}
                  >
                    {s.firstName} {s.lastName}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div style={styles.modalActions}>
          <button type="button" style={styles.secondaryBtn} onClick={onClose}>
            Annulla
          </button>
          <button type="submit" style={styles.primaryBtn} disabled={submitting}>
            {submitting ? "Salvataggio…" : "Crea bozza"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

/* ---------------- lesson detail modal ---------------- */
function LessonDetailModal({ lesson, onClose, onConfirm, onDelete }) {
  const isDraft = lesson.status === "DRAFT";
  return (
    <ModalShell onClose={onClose} title={isDraft ? "Lezione in bozza" : "Lezione confermata"} subtitle={lesson.startTime.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" })}>
      <div style={styles.detailBody}>
        <div style={styles.detailRow}>
          <Clock size={16} color="#7A7264" />
          <span>
            {fmtTime(lesson.startTime)} – {fmtTime(lesson.endTime)}
          </span>
        </div>
        <div style={styles.detailRow}>
          <Users size={16} color="#7A7264" />
          <span>
            {(lesson.users || []).length
              ? lesson.users.map((u) => `${u.firstName} ${u.lastName}`).join(", ")
              : "Nessun allievo associato"}
          </span>
        </div>
        <div style={styles.seam} />
        {isDraft ? (
          <div style={styles.modalActions}>
            <button style={styles.dangerBtn} onClick={onDelete}>
              <Trash2 size={16} /> Elimina
            </button>
            <button style={styles.primaryBtn} onClick={onConfirm}>
              <Check size={16} /> Conferma lezione
            </button>
          </div>
        ) : (
          <p style={styles.hintText}>Questa lezione è confermata.</p>
        )}
      </div>
    </ModalShell>
  );
}

/* ---------------- students modal ---------------- */
function StudentsModal({ apiBase, students, onRefresh, onClose, pushToast }) {
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", cellNumber: "", fitpCard: "" });
  const [submitting, setSubmitting] = useState(false);

  async function addStudent(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`${apiBase}/users/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      pushToast("Allievo aggiunto");
      setForm({ firstName: "", lastName: "", email: "", cellNumber: "", fitpCard: "" });
      onRefresh();
    } catch {
      pushToast("Aggiunta non riuscita", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ModalShell onClose={onClose} title="Allievi" subtitle="Elenco e aggiunta rapida">
      <div style={styles.detailBody}>
        <div style={styles.studentList}>
          {students.length === 0 && (
            <p style={styles.hintText}>
              Nessun allievo caricato (richiede <code>GET /users</code> sul backend).
            </p>
          )}
          {students.map((s) => (
            <div key={s.id} style={styles.studentRow}>
              <span style={styles.dot("#4F7942")} />
              <span>{s.firstName} {s.lastName}</span>
              <span style={styles.studentRowMeta}>{s.email}</span>
            </div>
          ))}
        </div>

        <div style={styles.seam} />

        <form onSubmit={addStudent} style={styles.form}>
          <div style={styles.formRow2}>
            <input placeholder="Nome" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} style={styles.input} required />
            <input placeholder="Cognome" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} style={styles.input} required />
          </div>
          <input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={styles.input} required />
          <div style={styles.formRow2}>
            <input placeholder="Cellulare" value={form.cellNumber} onChange={(e) => setForm({ ...form, cellNumber: e.target.value })} style={styles.input} />
            <input placeholder="Tessera FITP" value={form.fitpCard} onChange={(e) => setForm({ ...form, fitpCard: e.target.value })} style={styles.input} />
          </div>
          <div style={styles.modalActions}>
            <button type="submit" style={styles.primaryBtn} disabled={submitting}>
              {submitting ? "Aggiunta…" : "Aggiungi allievo"}
            </button>
          </div>
        </form>
      </div>
    </ModalShell>
  );
}

/* ---------------- settings modal ---------------- */
function SettingsModal({ apiBase, onSave, onClose }) {
  const [value, setValue] = useState(apiBase);
  return (
    <ModalShell onClose={onClose} title="Impostazioni" subtitle="Indirizzo del backend">
      <form
        style={styles.form}
        onSubmit={(e) => {
          e.preventDefault();
          onSave(value.replace(/\/$/, ""));
        }}
      >
        <div style={styles.formRow}>
          <label style={styles.label}>API base URL</label>
          <input value={value} onChange={(e) => setValue(e.target.value)} style={styles.input} placeholder="***********" />
        </div>
        <div style={styles.modalActions}>
          <button type="submit" style={styles.primaryBtn}>Salva</button>
        </div>
      </form>
    </ModalShell>
  );
}

/* ---------------- shared modal shell ---------------- */
function ModalShell({ title, subtitle, onClose, children }) {
  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHead}>
          <div>
            <h2 style={styles.modalTitle}>{title}</h2>
            {subtitle && <p style={styles.modalSubtitle}>{subtitle}</p>}
          </div>
          <button style={styles.closeBtn} onClick={onClose} aria-label="Chiudi">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ============================================================
   styles
   ============================================================ */
const ROW_H = 56;

const styles = {
  app: {
    display: "flex",
    minHeight: "100vh",
    background: "#F7F4EC",
    color: "#20261F",
    fontFamily: "'Inter', system-ui, sans-serif",
  },
  sidebar: {
    width: 240,
    flexShrink: 0,
    borderRight: "1px solid #DCD5C3",
    padding: "24px 18px",
    display: "flex",
    flexDirection: "column",
    gap: 22,
  },
  brand: { display: "flex", alignItems: "center", gap: 8, padding: "0 4px" },
  brandText: { fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 22, letterSpacing: "-0.02em" },
  newBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    background: "#C1543C",
    color: "#F7F4EC",
    border: "none",
    borderRadius: 10,
    padding: "11px 14px",
    fontWeight: 600,
    fontSize: 14.5,
    cursor: "pointer",
    boxShadow: "0 2px 0 #9C4230",
  },
  navList: { display: "flex", flexDirection: "column", gap: 2 },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    background: "transparent",
    border: "none",
    color: "#3D4439",
    fontSize: 14.5,
    fontWeight: 500,
    padding: "9px 8px",
    borderRadius: 8,
    cursor: "pointer",
    textAlign: "left",
  },
  statsBox: {
    marginTop: "auto",
    background: "#FBF8F0",
    border: "1px solid #DCD5C3",
    borderRadius: 12,
    padding: "14px 14px",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  statsLine: { display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#4A4438" },
  dot: (color) => ({ width: 8, height: 8, borderRadius: 999, background: color, display: "inline-block", flexShrink: 0 }),
  sidebarFoot: { fontSize: 11.5, color: "#A39C8B", lineHeight: 1.5 },

  main: { flex: 1, display: "flex", flexDirection: "column", padding: "26px 30px", minWidth: 0 },
  topbar: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 },
  title: { fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 26, margin: 0, letterSpacing: "-0.01em" },
  weekRange: { color: "#8A8473", fontSize: 14, fontFamily: "'JetBrains Mono', monospace" },
  navBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    border: "1px solid #DCD5C3",
    background: "#FBF8F0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: "#3D4439",
  },
  todayBtn: {
    border: "1px solid #DCD5C3",
    background: "#FBF8F0",
    borderRadius: 8,
    padding: "6px 12px",
    fontSize: 13.5,
    fontWeight: 600,
    cursor: "pointer",
    color: "#3D4439",
  },

  errorBanner: {
    background: "#FBE9E4",
    border: "1px solid #E3B6A6",
    color: "#8A3D26",
    padding: "10px 14px",
    borderRadius: 10,
    fontSize: 13.5,
    marginBottom: 14,
  },

  calendarWrap: { flex: 1, position: "relative", border: "1px solid #DCD5C3", borderRadius: 14, background: "#FFFEFB", overflow: "hidden" },
  grid: { display: "flex", flexDirection: "column", height: "100%", position: "relative" },
  gridHeadRow: { display: "flex", borderBottom: "1px solid #DCD5C3" },
  gutterCell: { width: 56, flexShrink: 0 },
  dayHeadCell: { flex: 1, padding: "10px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, borderLeft: "1px solid #EFE9DA" },
  dayHeadNum: { fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 600 },
  dayHeadNumToday: { color: "#C1543C" },
  dayHeadLabel: { fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: "#A39C8B" },

  gridBody: { display: "flex", flex: 1, overflowY: "auto" },
  gutterCol: { width: 56, flexShrink: 0 },
  hourLabel: { height: ROW_H, fontSize: 11, color: "#A39C8B", textAlign: "right", paddingRight: 8, fontFamily: "'JetBrains Mono', monospace", borderTop: "1px solid #F1ECDF" },
  dayCol: { flex: 1, position: "relative", borderLeft: "1px solid #EFE9DA" },
  hourCell: { height: ROW_H, borderTop: "1px solid #F1ECDF", cursor: "pointer" },

  lessonBlock: {
    position: "absolute",
    left: 4,
    right: 4,
    borderRadius: 8,
    padding: "6px 8px",
    display: "flex",
    flexDirection: "column",
    gap: 2,
    cursor: "pointer",
    textAlign: "left",
    overflow: "hidden",
  },
  lessonBlockTime: { fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 600, opacity: 0.85 },
  lessonBlockNames: { fontSize: 12.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },

  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    padding: "6px 0",
    textAlign: "center",
    fontSize: 12,
    color: "#A39C8B",
    background: "rgba(255,254,251,0.85)",
  },

  overlay: { position: "fixed", inset: 0, background: "rgba(32,38,31,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 16 },
  modal: { background: "#FFFEFB", borderRadius: 16, width: 440, maxWidth: "100%", maxHeight: "86vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" },
  modalHead: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "20px 22px 0" },
  modalTitle: { fontFamily: "'Fraunces', serif", fontSize: 21, fontWeight: 600, margin: 0 },
  modalSubtitle: { fontSize: 13, color: "#8A8473", margin: "4px 0 0" },
  closeBtn: { background: "transparent", border: "none", cursor: "pointer", color: "#8A8473", padding: 4 },

  form: { padding: "18px 22px 22px", display: "flex", flexDirection: "column", gap: 14 },
  formRow: { display: "flex", flexDirection: "column", gap: 6 },
  formRow2: { display: "flex", gap: 10 },
  label: { fontSize: 12.5, fontWeight: 600, color: "#4A4438", textTransform: "uppercase", letterSpacing: "0.04em" },
  input: {
    border: "1px solid #DCD5C3",
    borderRadius: 9,
    padding: "9px 11px",
    fontSize: 14,
    fontFamily: "inherit",
    background: "#FBF8F0",
    color: "#20261F",
    flex: 1,
    outline: "none",
  },
  hintText: { fontSize: 13, color: "#8A8473", lineHeight: 1.5 },

  studentPicker: { display: "flex", flexWrap: "wrap", gap: 7 },
  studentChip: {
    border: "1px solid #DCD5C3",
    background: "#FBF8F0",
    borderRadius: 999,
    padding: "6px 13px",
    fontSize: 13,
    cursor: "pointer",
    color: "#3D4439",
  },
  studentChipActive: { background: "#4F7942", borderColor: "#4F7942", color: "#F7F4EC" },

  modalActions: { display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 4 },
  primaryBtn: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    background: "#C1543C",
    color: "#F7F4EC",
    border: "none",
    borderRadius: 9,
    padding: "10px 16px",
    fontWeight: 600,
    fontSize: 14,
    cursor: "pointer",
  },
  secondaryBtn: { background: "transparent", border: "1px solid #DCD5C3", borderRadius: 9, padding: "10px 16px", fontWeight: 600, fontSize: 14, cursor: "pointer", color: "#3D4439" },
  dangerBtn: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    background: "transparent",
    border: "1px solid #D98A74",
    color: "#A8442D",
    borderRadius: 9,
    padding: "10px 16px",
    fontWeight: 600,
    fontSize: 14,
    cursor: "pointer",
  },

  detailBody: { padding: "16px 22px 22px", display: "flex", flexDirection: "column", gap: 12 },
  detailRow: { display: "flex", alignItems: "center", gap: 10, fontSize: 14.5 },
  seam: { height: 1, background: "repeating-linear-gradient(90deg,#DCD5C3 0 6px,transparent 6px 12px)", margin: "4px 0" },

  studentList: { display: "flex", flexDirection: "column", gap: 8, maxHeight: 180, overflowY: "auto" },
  studentRow: { display: "flex", alignItems: "center", gap: 8, fontSize: 13.5 },
  studentRowMeta: { marginLeft: "auto", color: "#A39C8B", fontSize: 12 },

  toast: {
    position: "fixed",
    bottom: 24,
    left: "50%",
    transform: "translateX(-50%)",
    background: "#20261F",
    color: "#F7F4EC",
    padding: "10px 18px",
    borderRadius: 999,
    fontSize: 13.5,
    fontWeight: 500,
    zIndex: 60,
    boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
  },
  toastError: { background: "#8A3D26" },
};

const globalCss = `
  * { box-sizing: border-box; }
  button:focus-visible, input:focus-visible { outline: 2px solid #4F7942; outline-offset: 2px; }
  button { font-family: inherit; }
  ::-webkit-scrollbar { width: 8px; height: 8px; }
  ::-webkit-scrollbar-thumb { background: #DCD5C3; border-radius: 8px; }
  @media (max-width: 760px) {
    div[style*="width: 240px"] { display: none; }
  }
`;