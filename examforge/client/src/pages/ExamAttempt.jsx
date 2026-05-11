import { useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';

const formatDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

const formatDuration = (minutes) => {
  if (!minutes) return '—';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} hr`;
  return `${h} hr ${m} min`;
};

const DEFAULT_RULES = [
  'Do not refresh or close the browser tab during the exam.',
  'Ensure a stable internet connection before starting.',
  'Each question must be answered before moving to the next.',
  'Tab switching or window changes may be flagged.',
  'Submitting the exam is final and cannot be undone.',
];

export default function ExamAttempt() {
  const location = useLocation();
  const navigate = useNavigate();
  const [agreed, setAgreed] = useState(false);

  const examData = location.state?.examData;
  const exam = examData?.exam;
  console.log(examData)

  if (!exam) {
    return (
      <div style={styles.errorWrap}>
        <p style={styles.errorText}>No exam data found. Please go back and join again.</p>
        <button style={styles.backBtn} onClick={() => navigate(-1)}>← Go Back</button>
      </div>
    );
  }

  const rules =
    Array.isArray(exam.rules) && exam.rules.length > 0
      ? exam.rules
      : DEFAULT_RULES;

  const handleStart = () => {
    navigate(`/exam/${exam._id}/attempt`, { state: { examData } });
  };

  return (
    <div style={styles.page}>

      <div style={styles.container}>

        {/* Header */}
        <div style={styles.header}>
          <div style={styles.badge}>Exam</div>
          <h1 style={styles.title}>{exam.title}</h1>
          {exam.description && (
            <p style={styles.description}>{exam.description}</p>
          )}
        </div>

        <div style={styles.divider} />

        {/* Meta grid */}
        <div style={styles.metaGrid}>
          <MetaItem icon="⏱" label="Duration" value={formatDuration(exam.duration)} />
          <MetaItem icon="🏆" label="Total Marks" value={exam.totalMarks ?? '—'} />
          <MetaItem icon="📅" label="Starts" value={formatDate(exam.scheduledStart)} wide />
          <MetaItem icon="🔚" label="Ends" value={formatDate(exam.scheduledEnd)} wide />
        </div>

        <div style={styles.divider} />

        {/* Behaviour flags */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Exam Settings</h2>
          <div style={styles.flagsRow}>
            <Flag
              active={exam.shuffleOptions}
              label="Options shuffled"
              hint={exam.shuffleOptions ? 'Answer options are randomised per attempt.' : 'Answer options appear in fixed order.'}
            />
            <Flag
              active={exam.showResultAfterSubmit}
              label="Result shown after submission"
              hint={exam.showResultAfterSubmit ? 'Your score will be visible immediately after you submit.' : 'Results will be released by the examiner later.'}
            />
          </div>
        </div>

        <div style={styles.divider} />

        {/* Rules */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Rules & Instructions</h2>
          <ol style={styles.ruleList}>
            {rules.map((rule, i) => (
              <li key={i} style={styles.ruleItem}>
                <span style={styles.ruleNum}>{i + 1}</span>
                <span style={styles.ruleText}>{rule}</span>
              </li>
            ))}
          </ol>
        </div>

        <div style={styles.divider} />

        {/* Agreement & CTA */}
        <div style={styles.footer}>
          <label style={styles.checkLabel}>
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              style={styles.checkbox}
            />
            <span>I have read all the instructions and agree to follow the exam rules.</span>
          </label>

          <div style={styles.ctaRow}>
            <button style={styles.backBtn} onClick={() => navigate(-1)}>
              ← Back
            </button>
            <button
              style={{
                ...styles.startBtn,
                ...(agreed ? {} : styles.startBtnDisabled),
              }}
              disabled={!agreed}
              onClick={handleStart}
            >
              Start Exam →
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

function MetaItem({ icon, label, value, wide }) {
  return (
    <div style={{ ...styles.metaItem, ...(wide ? styles.metaItemWide : {}) }}>
      <span style={styles.metaIcon}>{icon}</span>
      <div>
        <p style={styles.metaLabel}>{label}</p>
        <p style={styles.metaValue}>{value}</p>
      </div>
    </div>
  );
}

function Flag({ active, label, hint }) {
  return (
    <div style={styles.flagCard}>
      <span style={{ ...styles.flagDot, background: active ? '#16a34a' : '#9ca3af' }} />
      <div>
        <p style={styles.flagLabel}>{label}</p>
        <p style={styles.flagHint}>{hint}</p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#f9f9f8',
    padding: '2.5rem 1rem',
    fontFamily: '"DM Mono", "IBM Plex Mono", "Courier New", monospace',
    color: '#1a1a1a',
  },
  container: {
    maxWidth: 680,
    margin: '0 auto',
    background: '#ffffff',
    border: '1px solid #e4e4e0',
    borderRadius: 4,
  },
  header: {
    padding: '2rem 2rem 1.5rem',
  },
  badge: {
    display: 'inline-block',
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: '#6b7280',
    border: '1px solid #e4e4e0',
    borderRadius: 2,
    padding: '3px 8px',
    marginBottom: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: 700,
    margin: '0 0 8px',
    lineHeight: 1.2,
    letterSpacing: '-0.02em',
    color: '#111',
    fontFamily: 'Georgia, "Times New Roman", serif',
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    margin: 0,
    lineHeight: 1.6,
  },
  divider: {
    height: 1,
    background: '#e4e4e0',
    margin: '0 2rem',
  },
  metaGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 0,
    padding: '0.25rem 0',
  },
  metaItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    padding: '1.25rem 2rem',
    borderRight: '1px solid #e4e4e0',
    borderBottom: '1px solid #e4e4e0',
  },
  metaItemWide: {
    borderRight: 'none',
  },
  metaIcon: {
    fontSize: 18,
    lineHeight: 1,
    marginTop: 2,
  },
  metaLabel: {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: '#9ca3af',
    margin: '0 0 4px',
  },
  metaValue: {
    fontSize: 14,
    fontWeight: 600,
    color: '#111',
    margin: 0,
  },
  section: {
    padding: '1.5rem 2rem',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: '#9ca3af',
    margin: '0 0 1rem',
  },
  flagsRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 12,
  },
  flagCard: {
    display: 'flex',
    gap: 10,
    alignItems: 'flex-start',
    padding: '12px 14px',
    background: '#f9f9f8',
    border: '1px solid #e4e4e0',
    borderRadius: 4,
  },
  flagDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    marginTop: 5,
    flexShrink: 0,
  },
  flagLabel: {
    fontSize: 13,
    fontWeight: 600,
    color: '#1a1a1a',
    margin: '0 0 3px',
  },
  flagHint: {
    fontSize: 12,
    color: '#6b7280',
    margin: 0,
    lineHeight: 1.5,
  },
  ruleList: {
    margin: 0,
    padding: 0,
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
  },
  ruleItem: {
    display: 'flex',
    gap: 14,
    alignItems: 'flex-start',
    padding: '12px 0',
    borderBottom: '1px solid #f0f0ee',
  },
  ruleNum: {
    fontSize: 11,
    fontWeight: 700,
    color: '#9ca3af',
    width: 18,
    flexShrink: 0,
    paddingTop: 2,
    letterSpacing: '0.05em',
  },
  ruleText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 1.6,
  },
  footer: {
    padding: '1.5rem 2rem',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  checkLabel: {
    display: 'flex',
    gap: 10,
    alignItems: 'flex-start',
    fontSize: 13,
    color: '#374151',
    lineHeight: 1.5,
    cursor: 'pointer',
  },
  checkbox: {
    marginTop: 2,
    width: 15,
    height: 15,
    flexShrink: 0,
    accentColor: '#111',
    cursor: 'pointer',
  },
  ctaRow: {
    display: 'flex',
    gap: 10,
    justifyContent: 'flex-end',
  },
  backBtn: {
    padding: '9px 18px',
    fontSize: 13,
    fontWeight: 600,
    background: 'transparent',
    color: '#6b7280',
    border: '1px solid #d1d5db',
    borderRadius: 3,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  startBtn: {
    padding: '9px 24px',
    fontSize: 13,
    fontWeight: 700,
    background: '#111',
    color: '#fff',
    border: '1px solid #111',
    borderRadius: 3,
    cursor: 'pointer',
    fontFamily: 'inherit',
    letterSpacing: '0.02em',
  },
  startBtnDisabled: {
    background: '#d1d5db',
    borderColor: '#d1d5db',
    color: '#9ca3af',
    cursor: 'not-allowed',
  },
  errorWrap: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    fontFamily: 'monospace',
  },
  errorText: {
    color: '#6b7280',
    fontSize: 14,
  },
};