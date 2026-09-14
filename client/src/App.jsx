import { useEffect, useMemo, useState } from "react";
import { api } from "./api.js";
import "./styles.css";

const emptyMeeting = () => ({
  meetingNumber: "",
  date: new Date().toISOString().slice(0, 10),
  ticketNumber: "",
  recap: "",
  sales: { newLeads: "", negotiation: "", closed: "", lost: "", upcoming: "", blockers: "" },
  marketing: { activity: "", results: "", learnings: "", nextStrategy: "", blockers: "" },
  hosting: { renewals: "", renewalPlan: "", newSignups: "", cancelled: "", supportTickets: "", blockers: "" },
  currentProjects: [],
  newClientLeads: "",
  productPipeline: [],
  liveProducts: [],
  plansAhead: "",
  teamCheckIn: "",
  knowledgeSession: { topic: "", nextTopic: "", presenter: "" },
  quoteOfTheWeek: "",
  employeeReports: [],
  actionItems: [],
  foundersNotes: "",
  closingNotes: "",
});

const labels = {
  newLeads: "New leads this week",
  negotiation: "In discussion / negotiation",
  closed: "Closed this week",
  lost: "Lost / dropped (and why)",
  upcoming: "Upcoming leads / deals (not yet in discussion)",
  blockers: "Blockers",
  activity: "What we ran this week (ads / campaigns / content)",
  results: "Results (leads, spend, cost per lead)",
  learnings: "What's working / what's not",
  nextStrategy: "Strategy or experiment for next week",
  renewals: "Renewals / expiries in next 30 days",
  renewalPlan: "Plan to tackle each (renewal calls, discounts, upsell)",
  newSignups: "New signups this week",
  cancelled: "Cancelled this week",
  supportTickets: "Open support tickets / incidents",
};

const dateOnly = (value) => (value ? String(value).slice(0, 10) : "");
const formatDate = (value) =>
  value
    ? new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value))
    : "—";
const formatDateTime = (value) =>
  value
    ? new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value))
    : "—";
const formatMeetingNo = (num) => (num ? String(num).padStart(3, "0") : "001");
const safeText = (value) => value || "—";

function normalizeMeeting(meeting) {
  const base = emptyMeeting();
  if (!meeting) return base;
  return {
    ...base,
    ...meeting,
    date: dateOnly(meeting.date),
    sales: { ...base.sales, ...(meeting.sales || {}) },
    marketing: { ...base.marketing, ...(meeting.marketing || {}) },
    hosting: { ...base.hosting, ...(meeting.hosting || {}) },
    knowledgeSession: { ...base.knowledgeSession, ...(meeting.knowledgeSession || {}) },
    currentProjects: (meeting.currentProjects || []).map((item) => ({ ...item, dueDate: dateOnly(item.dueDate) })),
    actionItems: (meeting.actionItems || []).map((item) => ({ ...item, dueDate: dateOnly(item.dueDate) })),
  };
}

function Button({ children, variant = "primary", className = "", ...props }) {
  return <button className={`button ${variant} ${className}`} {...props}>{children}</button>;
}

function Notice({ children, type = "error" }) {
  return <div className={`notice ${type}`}>{children}</div>;
}

function Badge({ status }) {
  const displayStatus = status === "published" ? "Published" : status === "draft" ? "Draft" : String(status || "draft").replaceAll("_", " ");
  return <span className={`badge ${status}`}>{displayStatus}</span>;
}

/* Icon components for attractive corporate buttons */
function LogoIcon({ src = "/logo2.png", className = "custom-brand-logo" }) {
  const [logoError, setLogoError] = useState(false);

  if (!logoError) {
    return (
      <img
        src={src}
        alt="Raftaar Cloud Logo"
        className={className}
        onError={() => setLogoError(true)}
      />
    );
  }

  return (
    <div className="brand-logo-icon">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>
      </svg>
    </div>
  );
}

function PdfIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
      <line x1="10" y1="11" x2="10" y2="17"/>
      <line x1="14" y1="11" x2="14" y2="17"/>
    </svg>
  );
}

function EditIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  );
}

function PublishIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  );
}

function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const { user } = await api("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
      onLogin(user);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="login-shell">
      <section className="login-card-centered card">
        <div className="login-card-header-centered">
          <LogoIcon src="/logo2.png" className="login-custom-logo" />
          <h2 className="login-brand-title">Raftaar Cloud</h2>
          <p className="login-sub-brand">Weekly Meeting Records</p>
          <p className="login-credentials-sub">Sign in with your approved company credentials.</p>
        </div>
        {error && <Notice>{error}</Notice>}
        <form onSubmit={submit} className="stack-form">
          <label htmlFor="login-email">Company email
            <input id="login-email" required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@raftaarcloud.com" />
          </label>
          <label htmlFor="login-password">Password
            <input id="login-password" required type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" />
          </label>
          <Button disabled={busy} type="submit">{busy ? "Signing in…" : "Sign in"}</Button>
        </form>
        <p className="tiny" style={{ textAlign: "center", marginTop: "24px" }}>
          Only the Operations Manager can create employee accounts. There is no public registration.
        </p>
      </section>
    </main>
  );
}

function Dashboard({ user, onOpen, onNew, onUsers }) {
  const isManager = Boolean(user.canManageOperations);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [week, setWeek] = useState("");
  const [dayDate, setDayDate] = useState("");
  const [state, setState] = useState({ meetings: [], total: 0, totalPublished: 0, activeEmployeeCount: 0, loading: true, error: "" });

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (status) params.set("status", status);
    if (year) params.set("year", year);
    if (month) params.set("month", month);
    if (week) params.set("week", week);
    if (dayDate) params.set("date", dayDate);
    api(`/meetings?${params.toString()}`)
      .then((data) =>
        active &&
        setState({
          meetings: data.meetings,
          total: data.total,
          totalPublished: data.totalPublished ?? data.meetings.filter((meeting) => meeting.status === "published").length,
          activeEmployeeCount: data.activeEmployeeCount ?? 0,
          loading: false,
          error: "",
        })
      )
      .catch((error) => active && setState((current) => ({ ...current, loading: false, error: error.message })));
    return () => { active = false; };
  }, [query, status, year, month, week, dayDate]);

  function clearFilters() {
    setQuery("");
    setStatus("");
    setYear("");
    setMonth("");
    setWeek("");
    setDayDate("");
  }

  const monthsList = [
    { value: "1", label: "January" },
    { value: "2", label: "February" },
    { value: "3", label: "March" },
    { value: "4", label: "April" },
    { value: "5", label: "May" },
    { value: "6", label: "June" },
    { value: "7", label: "July" },
    { value: "8", label: "August" },
    { value: "9", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];

  const handleMonthChange = (val) => {
    setMonth(val);
    setWeek(""); // Reset week selection when month changes
  };

  const getWeekOptions = () => {
    if (!month) {
      return [
        { value: "1", label: "Week 1" },
        { value: "2", label: "Week 2" },
        { value: "3", label: "Week 3" },
        { value: "4", label: "Week 4" },
        { value: "5", label: "Week 5" },
      ];
    }
    const monthObj = monthsList.find((m) => m.value === month);
    const monthName = monthObj ? monthObj.label : "Month";
    return [
      { value: "1", label: `Week 1 (${monthName} 1–7)` },
      { value: "2", label: `Week 2 (${monthName} 8–14)` },
      { value: "3", label: `Week 3 (${monthName} 15–21)` },
      { value: "4", label: `Week 4 (${monthName} 22–28)` },
      { value: "5", label: `Week 5 (${monthName} 29–31)` },
    ];
  };

  return (
    <main className="page-shell">
      <section className="dashboard-hero card">
        <div className="hero-main">
          <span className="eyebrow">{isManager ? "OPERATIONS MANAGER WORKSPACE" : "EMPLOYEE WORKSPACE"}</span>
          <h1>Raftaar Cloud Weekly Meeting Records</h1>
          <p className="hero-subtitle">One record of what was discussed, decided, and delivered.</p>
          <p className="hero-description">
            {isManager
              ? "Manage weekly meeting records, employee access, project updates, and outstanding action items."
              : "Stay aligned with the week ahead. Review meeting outcomes, project updates, decisions, and action items shared by the Operations Manager."}
          </p>
        </div>
        {isManager && (
          <div className="hero-actions">
            <Button variant="secondary" onClick={onUsers}>Manage Employees</Button>
            <Button onClick={onNew}>+ Record New Meeting</Button>
          </div>
        )}
      </section>

      <section className="stats-grid">
        <article
          className={`stat-card clickable ${status === "" ? "active-stat" : ""}`}
          onClick={() => setStatus("")}
          title="Click to view all meeting records"
        >
          <span className="stat-label">TOTAL MEETING RECORDS</span>
          <strong className="stat-value">{state.total}</strong>
          <small className="stat-subtext">Click to view all meeting records</small>
        </article>
        <article
          className={`stat-card clickable ${status === "published" ? "active-stat" : ""}`}
          onClick={() => setStatus("published")}
          title="Click to view only published meeting records"
        >
          <span className="stat-label">TOTAL PUBLISHED RECORDS</span>
          <strong className="stat-value">{state.totalPublished}</strong>
          <small className="stat-subtext">Click to view stored published records</small>
        </article>
        <article
          className="stat-card clickable"
          onClick={() => isManager && onUsers()}
          title="Click to manage employee accounts"
        >
          <span className="stat-label">TOTAL EMPLOYEES</span>
          <strong className="stat-value">{state.activeEmployeeCount}</strong>
          <small className="stat-subtext">Click to manage employee accounts</small>
        </article>
      </section>

      <section className="filters card">
        <div className="filter-item search-box">
          <label htmlFor="search-input">Search</label>
          <div className="search-input-wrapper">
            <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              id="search-input"
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search meeting records, projects, employees, action items..."
            />
          </div>
        </div>
        <div className="filter-item year-box">
          <label htmlFor="year-input">Year</label>
          <input
            id="year-input"
            type="text"
            value={year}
            onChange={(event) => setYear(event.target.value.replace(/\D/g, "").slice(0, 4))}
            placeholder="2026"
          />
        </div>
        <div className="filter-item month-box">
          <label htmlFor="month-select">Month</label>
          <select id="month-select" value={month} onChange={(event) => handleMonthChange(event.target.value)}>
            <option value="">All months</option>
            {monthsList.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>
        <div className="filter-item week-box">
          <label htmlFor="week-select">Week</label>
          <select id="week-select" value={week} onChange={(event) => setWeek(event.target.value)}>
            <option value="">All weeks</option>
            {getWeekOptions().map((w) => (
              <option key={w.value} value={w.value}>{w.label}</option>
            ))}
          </select>
        </div>
        <div className="filter-item day-box">
          <label htmlFor="day-input">Specific Date</label>
          <input
            id="day-input"
            type="date"
            value={dayDate}
            onChange={(event) => setDayDate(event.target.value)}
          />
        </div>
        {isManager && (
          <div className="filter-item status-box">
            <label htmlFor="status-select">Status</label>
            <select
              id="status-select"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="">All meeting records</option>
              <option value="draft">Drafts</option>
              <option value="published">Published records</option>
              <option value="archived">Archived records</option>
            </select>
          </div>
        )}
        {month && (
          <div className="filter-item no-print">
            <Button variant="secondary" onClick={() => window.print()}>
              <PdfIcon /> Print {monthsList.find((m) => m.value === month)?.label} Records (PDF)
            </Button>
          </div>
        )}
        {(query || year || month || week || dayDate || status) && (
          <div className="filter-item reset-box">
            <Button variant="ghost" onClick={clearFilters}>Reset Filters</Button>
          </div>
        )}
      </section>

      {state.error && <Notice>{state.error}</Notice>}

      <section className="records-header-row">
        <h2>
          {status === "published"
            ? "Published Meeting Records"
            : status === "draft"
            ? "Draft Meeting Records"
            : status === "archived"
            ? "Archived Meeting Records"
            : "Weekly Meeting History"}
        </h2>
        <span className="muted">
          {status === "published"
            ? "Displaying all meeting records published and stored in the database."
            : "Review and manage the company's weekly meeting records."}
        </span>
      </section>

      <section className="record-list">
        {state.loading ? (
          <p className="empty-state">Loading meeting records…</p>
        ) : state.meetings.length === 0 ? (
          <div className="empty-state">
            <h3>No meeting records found</h3>
            <p>{isManager ? "Record the first weekly meeting to begin your company's official history." : "Try adjusting your search query or filters."}</p>
            {isManager && <Button onClick={onNew}>+ Record New Meeting</Button>}
          </div>
        ) : (
          state.meetings.map((meeting) => (
            <button className="record-card" key={meeting._id} onClick={() => onOpen(meeting._id)}>
              <div className="record-card-meta">
                <span className="record-num">WEEKLY MEETING · #{formatMeetingNo(meeting.meetingNumber)}</span>
                <Badge status={meeting.status} />
              </div>
              <h3 className="record-card-title">
                {meeting.ticketNumber ? `Weekly Operations Review (${meeting.ticketNumber})` : "Weekly Operations Review"}
              </h3>
              <div className="record-card-date">{formatDate(meeting.date)}</div>
              <p className="record-card-summary">
                {meeting.recap || "Reviewed current project progress, discussed operational priorities, and confirmed action items for the coming week."}
              </p>
              <div className="record-footer">
                <span>{meeting.status === "published" ? "Published" : meeting.status === "archived" ? "Archived" : "Draft"}</span>
                <span className="chip-divider">·</span>
                <span>Last updated {formatDate(meeting.updatedAt)}</span>
              </div>
            </button>
          ))
        )}
      </section>
    </main>
  );
}

function TextArea({ label, value, onChange, placeholder = "Add details…" }) {
  return <label className="field wide"><span>{label}</span><textarea rows="3" value={value || ""} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} /></label>;
}

function TextInput({ label, value, onChange, type = "text", required = false, placeholder = "" }) {
  return <label className="field"><span>{label}</span><input type={type} required={required} value={value || ""} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} /></label>;
}

function DetailFields({ title, value, keys }) {
  return (
    <section className="detail-section">
      <h3>{title}</h3>
      <dl className="detail-grid">
        {keys.map((key) => (
          <div key={key}>
            <dt>{labels[key] || key}</dt>
            <dd>{safeText(value?.[key])}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function ArrayEditor({ title, description, items, onChange, fields, createItem }) {
  function update(index, key, value) {
    onChange(items.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item));
  }
  return (
    <section className="editor-section">
      <div className="section-heading">
        <div>
          <h3>{title}</h3>
          {description && <p className="section-subtext">{description}</p>}
        </div>
        <Button type="button" variant="secondary" onClick={() => onChange([...items, createItem()])}>+ Add row</Button>
      </div>
      {items.length === 0 ? (
        <p className="editor-empty">No entries yet.</p>
      ) : (
        <div className="table-wrap">
          <table className="editor-table">
            <thead>
              <tr>{fields.map((field) => <th key={field.key}>{field.label}</th>)}<th /></tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={item._id || index}>
                  {fields.map((field) => (
                    <td key={field.key}>
                      {field.options ? (
                        <select value={item[field.key] || field.options[0].value} onChange={(event) => update(index, field.key, event.target.value)}>
                          {field.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                        </select>
                      ) : (
                        <input type={field.type || "text"} value={item[field.key] || ""} onChange={(event) => update(index, field.key, event.target.value)} />
                      )}
                    </td>
                  ))}
                  <td>
                    <button className="icon-button" type="button" aria-label={`Remove ${title} row`} onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}>×</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function MeetingEditor({ meeting, onCancel, onSaved }) {
  const isNew = !meeting?._id;
  const [draft, setDraft] = useState(() => normalizeMeeting(meeting));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const setValue = (key, value) => setDraft((current) => ({ ...current, [key]: value }));
  const setNested = (section, key, value) => setDraft((current) => ({ ...current, [section]: { ...current[section], [key]: value } }));

  async function save(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const method = isNew ? "POST" : "PUT";
      const path = isNew ? "/meetings" : `/meetings/${meeting._id}`;
      const { meeting: saved } = await api(path, { method, body: JSON.stringify({ ...draft, meetingNumber: Number(draft.meetingNumber) }) });
      onSaved(saved._id);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  const projectFields = [
    { key: "type", label: "Type" },
    { key: "project", label: "Project / Client" },
    { key: "workDetails", label: "Work Details" },
    { key: "owner", label: "Owner" },
    { key: "dueDate", label: "ETA / Due", type: "date" },
    { key: "status", label: "Status", options: ["planning", "in_progress", "blocked", "done", "on_hold"].map((value) => ({ value, label: value.replaceAll("_", " ") })) },
  ];

  const actionFields = [
    { key: "description", label: "Action Item" },
    { key: "owner", label: "Owner" },
    { key: "dueDate", label: "Due", type: "date" },
    { key: "status", label: "Status", options: ["not_started", "in_progress", "complete", "blocked"].map((value) => ({ value, label: value.replaceAll("_", " ") })) },
  ];

  return (
    <main className="page-shell editor-page">
      <section className="editor-top no-print">
        <span className="eyebrow">{isNew ? "NEW RECORDING" : `EDITING RECORD #${formatMeetingNo(meeting.meetingNumber)}`}</span>
        <h1>{isNew ? "Record Weekly Meeting" : `Weekly Meeting · #${formatMeetingNo(meeting.meetingNumber)}`}</h1>
        <p>Capture the key discussions, project updates, decisions, and action items from this week's meeting. Save a draft while in progress, and publish when ready for employee viewing.</p>
      </section>

      {/* Official Corporate Template Header Box */}
      <div className="template-header-box card">
        <div className="template-brand">
          <div className="template-brand-title">WEEKLY OPS REVIEW</div>
          <div className="template-brand-sub">RaftaarCloud & RaftaarScalers</div>
        </div>
        <div className="template-header-fields">
          <span>Meeting #: <strong>{draft.meetingNumber ? `#${formatMeetingNo(draft.meetingNumber)}` : "—"}</strong></span>
          <span>Date: <strong>{formatDate(draft.date)}</strong></span>
          <span>Ticket #: <strong>{draft.ticketNumber || "—"}</strong></span>
        </div>
      </div>

      {error && <Notice>{error}</Notice>}

      <form onSubmit={save}>
        <section className="editor-section top-fields">
          <TextInput label="Meeting number" type="number" required value={draft.meetingNumber} onChange={(value) => setValue("meetingNumber", value)} placeholder="e.g. 3" />
          <TextInput label="Meeting date" type="date" required value={draft.date} onChange={(value) => setValue("date", value)} />
          <TextInput label="Ticket / Reference number" value={draft.ticketNumber} onChange={(value) => setValue("ticketNumber", value)} placeholder="e.g. 786" />
        </section>

        {/* Section 1 */}
        <section className="editor-section">
          <h3>1. RECAP — LAST WEEK'S PERFORMANCE</h3>
          <p className="section-subtext">Ops manager opens with a quick narrative: what got done, what didn't, and why.</p>
          <TextArea label="Narrative recap" value={draft.recap} onChange={(value) => setValue("recap", value)} placeholder="What got done, what didn't, and why..." />
        </section>

        {/* Section 2 */}
        <section className="editor-section">
          <h3>2. RAFTAARSCALERS — SALES & NEW BUSINESS</h3>
          <p className="section-subtext">Web apps, mobile apps, digital marketing, MSP projects and all other RaftaarScalers work. (Hosting signups are tracked separately in Section 4.)</p>
          <div className="field-grid">
            <TextArea label="New leads this week" value={draft.sales.newLeads} onChange={(val) => setNested("sales", "newLeads", val)} />
            <TextArea label="In discussion / negotiation" value={draft.sales.negotiation} onChange={(val) => setNested("sales", "negotiation", val)} />
            <TextArea label="Closed this week" value={draft.sales.closed} onChange={(val) => setNested("sales", "closed", val)} />
            <TextArea label="Lost / dropped (and why)" value={draft.sales.lost} onChange={(val) => setNested("sales", "lost", val)} />
            <TextArea label="Upcoming leads / deals (not yet in discussion)" value={draft.sales.upcoming} onChange={(val) => setNested("sales", "upcoming", val)} />
            <TextArea label="Blockers" value={draft.sales.blockers} onChange={(val) => setNested("sales", "blockers", val)} />
          </div>
        </section>

        {/* Section 3 */}
        <StructuredSection
          title="3. MARKETING — CURRENT STATUS & STRATEGY"
          section="marketing"
          value={draft.marketing}
          onChange={setNested}
          fields={["activity", "results", "learnings", "nextStrategy", "blockers"]}
        />

        {/* Section 4 */}
        <StructuredSection
          title="4. RAFTAARCLOUD — HOSTING AT A GLANCE"
          section="hosting"
          value={draft.hosting}
          onChange={setNested}
          fields={["renewals", "renewalPlan", "newSignups", "cancelled", "supportTickets", "blockers"]}
        />

        {/* Section 5 */}
        <ArrayEditor
          title="5. RAFTAARSCALERS — CURRENT PROJECTS"
          description="Everything actively being worked on right now — our own products and client work, together in one place. Type: Product · MSP · Website · iOS/Android App · Digital Marketing · Other. Status: note progress, and flag 'Blocked — ...' if stuck."
          items={draft.currentProjects}
          onChange={(value) => setValue("currentProjects", value)}
          fields={projectFields}
          createItem={() => ({ type: "", project: "", workDetails: "", owner: "", dueDate: "", status: "planning" })}
        />

        <section className="editor-section">
          <TextArea
            label="New client leads / opportunities coming in"
            value={draft.newClientLeads}
            onChange={(value) => setValue("newClientLeads", value)}
            placeholder="Record incoming leads or opportunity inquiries..."
          />
        </section>

        <ArrayEditor
          title="Product Pipeline — up next (priority order, not started)"
          description="Full backlog, promoted above only when actively picked up: themes/plugins · cPanel alternative · licensing system · 3D restaurant menu · pharmacy billing · doctor tracker · MR billing · retail store system"
          items={draft.productPipeline}
          onChange={(value) => setValue("productPipeline", value)}
          fields={[{ key: "priority", label: "Priority" }, { key: "project", label: "Project" }, { key: "notes", label: "Notes" }]}
          createItem={() => ({ priority: "", project: "", notes: "" })}
        />

        {/* Section 6 */}
        <ArrayEditor
          title="6. OUR LIVE PRODUCTS — WEEKLY CHECK-IN"
          description="Our own launched products only (e.g. a released WP theme) — not client work. Not about building it — about how it's performing and what to improve."
          items={draft.liveProducts}
          onChange={(value) => setValue("liveProducts", value)}
          fields={[
            { key: "product", label: "Product" },
            { key: "weeklyPerformance", label: "How It's Going This Week" },
            { key: "improvements", label: "What We're Improving" },
            { key: "status", label: "Status" }
          ]}
          createItem={() => ({ product: "", weeklyPerformance: "", improvements: "", status: "" })}
        />

        {/* Section 7 */}
        <section className="editor-section">
          <h3>7. PLANS AHEAD</h3>
          <p className="section-subtext">What we're aiming for over the next 1–4 weeks, beyond this week's tasks.</p>
          <TextArea label="Target goals and milestones" value={draft.plansAhead} onChange={(value) => setValue("plansAhead", value)} />
        </section>

        {/* Section 8 */}
        <section className="editor-section">
          <h3>8. TEAM CHECK-IN</h3>
          <p className="section-subtext">How's everyone doing — any hurdles, overload, or support needed?</p>
          <TextArea label="Hurdles, workload or support needed" value={draft.teamCheckIn} onChange={(value) => setValue("teamCheckIn", value)} />
        </section>

        {/* Section 9 */}
        <section className="editor-section">
          <h3>9. KNOWLEDGE SESSION</h3>
          <div className="field-grid">
            <TextInput label="Today's topic (if any)" value={draft.knowledgeSession.topic} onChange={(value) => setNested("knowledgeSession", "topic", value)} />
            <TextInput label="Planned for upcoming week — presented by" value={draft.knowledgeSession.nextTopic} onChange={(value) => setNested("knowledgeSession", "nextTopic", value)} />
          </div>
        </section>

        {/* Section 10 */}
        <section className="editor-section quote-editor-box">
          <h3>10. BUFFALO MINDSET — QUOTE OF THE WEEK</h3>
          <p className="quote-subtext">Run toward the problem. Keep charging. Keep improving.</p>
          <TextArea label="Quote of the week" value={draft.quoteOfTheWeek} onChange={(value) => setValue("quoteOfTheWeek", value)} placeholder="Run toward the problem..." />
        </section>

        {/* Section 11 */}
        <ArrayEditor
          title="11. REPORTING FROM EACH PERSON"
          description="Quick round — one short update per person on what they're working on."
          items={draft.employeeReports}
          onChange={(value) => setValue("employeeReports", value)}
          fields={[
            { key: "person", label: "Person" },
            { key: "focus", label: "This Week's Focus" },
            { key: "progress", label: "Progress" },
            { key: "blocker", label: "Blocker / Needs Help With" }
          ]}
          createItem={() => ({ person: "", focus: "", progress: "", blocker: "" })}
        />

        {/* Section 12 */}
        <ArrayEditor
          title="12. ACTION LIST FOR UPCOMING WEEK"
          items={draft.actionItems}
          onChange={(value) => setValue("actionItems", value)}
          fields={actionFields}
          createItem={() => ({ description: "", owner: "", dueDate: "", status: "not_started" })}
        />

        {/* Section 13 */}
        <section className="editor-section">
          <h3>13. FOUNDERS' NOTES</h3>
          <p className="section-subtext">Anything CEO/CTO want to flag, decide, or direct the team on — informed by everything reviewed above.</p>
          <TextArea label="Founders' notes & strategic directions" value={draft.foundersNotes} onChange={(value) => setValue("foundersNotes", value)} />
        </section>

        {/* Closing */}
        <section className="editor-section">
          <h3>CLOSING</h3>
          <p className="section-subtext">Anything left unresolved goes here, carried to next week.</p>
          <TextArea label="Unresolved items to carry over" value={draft.closingNotes} onChange={(value) => setValue("closingNotes", value)} />
        </section>

        <div className="save-bar no-print">
          <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
          <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save Meeting Record"}</Button>
        </div>
      </form>
    </main>
  );
}

function StructuredSection({ title, section, value, onChange, fields }) {
  return (
    <section className="editor-section">
      <h3>{title}</h3>
      <div className="field-grid">
        {fields.map((field) => (
          <TextArea key={field} label={labels[field]} value={value[field]} onChange={(nextValue) => onChange(section, field, nextValue)} />
        ))}
      </div>
    </section>
  );
}

function Table({ title, columns, rows, description }) {
  return (
    <section className="detail-section">
      <h3>{title}</h3>
      {description && <p className="section-subtext">{description}</p>}
      {rows?.length ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>{columns.map((column) => <th key={column.key}>{column.label}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={row._id || index}>
                  {columns.map((column) => (
                    <td key={column.key}>
                      {column.badge ? <Badge status={row[column.key]} /> : column.date ? formatDate(row[column.key]) : safeText(row[column.key])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="muted">No entries recorded.</p>
      )}
    </section>
  );
}

function MeetingDetail({ meetingId, user, onBack, onEdit }) {
  const isManager = Boolean(user.canManageOperations);
  const [meeting, setMeeting] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    api(`/meetings/${meetingId}`)
      .then(({ meeting: loaded }) => active && setMeeting(loaded))
      .catch((requestError) => active && setError(requestError.message));
    return () => { active = false; };
  }, [meetingId]);

  async function deleteMeetingRecord() {
    if (!window.confirm("Are you sure you want to delete this meeting record? This action cannot be undone.")) return;
    setBusy(true);
    setError("");
    try {
      await api(`/meetings/${meetingId}`, { method: "DELETE" });
      onBack();
    } catch (requestError) {
      setError(requestError.message);
      setBusy(false);
    }
  }

  async function publishRecord() {
    if (!window.confirm("Are you sure you want to publish this meeting record for employee access?")) return;
    setBusy(true);
    setError("");
    try {
      const { meeting: updated } = await api(`/meetings/${meetingId}/publish`, { method: "POST" });
      setMeeting(updated);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  async function unpublishRecord() {
    if (!window.confirm("Are you sure you want to unpublish this meeting record? It will revert to draft status and no longer be visible to employees.")) return;
    setBusy(true);
    setError("");
    try {
      const { meeting: updated } = await api(`/meetings/${meetingId}/unpublish`, { method: "POST" });
      setMeeting(updated);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  function handleExportPdf() {
    window.print();
  }

  if (error && !meeting) return <main className="page-shell"><Notice>{error}</Notice></main>;
  if (!meeting) return <main className="page-shell"><p className="empty-state">Loading meeting record…</p></main>;

  return (
    <main className="page-shell detail-page">
      {error && <Notice>{error}</Notice>}

      {/* Official Corporate Template Header Box */}
      <div className="template-header-box card">
        <div className="template-brand">
          <div className="template-brand-title">WEEKLY OPS REVIEW</div>
          <div className="template-brand-sub">RaftaarCloud & RaftaarScalers</div>
        </div>
        <div className="template-header-fields">
          <span>Meeting #: <strong>#{formatMeetingNo(meeting.meetingNumber)}</strong></span>
          <span>Date: <strong>{formatDate(meeting.date)}</strong></span>
          <span>Ticket #: <strong>{meeting.ticketNumber || "—"}</strong></span>
        </div>
      </div>

      <section className="detail-hero card">
        <div className="detail-hero-main">
          <div className="record-card-meta">
            <span className="record-num">WEEKLY MEETING · #{formatMeetingNo(meeting.meetingNumber)}</span>
            <Badge status={meeting.status} />
          </div>
          <h1>Weekly Operations Review</h1>
          <p className="detail-hero-subtitle">
            {formatDate(meeting.date)} {meeting.ticketNumber ? `· Ref #${meeting.ticketNumber}` : ""} · Version {meeting.currentVersion}
          </p>
        </div>

        <div className="head-actions no-print">
          <Button variant="secondary" onClick={handleExportPdf}>
            <PdfIcon /> Export as PDF
          </Button>

          {isManager && (
            <>
              <Button variant="secondary" onClick={() => onEdit(meeting)}>
                <EditIcon /> Edit Record
              </Button>

              {meeting.status !== "published" ? (
                <Button disabled={busy} onClick={publishRecord}>
                  <PublishIcon /> Publish Record
                </Button>
              ) : (
                <Button disabled={busy} variant="secondary" onClick={unpublishRecord}>
                  <PublishIcon /> Unpublish Record
                </Button>
              )}

              <Button disabled={busy} variant="danger" onClick={deleteMeetingRecord}>
                <TrashIcon /> Delete
              </Button>
            </>
          )}
        </div>
      </section>

      {/* Recap */}
      <section className="detail-section lead-note">
        <h3>1. WEEKLY RECAP & EXECUTIVE HIGHLIGHTS</h3>
        <div className="detail-body-text">{safeText(meeting.recap)}</div>
      </section>

      {/* Sales */}
      <DetailFields title="2. SALES PERFORMANCE & DEALS" value={meeting.sales} keys={["newLeads", "negotiation", "closed", "lost", "upcoming", "blockers"]} />

      {/* Marketing */}
      <DetailFields title="3. MARKETING & CAMPAIGNS" value={meeting.marketing} keys={["activity", "results", "learnings", "nextStrategy", "blockers"]} />

      {/* Hosting */}
      <DetailFields title="4. HOSTING & INFRASTRUCTURE" value={meeting.hosting} keys={["renewals", "renewalPlan", "newSignups", "cancelled", "supportTickets", "blockers"]} />

      {/* Current Projects */}
      <Table
        title="5. CURRENT PROJECTS IN PROGRESS"
        columns={[
          { key: "project", label: "Project Name" },
          { key: "status", label: "Status", badge: true },
          { key: "updates", label: "Updates & Progress" },
          { key: "dueDate", label: "Due Date", date: true },
          { key: "owner", label: "Owner" },
        ]}
        rows={meeting.currentProjects}
      />

      {/* New Client Leads */}
      <section className="detail-section">
        <h3>6. NEW CLIENT LEADS</h3>
        <div className="detail-body-text">{safeText(meeting.newClientLeads)}</div>
      </section>

      {/* Product Pipeline */}
      <Table
        title="7. PRODUCT PIPELINE"
        columns={[
          { key: "product", label: "Product / Feature" },
          { key: "stage", label: "Stage", badge: true },
          { key: "nextMilestone", label: "Next Milestone" },
          { key: "etaDate", label: "ETA Date", date: true },
          { key: "leadPerson", label: "Lead" },
        ]}
        rows={meeting.productPipeline}
      />

      {/* Live Products */}
      <Table
        title="8. LIVE PRODUCTS & MONITORING"
        columns={[
          { key: "productName", label: "Product Name" },
          { key: "status", label: "Operational Status", badge: true },
          { key: "issues", label: "Issues / Incidents" },
          { key: "actionTaken", label: "Action Taken" },
        ]}
        rows={meeting.liveProducts}
      />

      {/* Plans Ahead */}
      <section className="detail-section">
        <h3>9. PLANS AHEAD</h3>
        <div className="detail-body-text">{safeText(meeting.plansAhead)}</div>
      </section>

      {/* Team Check-in */}
      <section className="detail-section">
        <h3>10. TEAM CHECK-IN & CAPACITY</h3>
        <div className="detail-body-text">{safeText(meeting.teamCheckIn)}</div>
      </section>

      {/* Knowledge Session */}
      <section className="detail-section">
        <h3>11. KNOWLEDGE SHARING SESSION</h3>
        <dl className="detail-grid">
          <div><dt>Topic Presented</dt><dd>{safeText(meeting.knowledgeSession?.topic)}</dd></div>
          <div><dt>Presenter</dt><dd>{safeText(meeting.knowledgeSession?.presenter)}</dd></div>
          <div><dt>Next Week's Topic</dt><dd>{safeText(meeting.knowledgeSession?.nextTopic)}</dd></div>
        </dl>
      </section>

      {/* Quote of the Week */}
      {meeting.quoteOfTheWeek && (
        <section className="detail-section quote">
          <h3>12. QUOTE OF THE WEEK</h3>
          <blockquote>"{meeting.quoteOfTheWeek}"</blockquote>
        </section>
      )}

      {/* Employee Reports */}
      <Table
        title="EMPLOYEE WEEKLY REPORTS"
        description="Individual reports submitted by team members for operations review."
        columns={[
          { key: "person", label: "Employee Name" },
          { key: "accomplished", label: "What Was Accomplished" },
          { key: "nextWeekPlan", label: "Plan for Next Week" },
          { key: "blockers", label: "Blockers / Assistance Needed" },
        ]}
        rows={meeting.employeeReports}
      />

      {/* Action Items */}
      <Table
        title="ACTION ITEMS & DECISIONS"
        description="Agreed tasks assigned during this meeting."
        columns={[
          { key: "description", label: "Action Item" },
          { key: "owner", label: "Assigned Owner" },
          { key: "dueDate", label: "Due Date", date: true },
          { key: "status", label: "Status", badge: true },
        ]}
        rows={meeting.actionItems}
      />

      {/* Founders' Notes */}
      <section className="detail-section">
        <h3>13. FOUNDERS' NOTES</h3>
        <p className="section-subtext">Anything CEO/CTO want to flag, decide, or direct the team on — informed by everything reviewed above.</p>
        <p>{safeText(meeting.foundersNotes)}</p>
      </section>

      {/* Closing */}
      <section className="detail-section">
        <h3>CLOSING</h3>
        <p className="section-subtext">Anything left unresolved goes here, carried to next week.</p>
        <p>{safeText(meeting.closingNotes)}</p>
      </section>

      <footer className="record-audit">
        Recorded by {meeting.createdBy?.fullName || "Operations Manager"} · Last updated {formatDateTime(meeting.updatedAt)}
      </footer>
    </main>
  );
}

function EmployeeManager({ onBack }) {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ fullName: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const loadUsers = () => api("/users").then(({ users: listed }) => setUsers(listed)).catch((requestError) => setError(requestError.message));
  useEffect(() => { loadUsers(); }, []);

  async function create(event) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      await api("/users", { method: "POST", body: JSON.stringify(form) });
      setForm({ fullName: "", email: "", password: "" });
      loadUsers();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  async function toggle(user) {
    try {
      await api(`/users/${user.id}/status`, { method: "PATCH", body: JSON.stringify({ isActive: !user.isActive }) });
      loadUsers();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <main className="page-shell">
      <section className="dashboard-head" style={{ marginBottom: "28px" }}>
        <div>
          <span className="eyebrow">OPERATIONS MANAGER WORKSPACE</span>
          <h1 style={{ marginTop: "4px", marginBottom: "8px" }}>Employee Access Management</h1>
          <p style={{ marginBottom: "28px" }}>Create approved employee accounts and maintain account access controls.</p>
        </div>
      </section>

      {error && <Notice>{error}</Notice>}

      <section className="manager-grid">
        <form className="card stack-form" onSubmit={create}>
          <h2>Create Employee Account</h2>
          <label htmlFor="emp-fullname">Full name
            <input id="emp-fullname" required value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} placeholder="e.g. John Doe" />
          </label>
          <label htmlFor="emp-email">Company email
            <input id="emp-email" required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="employee@raftaarcloud.com" />
          </label>
          <label htmlFor="emp-password">Temporary password
            <input id="emp-password" required minLength="8" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="At least 8 characters" />
          </label>
          <Button disabled={busy}>{busy ? "Creating…" : "Create Employee Account"}</Button>
        </form>

        <section className="card users-list">
          <h2>Approved Company Accounts</h2>
          {users.map((account) => (
            <article key={account.id}>
              <div>
                <strong>{account.fullName}</strong>
                <span>{account.email} · {account.role === "operations_manager" ? "Operations Manager" : "Employee"}</span>
              </div>
              {account.role === "employee" ? (
                <Button variant={account.isActive ? "danger" : "secondary"} onClick={() => toggle(account)}>
                  {account.isActive ? "Disable Access" : "Enable Access"}
                </Button>
              ) : (
                <Badge status="operations manager" />
              )}
            </article>
          ))}
        </section>
      </section>
    </main>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState(() => {
    const s = window.history.state;
    return s?.name ? s : { name: "dashboard" };
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api("/auth/me").then(({ user: currentUser }) => setUser(currentUser)).catch(() => setUser(null)).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    function onPopState(event) {
      if (event.state?.name) {
        setView(event.state);
      } else {
        setView({ name: "dashboard" });
      }
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  function navigateTo(nextView) {
    setView(nextView);
    window.history.pushState(nextView, "");
  }

  async function logout() {
    try { await api("/auth/logout", { method: "POST" }); } finally { setUser(null); navigateTo({ name: "dashboard" }); }
  }

  const content = useMemo(() => {
    if (!user) return <Login onLogin={setUser} />;
    if (view.name === "editor" && user.canManageOperations) return <MeetingEditor meeting={view.meeting} onCancel={() => navigateTo({ name: "dashboard" })} onSaved={(meetingId) => navigateTo({ name: "detail", meetingId })} />;
    if (view.name === "detail") return <MeetingDetail meetingId={view.meetingId} user={user} onBack={() => navigateTo({ name: "dashboard" })} onEdit={(meeting) => navigateTo({ name: "editor", meeting })} />;
    if (view.name === "users" && user.canManageOperations) return <EmployeeManager onBack={() => navigateTo({ name: "dashboard" })} />;
    return <Dashboard user={user} onOpen={(meetingId) => navigateTo({ name: "detail", meetingId })} onNew={() => navigateTo({ name: "editor", meeting: null })} onUsers={() => navigateTo({ name: "users" })} />;
  }, [user, view]);

  if (loading) return <main className="loading-screen">Loading Raftaar Cloud Meeting Records…</main>;
  if (!user) return content;

  const roleTitle = user.canManageOperations ? "OPERATIONS MANAGER" : "EMPLOYEE";

  return (
    <>
      <header className="app-nav no-print">
        <button className="nav-brand" onClick={() => navigateTo({ name: "dashboard" })}>
          <LogoIcon />
          <div className="nav-brand-text">
            <span className="brand-title">Raftaar Cloud</span>
            <span className="brand-subtitle">Weekly Meeting Records</span>
          </div>
        </button>
        <div className="nav-user-area">
          <div className="user-info">
            <span className="user-name">{user.fullName}</span>
            {user.fullName?.trim().toLowerCase() !== roleTitle.trim().toLowerCase() && (
              <span className="user-role-badge">{roleTitle}</span>
            )}
          </div>
          <button className="nav-signout-btn" onClick={logout}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            <span>Sign out</span>
          </button>
        </div>
      </header>
      {content}
    </>
  );
}
