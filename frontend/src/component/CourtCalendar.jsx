import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Plus, X, Check, Trash2, ChevronLeft, ChevronRight, Settings, Users, Clock, CircleDot, Menu, CalendarDays, Search } from "lucide-react";

/* ============================================================
   CourtCalendar — Pro Corporate Palette Style (Fluent UI UI)
   Layout Backgrounds:
     -- Sidebar & Topbar: #F3F3F3
     -- Calendar Grid:    #FFFFFF
     -- Borders/Lines:    #EDEBE9
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
  const diff = (day === 0 ? -6 : 1) - day; // Lunedì come inizio settimana
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
  const [mobileView, setMobileView] = useState("day"); // "day" | "week"
  const weekStart = useMemo(() => startOfWeek(cursor), [cursor]);
  const days = useMemo(() => {
    if (isMobile && mobileView === "day") {
      const d = new Date(cursor);
      d.setHours(0, 0, 0, 0);
      return [d];
    }
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [cursor, isMobile, mobileView, weekStart]);

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
      // silent
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
      pushToast("Lezione eliminata");
      setActiveLesson(null);
      fetchLessons();
    } catch {
      pushToast("Eliminazione non riuscita", "error");
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

  const isDayView = isMobile && mobileView === "day";
  const todayWeek = useMemo(
    () => (isDayView ? isSameDay(cursor, new Date()) : isSameDay(weekStart, startOfWeek(new Date()))),
    [cursor, isDayView, weekStart]
  );

  function goPrev() {
    setCursor((c) => addDays(c, isDayView ? -1 : -7));
  }
  function goNext() {
    setCursor((c) => addDays(c, isDayView ? 1 : 7));
  }
  function goToday() {
    setCursor(new Date());
  }

  return (
    <div style={styles.app}>
      {/* Sidebar Responsive (Fissa su PC, Cassetto/Drawer a comparsa su Mobile) */}
      <Sidebar
        onNew={() => { setCreateSlot(null); setShowCreate(true); if (isMobile) setShowMenu(false); }}
        onStudents={() => { setShowStudents(true); if (isMobile) setShowMenu(false); }}
        onSettings={() => { setShowSettings(true); if (isMobile) setShowMenu(false); }}
        lessonsCount={lessons.length}
        draftCount={lessons.filter((l) => l.status === "DRAFT").length}
        isMobile={isMobile}
        showMenu={showMenu}
        onClose={() => setShowMenu(false)}
      />

      <main style={{ ...styles.main, ...(isMobile ? styles.mainMobile : {}) }}>
        {/* Topbar (#F3F3F3) */}
        <header style={styles.topbar}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {isMobile && (
              <button style={styles.navBtn} onClick={() => setShowMenu(true)} aria-label="Apri menu">
                <Menu size={18} />
              </button>
            )}
            <h1 style={styles.title}>{fmtMonthYear(weekStart)}</h1>
            {!isMobile && (
              <span style={styles.weekRange}>
                {days.length >= 7 
                  ? `${days[0].toLocaleDateString("it-IT", { day: "numeric", month: "short" })} – ${days[6].toLocaleDateString("it-IT", { day: "numeric", month: "short" })}`
                  : days[0].toLocaleDateString("it-IT", { day: "numeric", month: "long" })
                }
              </span>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {isMobile && (
              <button
                style={{ ...styles.viewToggleBtn, ...(mobileView === "week" ? styles.viewToggleBtnActive : {}) }}
                onClick={() => setMobileView(v => v === "day" ? "week" : "day")}
                title={mobileView === "day" ? "Vista settimana" : "Vista giorno"}
              >
                <CalendarDays size={15} />
                {mobileView === "day" ? "Sett." : "Giorno"}
              </button>
            )}

            <button style={styles.navBtn} onClick={goPrev} aria-label="Precedente">
              <ChevronLeft size={18} />
            </button>
            <button
              style={{ ...styles.todayBtn, opacity: todayWeek ? 0.5 : 1 }}
              onClick={goToday}
              disabled={todayWeek}
            >
              Oggi
            </button>
            <button style={styles.navBtn} onClick={goNext} aria-label="Successivo">
              <ChevronRight size={18} />
            </button>
          </div>
        </header>

        {/* Area Contenuto Calendario (#FFFFFF) */}
        <div style={styles.contentArea}>
          {isMobile && (
            <div style={styles.mobileDateBar}>
              {isDayView
                ? days[0].toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" })
                : `${days[0].toLocaleDateString("it-IT", { day: "numeric", month: "short" })} – ${days[6].toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" })}`
              }
            </div>
          )}

          {error && <div style={styles.errorBanner}>{error}</div>}

          <div style={styles.calendarWrap}>
            <WeekGrid
              days={days}
              lessons={lessons}
              loading={loading}
              onSlotClick={openSlot}
              onLessonClick={setActiveLesson}
              onSwipeLeft={goNext}
              onSwipeRight={goPrev}
            />
          </div>
        </div>
      </main>

      {/* Bottom nav su mobile */}
      {isMobile && (
        <BottomNav
          onNew={() => { setCreateSlot(null); setShowCreate(true); }}
          onStudents={() => setShowStudents(true)}
          onSettings={() => setShowSettings(true)}
          draftCount={lessons.filter((l) => l.status === "DRAFT").length}
        />
      )}

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
function Sidebar({ onNew, onStudents, onSettings, lessonsCount, draftCount, isMobile, showMenu, onClose }) {
  const dynamicSidebarStyle = {
    ...styles.sidebar,
    ...(isMobile ? {
      position: "fixed",
      top: 0,
      left: showMenu ? 0 : -240,
      bottom: 0,
      zIndex: 100,
      boxShadow: showMenu ? "5px 0 25px rgba(0,0,0,0.15)" : "none",
      transition: "left 0.25s ease-in-out",
    } : {})
  };

  return (
    <>
      {isMobile && showMenu && (
        <div style={styles.sidebarOverlay} onClick={onClose} />
      )}

      <aside style={dynamicSidebarStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={styles.brand}>
            <CircleDot size={22} color="#0078D4" strokeWidth={2.5} />
            <span style={styles.brandText}>Court</span>
          </div>
          {isMobile && (
            <button style={styles.closeBtn} onClick={onClose} aria-label="Chiudi menu">
              <X size={18} />
            </button>
          )}
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
            <span style={styles.dot("#00A3A3")} /> {lessonsCount} lezioni questa settimana
          </div>
          <div style={styles.statsLine}>
            <span style={styles.dot("#C99A3C")} /> {draftCount} in bozza
          </div>
        </div>

        <div style={styles.sidebarFoot}>
          Ogni bozza resta in attesa di conferma.<br />Tocca una lezione per gestirla.
        </div>
      </aside>
    </>
  );
}

/* ---------------- bottom nav (mobile) ---------------- */
function BottomNav({ onNew, onStudents, onSettings, draftCount }) {
  return (
    <nav style={styles.bottomNav}>
      <button style={styles.bottomNavItem} onClick={onStudents}>
        <Users size={22} />
        <span style={styles.bottomNavLabel}>Allievi</span>
      </button>

      <button style={styles.bottomNavNewBtn} onClick={onNew} aria-label="Nuova lezione">
        <Plus size={26} strokeWidth={2.5} />
        {draftCount > 0 && <span style={styles.bottomNavBadge}>{draftCount}</span>}
      </button>

      <button style={styles.bottomNavItem} onClick={onSettings}>
        <Settings size={22} />
        <span style={styles.bottomNavLabel}>Impostazioni</span>
      </button>
    </nav>
  );
}

/* ---------------- week grid ---------------- */
function WeekGrid({ days, lessons, loading, onSlotClick, onLessonClick, onSwipeLeft, onSwipeRight }) {
  const today = new Date();
  const touchRef = React.useRef(null);

  function lessonsForDay(day) {
    return lessons
      .filter((l) => isSameDay(l.startTime, day))
      .sort((a, b) => a.startTime - b.startTime);
  }

  function handleTouchStart(e) {
    touchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }

  function handleTouchEnd(e) {
    if (!touchRef.current) return;
    const dx = e.changedTouches[0].clientX - touchRef.current.x;
    const dy = Math.abs(e.changedTouches[0].clientY - touchRef.current.y);
    if (Math.abs(dx) > 50 && Math.abs(dx) > dy) {
      if (dx < 0) onSwipeLeft?.();
      else onSwipeRight?.();
    }
    touchRef.current = null;
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

      <div
        style={styles.gridBody}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
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
        background: isDraft ? "#FFFDF0" : "#00A3A3",
        border: isDraft ? "1.5px dashed #C99A3C" : "none",
        color: isDraft ? "#605E5C" : "#ffffff",
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
            <p style={styles.hintText}>Nessun allievo disponibile.</p>
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
          <Clock size={16} color="#605E5C" />
          <span>
            {fmtTime(lesson.startTime)} – {fmtTime(lesson.endTime)}
          </span>
        </div>
        <div style={styles.detailRow}>
          <Users size={16} color="#605E5C" />
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
          <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
            <p style={styles.hintText}>Questa lezione è confermata.</p>
            <button style={styles.dangerBtn} onClick={onDelete}>
              <Trash2 size={16} /> Elimina
            </button>
          </div>
        )}
      </div>
    </ModalShell>
  );
}

/* ---------------- students modal ---------------- */
function StudentsModal({ apiBase, students, onRefresh, onClose, pushToast }) {
  const [tab, setTab] = useState("list"); 
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", cellNumber: "", fitpCard: "" });
  const [submitting, setSubmitting] = useState(false);

  const filtered = students.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.firstName?.toLowerCase().includes(q) ||
      s.lastName?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q)
    );
  });

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
      setTab("list");
    } catch {
      pushToast("Aggiunta non riuscita", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ModalShell onClose={onClose} title="Allievi" subtitle={`${students.length} allievi registrati`}>
      <div style={styles.tabBar}>
        <button
          style={{ ...styles.tabBtn, ...(tab === "list" ? styles.tabBtnActive : {}) }}
          onClick={() => setTab("list")}
        >
          <Users size={15} /> Elenco
        </button>
        <button
          style={{ ...styles.tabBtn, ...(tab === "add" ? styles.tabBtnActive : {}) }}
          onClick={() => setTab("add")}
        >
          <Plus size={15} /> Nuovo allievo
        </button>
      </div>

      {tab === "list" && (
        <div style={{ padding: "0 22px 22px", display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={styles.searchBox}>
            <Search size={15} color="#605E5C" style={{ flexShrink: 0 }} />
            <input
              placeholder="Cerca per nome, cognome o email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ ...styles.input, background: "transparent", border: "none", padding: "0", flex: 1 }}
            />
          </div>

          <div style={{ ...styles.studentList, maxHeight: 340 }}>
            {students.length === 0 && (
              <p style={styles.hintText}>Nessun allievo trovato.</p>
            )}
            {filtered.length === 0 && students.length > 0 && (
              <p style={styles.hintText}>Nessun risultato per "{search}".</p>
            )}
            {filtered.map((s) => (
              <div key={s.id} style={styles.studentCard}>
                <div style={styles.studentCardAvatar}>
                  {(s.firstName?.[0] || "?").toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{s.firstName} {s.lastName}</div>
                  <div style={{ fontSize: 12, color: "#605E5C", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {s.email}{s.cellNumber ? ` · ${s.cellNumber}` : ""}
                  </div>
                  {s.fitpCard && (
                    <div style={{ fontSize: 11, color: "#605E5C", marginTop: 1 }}>FITP {s.fitpCard}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "add" && (
        <form onSubmit={addStudent} style={styles.form}>
          <div style={styles.formRow2}>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={styles.label}>Nome</label>
              <input placeholder="Mario" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} style={styles.input} required />
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={styles.label}>Cognome</label>
              <input placeholder="Rossi" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} style={styles.input} required />
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={styles.label}>Email</label>
            <input placeholder="mario@email.com" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={styles.input} required />
          </div>
          <div style={styles.formRow2}>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={styles.label}>Cellulare</label>
              <input placeholder="+39 333 000000" value={form.cellNumber} onChange={(e) => setForm({ ...form, cellNumber: e.target.value })} style={styles.input} />
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={styles.label}>Tessera FITP</label>
              <input placeholder="IT12345" value={form.fitpCard} onChange={(e) => setForm({ ...form, fitpCard: e.target.value })} style={styles.input} />
            </div>
          </div>
          <div style={styles.modalActions}>
            <button type="button" style={styles.secondaryBtn} onClick={() => setTab("list")}>Annulla</button>
            <button type="submit" style={styles.primaryBtn} disabled={submitting}>
              {submitting ? "Aggiunta…" : "Aggiungi allievo"}
            </button>
          </div>
        </form>
      )}
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
  const isMobile = useIsMobile();
  return (
    <div style={{ ...styles.overlay, ...(isMobile ? styles.overlayMobile : {}) }} onClick={onClose}>
      <div
        style={{ ...styles.modal, ...(isMobile ? styles.modalMobile : {}) }}
        onClick={(e) => e.stopPropagation()}
      >
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
   styles — Fluent Corporate Clean Style (#F3F3F3 / #FFFFFF)
   ============================================================ */
const ROW_H = 56;

const styles = {
  app: {
    display: "flex",
    minHeight: "100vh",
    background: "#FFFFFF",
    color: "#323130",
    fontFamily: "'Inter', system-ui, sans-serif",
  },
  sidebar: {
    width: 240,
    flexShrink: 0,
    borderRight: "1px solid #EDEBE9",
    padding: "24px 18px",
    display: "flex",
    flexDirection: "column",
    gap: 22,
    background: "#F3F3F3", // Modificato come richiesto
  },
  sidebarOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.25)",
    zIndex: 99,
  },
  brand: { display: "flex", alignItems: "center", gap: 8, padding: "0 4px" },
  brandText: { fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 22, letterSpacing: "-0.02em", color: "#323130" },
  newBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    background: "#0078D4",
    color: "#ffffff",
    border: "none",
    borderRadius: 6,
    padding: "11px 14px",
    fontWeight: 600,
    fontSize: 14.5,
    cursor: "pointer",
  },
  navList: { display: "flex", flexDirection: "column", gap: 2 },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    background: "transparent",
    border: "none",
    color: "#323130",
    fontSize: 14.5,
    fontWeight: 500,
    padding: "9px 8px",
    borderRadius: 6,
    cursor: "pointer",
    textAlign: "left",
  },
  statsBox: {
    marginTop: "auto",
    background: "#FFFFFF",
    border: "1px solid #EDEBE9",
    borderRadius: 8,
    padding: "14px",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  statsLine: { display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#605E5C" },
  dot: (color) => ({ width: 8, height: 8, borderRadius: 999, background: color, display: "inline-block", flexShrink: 0 }),
  sidebarFoot: { fontSize: 11.5, color: "#605E5C", lineHeight: 1.5 },

  main: { 
    flex: 1, 
    display: "flex", 
    flexDirection: "column", 
    background: "#FFFFFF", // Griglia e corpo principale bianchi
    minWidth: 0, 
  },
  topbar: { 
    display: "flex", 
    alignItems: "center", 
    justifyContent: "space-between", 
    background: "#F3F3F3", // Modificato come richiesto
    padding: "16px 24px",
    borderBottom: "1px solid #EDEBE9",
  },
  contentArea: {
    flex: 1,
    padding: "20px 24px",
    display: "flex",
    flexDirection: "column",
    background: "#FFFFFF",
  },
  title: { fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 24, margin: 0, letterSpacing: "-0.01em", color: "#323130" },
  weekRange: { color: "#605E5C", fontSize: 14, fontFamily: "'JetBrains Mono', monospace" },
  navBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    border: "1px solid #EDEBE9",
    background: "#FFFFFF",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: "#323130",
  },
  todayBtn: {
    border: "1px solid #EDEBE9",
    background: "#FFFFFF",
    borderRadius: 6,
    padding: "6px 12px",
    fontSize: 13.5,
    fontWeight: 600,
    cursor: "pointer",
    color: "#323130",
  },

  errorBanner: {
    background: "#FDE7E9",
    border: "1px solid #FBC2C4",
    color: "#A80000",
    padding: "10px 14px",
    borderRadius: 6,
    fontSize: 13.5,
    marginBottom: 14,
  },

  calendarWrap: { flex: 1, position: "relative", border: "1px solid #EDEBE9", borderRadius: 8, background: "#FFFFFF", overflow: "hidden" },
  grid: { display: "flex", flexDirection: "column", height: "100%", position: "relative", background: "#FFFFFF" },
  gridHeadRow: { display: "flex", borderBottom: "1px solid #EDEBE9", background: "#F3F3F3" },
  gutterCell: { width: 56, flexShrink: 0 },
  dayHeadCell: { flex: 1, padding: "10px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, borderLeft: "1px solid #EDEBE9" },
  dayHeadNum: { fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 600, color: "#323130" },
  dayHeadNumToday: { color: "#0078D4" },
  dayHeadLabel: { fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: "#605E5C" },

  gridBody: { display: "flex", flex: 1, overflowY: "auto", background: "#FFFFFF" },
  gutterCol: { width: 56, flexShrink: 0, background: "#F3F3F3" },
  hourLabel: { height: ROW_H, fontSize: 11, color: "#605E5C", textAlign: "right", paddingRight: 8, fontFamily: "'JetBrains Mono', monospace", borderTop: "1px solid #EDEBE9" },
  dayCol: { flex: 1, position: "relative", borderLeft: "1px solid #EDEBE9", background: "#FFFFFF" },
  hourCell: { height: ROW_H, borderTop: "1px solid #EDEBE9", cursor: "pointer" },

  lessonBlock: {
    position: "absolute",
    left: 4,
    right: 4,
    borderRadius: 4,
    padding: "6px 8px",
    display: "flex",
    flexDirection: "column",
    gap: 2,
    cursor: "pointer",
    textAlign: "left",
    overflow: "hidden",
  },
  lessonBlockTime: { fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 600, opacity: 0.9 },
  lessonBlockNames: { fontSize: 12.5, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },

  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    padding: "6px 0",
    textAlign: "center",
    fontSize: 12,
    color: "#605E5C",
    background: "rgba(255,255,255,0.85)",
  },

  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 150, padding: 16 },
  modal: { background: "#FFFFFF", borderRadius: 8, width: 440, maxWidth: "100%", maxHeight: "86vh", overflowY: "auto", boxShadow: "0 10px 30px rgba(0,0,0,0.15)" },
  modalHead: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "20px 22px 0" },
  modalTitle: { fontFamily: "'Fraunces', serif", fontSize: 21, fontWeight: 600, margin: 0, color: "#323130" },
  modalSubtitle: { fontSize: 13, color: "#605E5C", margin: "4px 0 0" },
  closeBtn: { background: "transparent", border: "none", cursor: "pointer", color: "#605E5C", padding: 4 },

  form: { padding: "18px 22px 22px", display: "flex", flexDirection: "column", gap: 14 },
  formRow: { display: "flex", flexDirection: "column", gap: 6 },
  formRow2: { display: "flex", gap: 10 },
  label: { fontSize: 12.5, fontWeight: 600, color: "#323130", textTransform: "uppercase", letterSpacing: "0.04em" },
  input: {
    border: "1px solid #EDEBE9",
    borderRadius: 6,
    padding: "9px 11px",
    fontSize: 14,
    fontFamily: "inherit",
    background: "#F3F3F3",
    color: "#323130",
    flex: 1,
    outline: "none",
  },
  hintText: { fontSize: 13, color: "#605E5C", lineHeight: 1.5 },

  studentPicker: { display: "flex", flexWrap: "wrap", gap: 7 },
  studentChip: {
    border: "1px solid #EDEBE9",
    background: "#F3F3F3",
    borderRadius: 999,
    padding: "6px 13px",
    fontSize: 13,
    cursor: "pointer",
    color: "#323130",
  },
  studentChipActive: { background: "#0078D4", borderColor: "#0078D4", color: "#ffffff" },

  modalActions: { display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 4 },
  primaryBtn: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    background: "#0078D4",
    color: "#ffffff",
    border: "none",
    borderRadius: 6,
    padding: "10px 16px",
    fontWeight: 600,
    fontSize: 14,
    cursor: "pointer",
  },
  secondaryBtn: { background: "transparent", border: "1px solid #EDEBE9", borderRadius: 6, padding: "10px 16px", fontWeight: 600, fontSize: 14, cursor: "pointer", color: "#323130" },
  dangerBtn: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    background: "transparent",
    border: "1px solid #FBC2C4",
    color: "#A80000",
    borderRadius: 6,
    padding: "10px 16px",
    fontWeight: 600,
    fontSize: 14,
    cursor: "pointer",
  },

  detailBody: { padding: "16px 22px 22px", display: "flex", flexDirection: "column", gap: 12 },
  detailRow: { display: "flex", alignItems: "center", gap: 10, fontSize: 14.5 },
  seam: { height: 1, background: "repeating-linear-gradient(90deg,#EDEBE9 0 6px,transparent 6px 12px)", margin: "4px 0" },

  studentList: { display: "flex", flexDirection: "column", gap: 8, maxHeight: 180, overflowY: "auto" },
  studentRow: { display: "flex", alignItems: "center", gap: 8, fontSize: 13.5 },

  toast: {
    position: "fixed",
    bottom: 24,
    left: "50%",
    transform: "translateX(-50%)",
    background: "#323130",
    color: "#ffffff",
    padding: "10px 18px",
    borderRadius: 4,
    fontSize: 13.5,
    fontWeight: 500,
    zIndex: 160,
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
  },
  toastError: { background: "#A80000" },

  /* ---- mobile layout ---- */
  mainMobile: { padding: 0 },

  mobileDateBar: {
    fontSize: 14,
    fontWeight: 600,
    color: "#605E5C",
    padding: "10px 16px 0",
    textTransform: "capitalize",
    fontFamily: "'Fraunces', serif",
  },

  viewToggleBtn: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    border: "1px solid #EDEBE9",
    background: "#FFFFFF",
    borderRadius: 6,
    padding: "6px 10px",
    fontSize: 12.5,
    fontWeight: 600,
    cursor: "pointer",
    color: "#323130",
  },
  viewToggleBtnActive: {
    background: "#323130",
    borderColor: "#323130",
    color: "#ffffff",
  },

  /* ---- bottom nav ---- */
  bottomNav: {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    background: "#F3F3F3",
    borderTop: "1px solid #EDEBE9",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-around",
    zIndex: 40,
    paddingBottom: "env(safe-area-inset-bottom)",
  },
  bottomNavItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 3,
    background: "transparent",
    border: "none",
    cursor: "pointer",
    color: "#605E5C",
    padding: "4px 20px",
  },
  bottomNavLabel: { fontSize: 10.5, fontWeight: 600, letterSpacing: "0.02em" },
  bottomNavNewBtn: {
    position: "relative",
    width: 44,
    height: 44,
    borderRadius: 999,
    background: "#0078D4",
    color: "#ffffff",
    border: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    marginBottom: 4,
  },
  bottomNavBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    background: "#C99A3C",
    color: "#ffffff",
    borderRadius: 999,
    fontSize: 10,
    fontWeight: 700,
    minWidth: 16,
    height: 16,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0 3px",
  },

  overlayMobile: { alignItems: "flex-end", padding: 0 },
  modalMobile: {
    width: "100%",
    maxWidth: "100%",
    borderRadius: "12px 12px 0 0",
    maxHeight: "85vh",
  },

  tabBar: {
    display: "flex",
    margin: "14px 22px 0",
    background: "#EDEBE9",
    borderRadius: 6,
    padding: 3,
    gap: 3,
  },
  tabBtn: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    border: "none",
    background: "transparent",
    borderRadius: 4,
    padding: "8px 0",
    fontSize: 13.5,
    fontWeight: 600,
    cursor: "pointer",
    color: "#605E5C",
  },
  tabBtnActive: {
    background: "#FFFFFF",
    color: "#323130",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  },

  searchBox: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    border: "1px solid #EDEBE9",
    borderRadius: 6,
    padding: "8px 11px",
    background: "#F3F3F3",
    marginTop: 14,
  },
  studentCard: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "10px 0",
    borderBottom: "1px solid #EDEBE9",
  },
  studentCardAvatar: {
    width: 36,
    height: 36,
    borderRadius: 999,
    background: "#0078D4",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: 14,
    flexShrink: 0,
  },
};

const globalCss = `
  * { box-sizing: border-box; }
  button:focus-visible, input:focus-visible { outline: 2px solid #0078D4; outline-offset: 2px; }
  button { font-family: inherit; }
  ::-webkit-scrollbar { width: 8px; height: 8px; }
  ::-webkit-scrollbar-thumb { background: #EDEBE9; border-radius: 4px; }
  .grid-body { touch-action: pan-y; }
`;