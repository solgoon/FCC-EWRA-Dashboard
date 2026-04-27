import { useState, useEffect, useMemo, useRef, useCallback } from 'react';

const DEFAULT_RISK_CATEGORIES = [
  { id:'RC-01', name:'Money Laundering',                     desc:'Placement, layering, integration of illicit proceeds' },
  { id:'RC-02', name:'Terrorist Financing',                  desc:'Funding of designated terrorist organizations or adjacent actors' },
  { id:'RC-03', name:'Sanctions Evasion',                    desc:'Transactions involving SDN, SSI, sectoral, or country-based sanctions' },
  { id:'RC-04', name:'Fraud (1st & 3rd party)',              desc:'ATO, identity fraud, scam outflows, card fraud, claims fraud' },
  { id:'RC-05', name:'Elder / Vulnerable Adult Exploitation',desc:'Financial abuse of elders and cognitively impaired adults' },
  { id:'RC-06', name:'Human Trafficking & CSAM Financing',   desc:'Proceeds from trafficking; payments linked to exploitative content' },
  { id:'RC-07', name:'Consumer Harm / UDAAP',                desc:'Unfair, deceptive, or abusive acts affecting customers' },
  { id:'RC-08', name:'Cyber-Enabled Crime',                  desc:'Credential stuffing, synthetic ID fabrication, SIM swap, BEC' },
  { id:'RC-09', name:'Market Abuse (roadmap)',               desc:'Manipulation enabled by in-feed trade routing' },
  { id:'RC-10', name:'Third-Party / BaaS Program Risk',      desc:'Breakdowns in partner oversight, vendor risk, sponsor bank alignment' },
];

const DEFAULT_PRODUCTS = [
  { id:'P-01', name:'P2P Transfers',         status:'Live (soft launch)' },
  { id:'P-02', name:'Visa Debit Card',       status:'Live (soft launch)' },
  { id:'P-03', name:'Direct Deposit',        status:'Roadmap' },
  { id:'P-04', name:'High-Yield Interest',   status:'Roadmap' },
  { id:'P-05', name:'Cashback Rewards',      status:'Roadmap' },
];

const PRODUCT_CATEGORIES = {
  'P-01': ['RC-01','RC-02','RC-03','RC-04','RC-05','RC-06','RC-07','RC-08','RC-10'],
  'P-02': ['RC-01','RC-03','RC-04','RC-07','RC-08','RC-10'],
  'P-03': ['RC-01','RC-03','RC-04','RC-07','RC-08','RC-10'],
  'P-04': ['RC-07','RC-10'],
  'P-05': ['RC-04','RC-07'],
};

const CONTROL_TYPES       = ['Preventive','Detective','Corrective','Directive','Assurance'];
const CONTROL_NATURES     = ['Manual','Semi-automated','Automated'];
const CONTROL_FREQUENCIES = ['Real-time','Daily','Weekly','Monthly','Quarterly','Annual','Event-driven'];
const CONTROL_OWNERS      = ['1LoD','2LoD','3LoD','Sponsor Bank','Vendor'];

const DEFAULT_CONTROLS = [
  { id:'CTRL-001', name:'CIP at account opening', type:'Preventive', nature:'Automated', frequency:'Event-driven', owner:'1LoD', mitigates:['RC-01','RC-04'], desc:'Name, DOB, SSN, address with documentary and non-documentary verification' },
  { id:'CTRL-002', name:'Sanctions screening (OFAC+)', type:'Preventive', nature:'Automated', frequency:'Real-time', owner:'2LoD', mitigates:['RC-03'], desc:'OFAC SDN, SSI, CAPTA, non-SDN Palestinian, EU/UK/UN lists at onboarding and ongoing' },
  { id:'CTRL-003', name:'Real-time transaction monitoring', type:'Detective', nature:'Automated', frequency:'Real-time', owner:'2LoD', mitigates:['RC-01','RC-04','RC-05'], desc:'Rules + ML covering structuring, mule, scam, layering typologies' },
  { id:'CTRL-004', name:'Device fingerprint & geo-IP blocking', type:'Preventive', nature:'Automated', frequency:'Real-time', owner:'1LoD', mitigates:['RC-03','RC-08'], desc:'Sanctioned jurisdiction blocking with VPN/proxy heuristics' },
  { id:'CTRL-005', name:'Behavioral biometrics & step-up auth', type:'Preventive', nature:'Automated', frequency:'Event-driven', owner:'1LoD', mitigates:['RC-04','RC-08'], desc:'Step-up authentication on risky sessions' },
  { id:'CTRL-006', name:'Customer Risk Rating (CRR)', type:'Directive', nature:'Automated', frequency:'Event-driven', owner:'2LoD', mitigates:['RC-01','RC-02','RC-03'], desc:'Scored at onboarding, refreshed on triggers and annually; drives EDD cadence' },
  { id:'CTRL-007', name:'SAR / CTR workflow', type:'Corrective', nature:'Semi-automated', frequency:'Event-driven', owner:'2LoD', mitigates:['RC-01','RC-02'], desc:'Sponsor-bank co-review; 30-day SAR clock tracked to the hour' },
  { id:'CTRL-008', name:'Reg E error claim handling', type:'Corrective', nature:'Semi-automated', frequency:'Event-driven', owner:'1LoD', mitigates:['RC-07'], desc:'Provisional credit timers and compliance tracking' },
  { id:'CTRL-009', name:'Marketing copy review gate', type:'Preventive', nature:'Manual', frequency:'Event-driven', owner:'2LoD', mitigates:['RC-07'], desc:'APY, yield, cashback, FDIC claims review' },
  { id:'CTRL-010', name:'Mule-typology detector', type:'Detective', nature:'Automated', frequency:'Real-time', owner:'2LoD', mitigates:['RC-01','RC-04'], desc:'Graph analytics on fund flows with social-graph signal' },
  { id:'CTRL-011', name:'Platform-integrity telemetry feed', type:'Detective', nature:'Automated', frequency:'Real-time', owner:'1LoD', mitigates:['RC-01','RC-06'], desc:'Bot flags, trust scores, content removal signals into TM' },
  { id:'CTRL-012', name:'Creator monetization eligibility review', type:'Preventive', nature:'Manual', frequency:'Event-driven', owner:'2LoD', mitigates:['RC-06'], desc:'Enhanced screening for accounts over payout thresholds' },
  { id:'CTRL-013', name:'Elder / vulnerable adult TM indicators', type:'Detective', nature:'Automated', frequency:'Real-time', owner:'2LoD', mitigates:['RC-05'], desc:'TM indicators for elder exploitation patterns' },
  { id:'CTRL-014', name:'Blockchain analytics', type:'Detective', nature:'Automated', frequency:'Real-time', owner:'2LoD', mitigates:['RC-03','RC-01'], desc:'All crypto inflows/outflows with mixer/sanctioned-wallet rules' },
  { id:'CTRL-015', name:'Travel rule data exchange', type:'Preventive', nature:'Automated', frequency:'Event-driven', owner:'2LoD', mitigates:['RC-03'], desc:'Originator/beneficiary info with counterparty VASPs (future)' },
  { id:'CTRL-016', name:'Annual independent BSA/AML audit', type:'Assurance', nature:'Manual', frequency:'Annual', owner:'3LoD', mitigates:['RC-01','RC-02','RC-03','RC-04','RC-05','RC-06','RC-07','RC-08','RC-09','RC-10'], desc:'Qualified external firm audit' },
  { id:'CTRL-017', name:'Sponsor-bank oversight program', type:'Assurance', nature:'Semi-automated', frequency:'Monthly', owner:'2LoD', mitigates:['RC-10'], desc:'Monthly ops review, quarterly risk, annual audit' },
  { id:'CTRL-018', name:'UDAAP complaints intake & RCA', type:'Corrective', nature:'Semi-automated', frequency:'Event-driven', owner:'2LoD', mitigates:['RC-07'], desc:'Taxonomy and root-cause loop for consumer complaints' },
  { id:'CTRL-019', name:'Employee ABC / conflicts attestations', type:'Preventive', nature:'Manual', frequency:'Annual', owner:'2LoD', mitigates:['RC-10'], desc:'Gifts, entertainment log, third-party ABC due diligence' },
  { id:'CTRL-020', name:'Securities disclosure framework', type:'Preventive', nature:'Manual', frequency:'Event-driven', owner:'2LoD', mitigates:['RC-09'], desc:'No-solicitation, no-recommendation architecture for Smart Cashtag routing' },
];

const DEFAULT_SETTINGS = {
  weights: { P:0.30, C:0.30, G:0.15, Ch:0.25 },
  alpha: 0.70,
  weakCriticalThreshold: 0.25,
  weakCriticalCap: 2.5,
  weakCriticalCELimit: 1.8,
};

const CE_MATRIX = [
  [1.0, 1.2, 1.4, 1.6],
  [1.3, 2.0, 2.4, 2.7],
  [1.6, 2.5, 3.0, 3.4],
  [1.8, 2.8, 3.5, 4.0],
];

const RR_MATRIX = [
  ['Severe','High','High','Moderate'],
  ['Severe','High','Moderate','Low-Moderate'],
  ['High','Moderate','Low-Moderate','Low'],
  ['Moderate','Low-Moderate','Low','Low'],
  ['Low-Moderate','Low','Low','Low'],
];

const FACTOR_RUBRICS = {
  P: { label:'Product', weight:0.30, drivers:[
    { name:'Cash-equivalence',      levels:['Closed-loop prepaid','Limited P2P','Open-loop debit + P2P','Card+P2P+DD+yield','Card+P2P+yield+crypto+stablecoin'] },
    { name:'Velocity (tx/day/user)',levels:['<1','1–3','3–10','10–25','>25'] },
    { name:'Product novelty',       levels:['Well-understood','Standard','New twist','New class','First-of-kind'] },
    { name:'Cross-border reach',    levels:['Domestic only','Very limited','Moderate','Significant','Global'] },
  ]},
  C: { label:'Customer', weight:0.30, drivers:[
    { name:'Mainstream retail %',         levels:['>95%','85–95%','70–85%','50–70%','<50%'] },
    { name:'PEP/RCA exposure',            levels:['None','<0.1%','0.1–0.5%','0.5–1%','>1%'] },
    { name:'Synthetic/stolen ID rate',    levels:['<0.5%','0.5–1%','1–2%','2–5%','>5%'] },
    { name:'Anonymity tolerance',         levels:['None','Display-name only','Handles + full KYC','Handles + soft KYC','Pseudonymous w/ minimal KYC'] },
    { name:'High-risk industries served', levels:['None','Screened out','Limited vetted','Broad','Unrestricted'] },
  ]},
  G: { label:'Geography', weight:0.15, drivers:[
    { name:'State MTL footprint',                   levels:['<10 states','10–25','25–40','40–50','All states + territories'] },
    { name:'FATF grey/black list exposure',         levels:['0%','<0.1%','0.1–0.5%','0.5–2%','>2%'] },
    { name:'HIFCA / HIDTA presence',                levels:['Minimal','Low','Moderate','High','Very high'] },
    { name:'Sanctioned-country IP/device hit rate', levels:['<0.01%','0.01–0.05%','0.05–0.2%','0.2–1%','>1%'] },
  ]},
  Ch:{ label:'Channel', weight:0.25, drivers:[
    { name:'Onboarding mode',                       levels:['In-person','Remote + wet sig','Remote w/ govt ID + selfie + liveness','Remote w/ selfie only','Remote w/ minimal verification'] },
    { name:'In-feed transaction surface',           levels:['None','Tipping only','P2P + tipping','+ Securities routing','+ Crypto / stablecoin'] },
    { name:'Bot / inauthentic account exposure',    levels:['De minimis','Low','Moderate','High','Severe'] },
    { name:'API exposure to third parties',         levels:['None','Read-only','Limited write','Broad write','Open API'] },
  ]},
};

const DE_OPTIONS = [
  { value:1, label:'1 — Ineffective',       desc:'Control is missing, mis-targeted, or unsupported by policy / change-management.' },
  { value:2, label:'2 — Needs Improvement', desc:'Targets the right risk but lacks one or more design pillars (owner, frequency, evidence, KRI mapping).' },
  { value:3, label:'3 — Largely Effective', desc:'Sound design with minor gaps; preventive-preferred where feasible, defined SLA / escalation, mapped to a regulation.' },
  { value:4, label:'4 — Effective',         desc:'Right risk, right point, defined owner / frequency / evidence, change-controlled, mapped to regulation and KRIs.' },
];

const OE_OPTIONS = [
  { value:1, label:'1 — Ineffective',       desc:'No evidence of consistent execution; material findings open or recurring exceptions unresolved.' },
  { value:2, label:'2 — Needs Improvement', desc:'Inconsistent execution; SLA / KRI breaches not fully remediated; staffing or tooling gaps.' },
  { value:3, label:'3 — Largely Effective', desc:'Generally consistent execution; SLAs met; exceptions logged and remediated within policy; minor findings only.' },
  { value:4, label:'4 — Effective',         desc:'Consistent, evidence-backed execution; no material findings; staffing and tooling sufficient.' },
];

function makeDefaultRiskUnits() {
  const units = [];
  let idx = 0;
  for (const [pid, cats] of Object.entries(PRODUCT_CATEGORIES)) {
    for (const cat of cats) {
      idx++;
      const id = `RU-${String(idx).padStart(3,'0')}`;
      const isExample = pid === 'P-01' && cat === 'RC-01';
      units.push({
        id,
        riskCategoryId: cat,
        productId: pid,
        owner: isExample ? 'BSA Officer' : '',
        status: isExample ? 'Assessed' : 'Draft',
        notes: '',
        lastUpdated: isExample ? '2026-04-01' : new Date().toISOString().slice(0,10),
        factorScores: isExample ? { P:4.0, C:3.5, G:2.0, Ch:5.0 } : { P:3, C:3, G:2, Ch:3 },
        factorNarratives: isExample ? {
          P:  'High velocity, open-loop, irrevocable P2P with strong cash-equivalence; novelty elevated by in-feed context.',
          C:  'Mainstream retail majority but elevated synthetic-ID attempts in soft launch; pseudonymous handle culture.',
          G:  'US only at launch.',
          Ch: 'Non-face-to-face onboarding; in-feed DM → P2P in seconds; documented bot exposure on parent platform.',
        } : { P:'', C:'', G:'', Ch:'' },
        linkedControls: isExample ? [
          { controlId:'CTRL-001', mitigationWeight:0.15, DE:3, OE:4 },
          { controlId:'CTRL-003', mitigationWeight:0.30, DE:3, OE:4 },
          { controlId:'CTRL-006', mitigationWeight:0.15, DE:3, OE:4 },
          { controlId:'CTRL-010', mitigationWeight:0.25, DE:4, OE:2 },
          { controlId:'CTRL-011', mitigationWeight:0.15, DE:2, OE:2 },
        ] : [],
      });
    }
  }
  return units;
}

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
const clamp  = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

function calcIR(scores, weights) {
  return round2(weights.P*scores.P + weights.C*scores.C + weights.G*scores.G + weights.Ch*scores.Ch);
}

function getIRBand(ir) {
  if (!Number.isFinite(ir)) return null;
  if (ir <= 1.80) return 'Low';
  if (ir <= 2.60) return 'Low-Moderate';
  if (ir <= 3.40) return 'Moderate';
  if (ir <= 4.20) return 'High';
  return 'Severe';
}

function getCEFromMatrix(de, oe) {
  const d = clamp(parseInt(de,10)||0, 1, 4);
  const o = clamp(parseInt(oe,10)||0, 1, 4);
  return CE_MATRIX[d-1][o-1];
}

function getCEBand(ce) {
  if (!Number.isFinite(ce)) return null;
  if (ce <= 1.7) return 'Weak';
  if (ce <= 2.6) return 'Needs Improvement';
  if (ce <= 3.4) return 'Satisfactory';
  return 'Strong';
}

function calcAggregateCE(linked, settings) {
  if (!linked || linked.length === 0) return { value:null, raw:null, band:null, capped:false, weightSum:0 };
  let weightSum = 0;
  const valid = linked.filter(l => Number.isFinite(getCEFromMatrix(l.DE, l.OE)) && (Number(l.mitigationWeight)||0) > 0);
  for (const l of linked) weightSum += Number(l.mitigationWeight) || 0;
  if (valid.length === 0) return { value:null, raw:null, band:null, capped:false, weightSum:round2(weightSum) };

  const raw = round2(valid.reduce((s, l) => s + (Number(l.mitigationWeight)||0) * getCEFromMatrix(l.DE, l.OE), 0));
  const trigger = linked.some(l =>
    (Number(l.mitigationWeight)||0) > settings.weakCriticalThreshold &&
    getCEFromMatrix(l.DE, l.OE) < settings.weakCriticalCELimit
  );
  const capped = trigger && raw > settings.weakCriticalCap;
  const value = capped ? settings.weakCriticalCap : raw;
  return { value:round2(value), raw, band:getCEBand(value), capped, weightSum:round2(weightSum) };
}

const IR_BAND_INDEX = ['Severe','High','Moderate','Low-Moderate','Low'];
const CE_BAND_INDEX = ['Weak','Needs Improvement','Satisfactory','Strong'];

function getRRFromMatrix(irBand, ceBand) {
  const r = IR_BAND_INDEX.indexOf(irBand);
  const c = CE_BAND_INDEX.indexOf(ceBand);
  if (r < 0 || c < 0) return null;
  return RR_MATRIX[r][c];
}

function calcRRFormula(ir, ce, alpha) {
  if (!Number.isFinite(ir) || !Number.isFinite(ce)) return null;
  return round2(ir * (1 - alpha * (ce - 1) / 3));
}

function getRRBandFromScore(rr) {
  if (!Number.isFinite(rr)) return null;
  if (rr <= 1.80) return 'Low';
  if (rr <= 2.60) return 'Low-Moderate';
  if (rr <= 3.40) return 'Moderate';
  if (rr <= 4.20) return 'High';
  return 'Severe';
}

const BAND_ORDER = ['Low','Low-Moderate','Moderate','High','Severe'];
function bandDistance(a, b) {
  if (!a || !b) return 0;
  return Math.abs(BAND_ORDER.indexOf(a) - BAND_ORDER.indexOf(b));
}

const RR_BAND_CLASS = {
  'Severe':'r-sev', 'High':'r-high', 'Moderate':'r-mod',
  'Low-Moderate':'r-lowmod', 'Low':'r-low',
};
const CE_BAND_CLASS = {
  'Weak':'c-weak', 'Needs Improvement':'c-needs',
  'Satisfactory':'c-sat', 'Strong':'c-strong',
};

const STORAGE_KEY = 'kmoney-ewra-v2';
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}
function saveState(s) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch {}
}
function getDefaults() {
  return {
    riskCategories: DEFAULT_RISK_CATEGORIES,
    products: DEFAULT_PRODUCTS,
    productCategories: PRODUCT_CATEGORIES,
    controls: DEFAULT_CONTROLS.map(c => ({ ...c, mitigates:[...c.mitigates] })),
    riskUnits: makeDefaultRiskUnits(),
    settings: { ...DEFAULT_SETTINGS, weights:{ ...DEFAULT_SETTINGS.weights } },
  };
}

function Chip({ band, value, kind = 'risk', size }) {
  if (!band) return <span className="chip tag">—</span>;
  const cls = kind === 'ce' ? CE_BAND_CLASS[band] : RR_BAND_CLASS[band];
  return (
    <span className={`chip ${cls || ''} ${size === 'lg' ? 'lg' : ''}`}>
      <span>{band}</span>
      {value != null && Number.isFinite(value) && <span className="num">{value.toFixed(2)}</span>}
    </span>
  );
}

function StatusPill({ status }) {
  const cls = status === 'Assessed' ? 'assessed' : status === 'In Review' ? 'in-review' : '';
  return <span className={`status-pill ${cls}`}>{status || 'Draft'}</span>;
}

function FactorRubric({ rubric }) {
  return (
    <div className="rubric">
      {rubric.drivers.map((d, i) => (
        <div className="rubric-driver" key={i}>
          <div className="name">{d.name}</div>
          <ol>
            {d.levels.map((lvl, j) => (
              <li key={j}><b>{j+1}</b><span>{lvl}</span></li>
            ))}
          </ol>
        </div>
      ))}
    </div>
  );
}

function FactorCard({ keyName, score, narrative, weight, onScore, onNarrative }) {
  const [showRubric, setShowRubric] = useState(false);
  const rubric = FACTOR_RUBRICS[keyName];
  const bgBand = getIRBand(score);
  return (
    <div className="factor">
      <div className="factor-head">
        <div className="factor-name">{rubric.label}</div>
        <div className="factor-w">w = {weight.toFixed(2)}</div>
      </div>
      <div className="factor-row">
        <input
          type="range" min="1" max="5" step="0.1"
          value={score}
          onChange={(e) => onScore(parseFloat(e.target.value))}
        />
        <div className="factor-score">{Number(score).toFixed(1)}</div>
      </div>
      <div className="row gap-sm" style={{ marginBottom: 6 }}>
        <Chip band={bgBand} />
        <span className="spacer" />
        <button className="rubric-toggle" onClick={() => setShowRubric(s => !s)}>
          {showRubric ? 'Hide rubric' : 'Show rubric'}
        </button>
      </div>
      {showRubric && <FactorRubric rubric={rubric} />}
      <textarea
        className="textarea factor-narr"
        placeholder={`Narrative for ${rubric.label} (required for approval)…`}
        value={narrative || ''}
        onChange={(e) => onNarrative(e.target.value)}
      />
    </div>
  );
}

function DEOESelect({ value, onChange, options, ariaLabel }) {
  const opt = options.find(o => o.value === value);
  return (
    <div>
      <select
        aria-label={ariaLabel}
        className="select"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        style={{ width: '100%' }}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <span className="de-oe-help">{opt?.desc}</span>
    </div>
  );
}

function MitigatesEditor({ value, onChange, categories }) {
  const remove = (id) => onChange(value.filter(v => v !== id));
  const add = (id) => { if (id && !value.includes(id)) onChange([...value, id]); };
  const remaining = categories.filter(c => !value.includes(c.id));
  return (
    <div className="mit-list">
      {value.map(id => (
        <span key={id} className="chip tag removable">
          {id}
          <span className="x" onClick={() => remove(id)} aria-label={`remove ${id}`}>×</span>
        </span>
      ))}
      {remaining.length > 0 && (
        <select
          className="select"
          value=""
          onChange={(e) => { add(e.target.value); e.target.value = ''; }}
          style={{ padding:'2px 22px 2px 8px', fontSize:11 }}
          aria-label="Add risk category"
        >
          <option value="">+ add</option>
          {remaining.map(c => <option key={c.id} value={c.id}>{c.id}</option>)}
        </select>
      )}
    </div>
  );
}

function Modal({ title, children, onClose, actions }) {
  return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div className="modal" role="dialog" aria-modal="true">
        <div className="modal-title">{title}</div>
        {children}
        {actions && <div className="modal-actions">{actions}</div>}
      </div>
    </div>
  );
}

function useToast() {
  const [msg, setMsg] = useState(null);
  const timer = useRef(null);
  const show = useCallback((m, ms = 1800) => {
    setMsg(m);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(null), ms);
  }, []);
  const node = msg ? <div className="toast">{msg}</div> : null;
  return [node, show];
}

export default function App() {
  const [state, setState] = useState(() => loadState() || getDefaults());
  const [tab, setTab] = useState('register');
  const [selectedUnitId, setSelectedUnitId] = useState(null);
  const [filters, setFilters] = useState({ category:'', product:'', rrBand:'', search:'' });
  const [sort, setSort] = useState({ key:'rr', dir:'desc' });
  const [newUnitOpen, setNewUnitOpen] = useState(false);
  const [toastNode, toast] = useToast();
  const fileInputRef = useRef(null);

  useEffect(() => { saveState(state); }, [state]);

  const update = useCallback((fn) => setState(prev => {
    const next = structuredClone(prev);
    fn(next);
    return next;
  }), []);

  const getCat  = (id) => state.riskCategories.find(r => r.id === id);
  const getProd = (id) => state.products.find(p => p.id === id);

  const computedUnits = useMemo(() => {
    return state.riskUnits.map(u => {
      const ir = calcIR(u.factorScores, state.settings.weights);
      const irBand = getIRBand(ir);
      const agg = calcAggregateCE(u.linkedControls, state.settings);
      let rrMatrixBand = null, rrFormula = null, rrFormulaBand = null, disagree = false;
      if (agg.value !== null) {
        rrMatrixBand = getRRFromMatrix(irBand, agg.band);
        rrFormula = calcRRFormula(ir, agg.value, state.settings.alpha);
        rrFormulaBand = getRRBandFromScore(rrFormula);
        disagree = bandDistance(rrMatrixBand, rrFormulaBand) > 1;
      }
      return {
        ...u,
        ir, irBand,
        ce: agg.value, ceRaw: agg.raw, ceBand: agg.band, ceCapped: agg.capped, ceWeightSum: agg.weightSum,
        rrMatrixBand, rrFormula, rrFormulaBand, disagree,
      };
    });
  }, [state]);

  const filtered = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    let rows = computedUnits.filter(u => {
      if (filters.category && u.riskCategoryId !== filters.category) return false;
      if (filters.product && u.productId !== filters.product) return false;
      if (filters.rrBand && u.rrMatrixBand !== filters.rrBand) return false;
      if (q) {
        const cat = getCat(u.riskCategoryId);
        const prod = getProd(u.productId);
        const hay = `${u.id} ${cat?.id} ${cat?.name} ${prod?.name} ${u.owner}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    const dir = sort.dir === 'asc' ? 1 : -1;
    const rrOrder = { 'Severe':5,'High':4,'Moderate':3,'Low-Moderate':2,'Low':1, null:0, undefined:0 };
    rows.sort((a, b) => {
      switch (sort.key) {
        case 'cat':    return dir * (a.riskCategoryId.localeCompare(b.riskCategoryId));
        case 'prod':   return dir * (getProd(a.productId)?.name || '').localeCompare(getProd(b.productId)?.name || '');
        case 'ir':     return dir * (a.ir - b.ir);
        case 'ce':     return dir * ((a.ce ?? -1) - (b.ce ?? -1));
        case 'rr':     return dir * ((rrOrder[a.rrMatrixBand] ?? 0) - (rrOrder[b.rrMatrixBand] ?? 0));
        case 'owner':  return dir * (a.owner || '').localeCompare(b.owner || '');
        case 'date':   return dir * (a.lastUpdated || '').localeCompare(b.lastUpdated || '');
        default:       return 0;
      }
    });
    return rows;
  }, [computedUnits, filters, sort, state.products, state.riskCategories]);

  const onSort = (key) => setSort(s => s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir:'desc' });

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type:'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `kmoney-ewra-${new Date().toISOString().slice(0,10)}.json`; a.click();
    URL.revokeObjectURL(url);
    toast('Exported');
  };
  const importJSON = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const r = new FileReader();
    r.onload = (ev) => {
      try {
        const obj = JSON.parse(ev.target.result);
        if (!obj.riskUnits || !obj.controls || !obj.settings) throw new Error('invalid');
        setState(obj); setSelectedUnitId(null); toast('Imported');
      } catch { toast('Import failed: invalid file'); }
    };
    r.readAsText(file);
    e.target.value = '';
  };
  const resetAll = () => {
    if (confirm('Reset all data to framework defaults? This will discard your edits.')) {
      setState(getDefaults()); setSelectedUnitId(null); toast('Reset to defaults');
    }
  };

  const activeView = selectedUnitId ? 'detail' : tab;

  return (
    <>
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">K</div>
          <div className="brand-text">
            <div className="t">K-Money EWRA</div>
            <div className="s">PCGC Matrix · v2.0</div>
          </div>
        </div>
        <nav className="tabs" aria-label="Primary">
          {[
            { key:'register', label:'Register' },
            { key:'heatmap',  label:'Heat Map' },
            { key:'controls', label:'Controls' },
            { key:'settings', label:'Settings' },
          ].map(t => (
            <button
              key={t.key}
              className={`tab ${activeView === t.key ? 'active' : ''}`}
              onClick={() => { setTab(t.key); setSelectedUnitId(null); }}
            >{t.label}</button>
          ))}
        </nav>
        <div className="topbar-right">
          <span className="chip tag" title="Control credit cap (α)"><span>α</span><span className="num">{state.settings.alpha.toFixed(2)}</span></span>
        </div>
      </header>

      <main>
        {activeView === 'register' && (
          <RegisterView
            state={state} units={filtered} sort={sort} onSort={onSort}
            filters={filters} setFilters={setFilters}
            onSelect={(id) => setSelectedUnitId(id)}
            onNew={() => setNewUnitOpen(true)}
          />
        )}
        {activeView === 'heatmap' && (
          <HeatMapView
            units={computedUnits} state={state}
            onSelect={(id) => setSelectedUnitId(id)}
          />
        )}
        {activeView === 'controls' && (
          <ControlsView
            state={state} update={update} toast={toast}
          />
        )}
        {activeView === 'settings' && (
          <SettingsView
            state={state} update={update}
            onExport={exportJSON} onImport={() => fileInputRef.current?.click()}
            onReset={resetAll}
          />
        )}
        {activeView === 'detail' && (
          <DetailView
            state={state} update={update}
            unit={computedUnits.find(u => u.id === selectedUnitId)}
            onBack={() => setSelectedUnitId(null)}
            onAlpha={(a) => update(s => { s.settings.alpha = a; })}
            toast={toast}
          />
        )}
      </main>

      <input
        ref={fileInputRef} type="file" accept="application/json"
        style={{ display:'none' }}
        onChange={importJSON}
      />

      {newUnitOpen && (
        <NewUnitModal
          state={state}
          existing={state.riskUnits}
          onClose={() => setNewUnitOpen(false)}
          onCreate={(rcId, pid, owner) => {
            const id = `RU-${String(state.riskUnits.length + 1).padStart(3,'0')}`;
            update(s => {
              s.riskUnits.push({
                id, riskCategoryId: rcId, productId: pid,
                owner: owner || '', status: 'Draft', notes: '',
                lastUpdated: new Date().toISOString().slice(0,10),
                factorScores: { P:3, C:3, G:2, Ch:3 },
                factorNarratives: { P:'', C:'', G:'', Ch:'' },
                linkedControls: [],
              });
            });
            setNewUnitOpen(false);
            setSelectedUnitId(id);
            toast('Risk unit created');
          }}
        />
      )}

      {toastNode}
    </>
  );
}

function DetailView({ state, update, unit, onBack, onAlpha, toast }) {
  if (!unit) {
    return <div className="empty">Risk unit not found. <button className="btn btn-sm" onClick={onBack}>Back to register</button></div>;
  }
  const idx = state.riskUnits.findIndex(u => u.id === unit.id);
  const raw = state.riskUnits[idx];
  const cat = state.riskCategories.find(r => r.id === unit.riskCategoryId);
  const prod = state.products.find(p => p.id === unit.productId);

  const setFactor = (k, v) => update(s => {
    s.riskUnits[idx].factorScores[k] = v;
    s.riskUnits[idx].lastUpdated = new Date().toISOString().slice(0,10);
  });
  const setNarr = (k, v) => update(s => {
    s.riskUnits[idx].factorNarratives[k] = v;
    s.riskUnits[idx].lastUpdated = new Date().toISOString().slice(0,10);
  });
  const setMeta = (key, value) => update(s => {
    s.riskUnits[idx][key] = value;
    s.riskUnits[idx].lastUpdated = new Date().toISOString().slice(0,10);
  });
  const updateLC = (i, patch) => update(s => {
    Object.assign(s.riskUnits[idx].linkedControls[i], patch);
    s.riskUnits[idx].lastUpdated = new Date().toISOString().slice(0,10);
  });
  const addLC = () => update(s => {
    const used = new Set(s.riskUnits[idx].linkedControls.map(l => l.controlId));
    const next = s.controls.find(c => !used.has(c.id));
    s.riskUnits[idx].linkedControls.push({ controlId: next?.id || s.controls[0]?.id || '', mitigationWeight: 0, DE: 3, OE: 3 });
  });
  const removeLC = (i) => update(s => {
    s.riskUnits[idx].linkedControls.splice(i, 1);
  });
  const deleteUnit = () => {
    if (!confirm(`Delete risk unit ${unit.id}? This cannot be undone.`)) return;
    update(s => { s.riskUnits = s.riskUnits.filter(u => u.id !== unit.id); });
    toast('Risk unit deleted');
    onBack();
  };

  const w = state.settings.weights;
  const fs = unit.factorScores;
  const irExpr = `${w.P}·${fs.P.toFixed(1)} + ${w.C}·${fs.C.toFixed(1)} + ${w.G}·${fs.G.toFixed(1)} + ${w.Ch}·${fs.Ch.toFixed(1)}`;

  return (
    <>
      <div className="row gap-sm" style={{ marginBottom: 10 }}>
        <button className="btn btn-sm btn-ghost" onClick={onBack}>← Back</button>
        <span className="spacer" />
        <button className="btn btn-sm btn-danger" onClick={deleteUnit}>Delete unit</button>
      </div>

      <div className="detail-head">
        <div className="left">
          <div className="breadcrumb">
            <span>{unit.id}</span>
            <span className="sep">/</span>
            <span>{cat?.id}</span>
            <span className="sep">/</span>
            <span>{prod?.name}</span>
          </div>
          <div className="title">
            <span className="code">{cat?.id}</span>
            <span>{cat?.name}</span>
            <span className="muted" style={{ fontSize: 14, fontWeight: 400 }}>×</span>
            <span>{prod?.name}</span>
          </div>
          <div className="meta">
            <span>Owner&nbsp;<input className="input" style={{ width: 160, padding:'4px 8px', fontSize:12 }} value={raw.owner} onChange={(e) => setMeta('owner', e.target.value)} placeholder="Unassigned" /></span>
            <span>Status&nbsp;
              <select className="select" style={{ padding:'4px 22px 4px 8px', fontSize:12 }} value={raw.status} onChange={(e) => setMeta('status', e.target.value)}>
                <option>Draft</option>
                <option>In Review</option>
                <option>Assessed</option>
              </select>
            </span>
            <span>Updated <b className="num">{raw.lastUpdated}</b></span>
          </div>
        </div>
        <div className="right">
          <div className="row gap-sm">
            <div className="field"><span className="field-label">Inherent</span><Chip size="lg" band={unit.irBand} value={unit.ir} /></div>
            <div className="field"><span className="field-label">Control</span>{unit.ce !== null ? <Chip size="lg" band={unit.ceBand} value={unit.ce} kind="ce" /> : <span className="chip tag lg">—</span>}</div>
            <div className="field"><span className="field-label">Residual</span>{unit.rrMatrixBand ? <Chip size="lg" band={unit.rrMatrixBand} /> : <span className="chip tag lg">—</span>}</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-title"><span className="accent-dot" /> 1 · Inherent Risk — PCGC factors</div>
        <div className="factors">
          {['P','C','G','Ch'].map(k => (
            <FactorCard
              key={k}
              keyName={k}
              score={raw.factorScores[k]}
              narrative={raw.factorNarratives[k]}
              weight={state.settings.weights[k]}
              onScore={(v) => setFactor(k, v)}
              onNarrative={(v) => setNarr(k, v)}
            />
          ))}
        </div>
        <div className="calc" style={{ marginTop: 12 }}>
          <span>IR</span><span className="eq">=</span>
          <b>{irExpr}</b>
          <span className="eq">=</span>
          <span className="res num">{unit.ir.toFixed(2)}</span>
          <Chip band={unit.irBand} />
        </div>
      </div>

      <div className="card">
        <div className="card-title"><span className="accent-dot" /> 2 · Linked controls — Design × Operating Effectiveness</div>
        <table className="lc-table">
          <thead>
            <tr>
              <th className="col-id">Control</th>
              <th className="col-w">Weight</th>
              <th className="col-de">Design Effectiveness</th>
              <th className="col-oe">Operating Effectiveness</th>
              <th className="col-ce">CE</th>
              <th className="col-x"></th>
            </tr>
          </thead>
          <tbody>
            {raw.linkedControls.length === 0 && (
              <tr><td colSpan={6} className="empty" style={{ padding: 24 }}>No controls linked yet — click "Add control" to start.</td></tr>
            )}
            {raw.linkedControls.map((lc, i) => {
              const ctrl = state.controls.find(c => c.id === lc.controlId);
              const ceVal = getCEFromMatrix(lc.DE, lc.OE);
              const ceB = getCEBand(ceVal);
              return (
                <tr key={i} className={ctrl ? '' : 'ghost'}>
                  <td>
                    <select className="select" style={{ width: '100%' }} value={lc.controlId} onChange={(e) => updateLC(i, { controlId: e.target.value })}>
                      {state.controls.map(c => <option key={c.id} value={c.id}>{c.id} — {c.name}</option>)}
                    </select>
                    {!ctrl && <span className="de-oe-help" style={{ color: 'var(--r-sev)' }}>Control was removed; pick another.</span>}
                  </td>
                  <td>
                    <input
                      type="number" min="0" max="1" step="0.05"
                      className="input num-in"
                      value={lc.mitigationWeight}
                      onChange={(e) => updateLC(i, { mitigationWeight: parseFloat(e.target.value) || 0 })}
                    />
                  </td>
                  <td>
                    <DEOESelect value={lc.DE} options={DE_OPTIONS} ariaLabel="Design effectiveness" onChange={(v) => updateLC(i, { DE: v })} />
                  </td>
                  <td>
                    <DEOESelect value={lc.OE} options={OE_OPTIONS} ariaLabel="Operating effectiveness" onChange={(v) => updateLC(i, { OE: v })} />
                  </td>
                  <td><Chip band={ceB} value={ceVal} kind="ce" /></td>
                  <td className="col-x"><button className="btn btn-icon btn-ghost" title="Remove" onClick={() => removeLC(i)}>×</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="row" style={{ marginTop: 12 }}>
          <button className="btn btn-sm btn-primary" onClick={addLC}>+ Add control</button>
          <span className="spacer" />
          <span className={`weight-status ${Math.abs(unit.ceWeightSum - 1.0) < 0.001 ? 'ok' : 'bad'}`}>
            Σ weights = <span className="num">{(unit.ceWeightSum || 0).toFixed(2)}</span>
            {Math.abs(unit.ceWeightSum - 1.0) >= 0.001 && ' (should equal 1.00)'}
          </span>
        </div>
      </div>

      {unit.ce !== null && (
        <div className="card">
          <div className="card-title"><span className="accent-dot" /> 3 · Aggregate control effectiveness</div>
          <div className="calc">
            <span>CE</span><span className="eq">=</span>
            {raw.linkedControls.map((lc, i) => (
              <span key={i}><b>{lc.mitigationWeight.toFixed(2)}·{getCEFromMatrix(lc.DE, lc.OE).toFixed(1)}</b>{i < raw.linkedControls.length - 1 ? <span className="eq"> + </span> : null}</span>
            ))}
            <span className="eq">=</span>
            <span className="res num">{unit.ce.toFixed(2)}</span>
            <Chip band={unit.ceBand} kind="ce" />
            {unit.ceCapped && <span className="warn-pill">⚠ weak-critical-control cap applied (raw = {unit.ceRaw.toFixed(2)})</span>}
          </div>
        </div>
      )}

      {unit.rrMatrixBand && (
        <div className="card">
          <div className="card-title"><span className="accent-dot" /> 4 · Residual risk</div>
          <div className="rr-grid">
            <div className="rr-block">
              <div className="lab">Matrix lookup · governance record</div>
              <div className="val"><Chip size="lg" band={unit.rrMatrixBand} /></div>
              <div className="formula">IR <b>{unit.irBand}</b> × CE <b>{unit.ceBand}</b> → RR <b>{unit.rrMatrixBand}</b></div>
            </div>
            <div className="rr-block">
              <div className="lab">Formula · α-weighted score</div>
              <div className="val">
                <Chip size="lg" band={unit.rrFormulaBand} value={unit.rrFormula} />
              </div>
              <div className="formula">{unit.ir.toFixed(2)} × (1 − {state.settings.alpha.toFixed(2)} × ({unit.ce.toFixed(2)} − 1) ÷ 3) = {unit.rrFormula.toFixed(2)}</div>
              <div className="alpha-row">
                <span className="a-label">α</span>
                <input type="range" min="0" max="1" step="0.05" value={state.settings.alpha} onChange={(e) => onAlpha(parseFloat(e.target.value))} />
                <span className="a-val">{state.settings.alpha.toFixed(2)}</span>
              </div>
            </div>
          </div>
          {unit.disagree && (
            <div className="disagree">
              ⚠ Matrix says <b>{unit.rrMatrixBand}</b> but formula says <b>{unit.rrFormulaBand}</b> (more than one band apart). Per §7.4 the matrix is the governance record; flag this for assessor review.
            </div>
          )}
        </div>
      )}
    </>
  );
}

function SortHeader({ label, k, sort, onSort }) {
  const active = sort.key === k;
  return (
    <th className="sortable" onClick={() => onSort(k)}>
      {label}
      {active && <span className="sort">{sort.dir === 'asc' ? '▲' : '▼'}</span>}
    </th>
  );
}

function RegisterView({ state, units, sort, onSort, filters, setFilters, onSelect, onNew }) {
  return (
    <>
      <div className="view-head">
        <div>
          <div className="view-title">Risk Register</div>
          <div className="view-sub">{units.length} risk units · click any row to assess</div>
        </div>
        <div className="row gap-sm">
          <button className="btn btn-primary" onClick={onNew}>+ New risk unit</button>
        </div>
      </div>

      <div className="filterbar">
        <span className="label">Filter</span>
        <input
          className="input"
          placeholder="Search id, category, product, owner…"
          value={filters.search}
          onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
        />
        <select className="select" value={filters.category} onChange={(e) => setFilters(f => ({ ...f, category: e.target.value }))}>
          <option value="">All categories</option>
          {state.riskCategories.map(r => <option key={r.id} value={r.id}>{r.id} · {r.name}</option>)}
        </select>
        <select className="select" value={filters.product} onChange={(e) => setFilters(f => ({ ...f, product: e.target.value }))}>
          <option value="">All products</option>
          {state.products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select className="select" value={filters.rrBand} onChange={(e) => setFilters(f => ({ ...f, rrBand: e.target.value }))}>
          <option value="">All RR bands</option>
          {['Severe','High','Moderate','Low-Moderate','Low'].map(b => <option key={b} value={b}>{b}</option>)}
        </select>
        {(filters.search || filters.category || filters.product || filters.rrBand) && (
          <button className="btn btn-sm btn-ghost" onClick={() => setFilters({ category:'', product:'', rrBand:'', search:'' })}>Clear</button>
        )}
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <SortHeader label="Risk Category" k="cat"   sort={sort} onSort={onSort} />
              <SortHeader label="Product"       k="prod"  sort={sort} onSort={onSort} />
              <SortHeader label="Inherent"      k="ir"    sort={sort} onSort={onSort} />
              <SortHeader label="Control Eff."  k="ce"    sort={sort} onSort={onSort} />
              <SortHeader label="Residual"      k="rr"    sort={sort} onSort={onSort} />
              <SortHeader label="Owner"         k="owner" sort={sort} onSort={onSort} />
              <SortHeader label="Updated"       k="date"  sort={sort} onSort={onSort} />
              <th style={{ width: 90 }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {units.length === 0 ? (
              <tr><td colSpan={8} className="empty">No risk units match your filters.</td></tr>
            ) : units.map(u => {
              const cat = state.riskCategories.find(r => r.id === u.riskCategoryId);
              const prod = state.products.find(p => p.id === u.productId);
              return (
                <tr key={u.id} className="click" onClick={() => onSelect(u.id)}>
                  <td>
                    <div className="two-line">
                      <span className="top">{cat?.name || u.riskCategoryId}</span>
                      <span className="bot">{u.riskCategoryId}</span>
                    </div>
                  </td>
                  <td>{prod?.name || u.productId}</td>
                  <td><Chip band={u.irBand} value={u.ir} /></td>
                  <td>
                    {u.ce !== null
                      ? <Chip band={u.ceBand} value={u.ce} kind="ce" />
                      : <span className="muted">—</span>}
                  </td>
                  <td>
                    <span className="row gap-sm">
                      {u.rrMatrixBand
                        ? <Chip band={u.rrMatrixBand} />
                        : <span className="muted">—</span>}
                      {u.disagree && <span className="warn-pill" title="Matrix and formula disagree by more than one band">⚠ check</span>}
                    </span>
                  </td>
                  <td className="muted">{u.owner || 'Unassigned'}</td>
                  <td className="muted num">{u.lastUpdated || ''}</td>
                  <td><StatusPill status={u.status} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

function HeatMapView({ units, state, onSelect }) {
  const irBands = ['Severe','High','Moderate','Low-Moderate','Low'];
  const ceBands = ['Weak','Needs Improvement','Satisfactory','Strong'];
  const grid = {};
  irBands.forEach(ir => { grid[ir] = {}; ceBands.forEach(ce => { grid[ir][ce] = []; }); });
  for (const u of units) {
    if (u.ce !== null && u.irBand && u.ceBand) grid[u.irBand][u.ceBand].push(u);
  }
  const total = units.reduce((s, u) => s + (u.ce !== null ? 1 : 0), 0);

  return (
    <>
      <div className="view-head">
        <div>
          <div className="view-title">Heat Map</div>
          <div className="view-sub">{total} of {units.length} risk units have linked controls and a residual rating</div>
        </div>
      </div>
      <div className="heat-wrap">
        <table className="heat">
          <thead>
            <tr>
              <th className="corner" />
              {ceBands.map(ce => <th key={ce} className="axis-x">{ce}</th>)}
            </tr>
          </thead>
          <tbody>
            {irBands.map(ir => (
              <tr key={ir}>
                <th className="axis-y">{ir}</th>
                {ceBands.map(ce => {
                  const list = grid[ir][ce];
                  const rr = getRRFromMatrix(ir, ce);
                  const cls = `lvl-${RR_BAND_CLASS[rr]?.replace('r-', '') || ''}`;
                  return (
                    <td key={ce} className={`cell ${cls}`}>
                      <span className="rrlabel">{rr}</span>
                      <div className="units">
                        {list.map(u => {
                          const cat = state.riskCategories.find(r => r.id === u.riskCategoryId);
                          const prod = state.products.find(p => p.id === u.productId);
                          return (
                            <span
                              key={u.id} className="uc"
                              title={`${cat?.name} × ${prod?.name}\nIR ${u.ir.toFixed(2)} · CE ${u.ce.toFixed(2)}`}
                              onClick={() => onSelect(u.id)}
                            >
                              {u.riskCategoryId}·{prod?.name?.split(' ')[0] || u.productId}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="view-sub" style={{ marginTop: 10 }}>
        Click any unit chip to open its detail. Cells are colored by residual risk band (matrix lookup).
      </div>
    </>
  );
}

function ControlsView({ state, update, toast }) {
  const inUse = useMemo(() => {
    const m = {};
    state.riskUnits.forEach(u => u.linkedControls.forEach(lc => {
      m[lc.controlId] = (m[lc.controlId] || 0) + 1;
    }));
    return m;
  }, [state.riskUnits]);

  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const filtered = state.controls.filter(c => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return c.id.toLowerCase().includes(q) || c.name.toLowerCase().includes(q) || c.desc.toLowerCase().includes(q);
  });

  const addControl = () => {
    const nums = state.controls.map(c => parseInt(c.id.replace('CTRL-',''), 10)).filter(Number.isFinite);
    const next = `CTRL-${String((Math.max(0, ...nums)) + 1).padStart(3,'0')}`;
    update(s => {
      s.controls.push({ id: next, name: 'New control', type:'Preventive', nature:'Manual', frequency:'Event-driven', owner:'2LoD', mitigates: [], desc:'' });
    });
    setEditing(next);
    toast(`${next} added`);
  };
  const del = (id) => {
    if (inUse[id]) { toast(`In use by ${inUse[id]} risk unit${inUse[id]>1?'s':''} — remove first`); return; }
    if (!confirm(`Delete ${id}?`)) return;
    update(s => { s.controls = s.controls.filter(c => c.id !== id); });
  };
  const upd = (id, patch) => update(s => {
    const c = s.controls.find(x => x.id === id);
    if (c) Object.assign(c, patch);
  });

  return (
    <>
      <div className="view-head">
        <div>
          <div className="view-title">Control Repository</div>
          <div className="view-sub">{state.controls.length} controls · edits propagate live to every risk unit dropdown</div>
        </div>
        <div className="row gap-sm">
          <button className="btn btn-primary" onClick={addControl}>+ Add control</button>
        </div>
      </div>

      <div className="filterbar">
        <span className="label">Search</span>
        <input className="input" placeholder="ID, name, or description…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th style={{ width: 96 }}>ID</th>
              <th>Name</th>
              <th style={{ width: 130 }}>Type</th>
              <th style={{ width: 140 }}>Nature</th>
              <th style={{ width: 130 }}>Frequency</th>
              <th style={{ width: 110 }}>Owner</th>
              <th style={{ width: 220 }}>Mitigates</th>
              <th style={{ width: 80 }}>In use</th>
              <th style={{ width: 90 }}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={9} className="empty">No controls match your search.</td></tr>
            )}
            {filtered.map(c => {
              const isEditing = editing === c.id;
              return (
                <tr key={c.id}>
                  <td className="num" style={{ color: 'var(--accent)', fontWeight: 600 }}>{c.id}</td>
                  <td>
                    {isEditing ? (
                      <>
                        <input className="input" style={{ width: '100%' }} value={c.name} onChange={(e) => upd(c.id, { name: e.target.value })} />
                        <textarea className="textarea" style={{ marginTop: 6, minHeight: 48 }} placeholder="Description" value={c.desc} onChange={(e) => upd(c.id, { desc: e.target.value })} />
                      </>
                    ) : (
                      <div className="two-line">
                        <span className="top">{c.name}</span>
                        <span className="bot" style={{ color:'var(--muted)', fontFamily:'var(--sans)', fontSize:12 }}>{c.desc}</span>
                      </div>
                    )}
                  </td>
                  <td>
                    {isEditing
                      ? <select className="select" value={c.type} onChange={(e) => upd(c.id, { type: e.target.value })}>{CONTROL_TYPES.map(t => <option key={t}>{t}</option>)}</select>
                      : <span>{c.type}</span>}
                  </td>
                  <td>
                    {isEditing
                      ? <select className="select" value={c.nature} onChange={(e) => upd(c.id, { nature: e.target.value })}>{CONTROL_NATURES.map(t => <option key={t}>{t}</option>)}</select>
                      : <span>{c.nature}</span>}
                  </td>
                  <td>
                    {isEditing
                      ? <select className="select" value={c.frequency} onChange={(e) => upd(c.id, { frequency: e.target.value })}>{CONTROL_FREQUENCIES.map(t => <option key={t}>{t}</option>)}</select>
                      : <span className="muted">{c.frequency}</span>}
                  </td>
                  <td>
                    {isEditing
                      ? <select className="select" value={c.owner} onChange={(e) => upd(c.id, { owner: e.target.value })}>{CONTROL_OWNERS.map(t => <option key={t}>{t}</option>)}</select>
                      : <span className="muted">{c.owner}</span>}
                  </td>
                  <td>
                    {isEditing
                      ? <MitigatesEditor value={c.mitigates} onChange={(v) => upd(c.id, { mitigates: v })} categories={state.riskCategories} />
                      : <div className="mit-list">{c.mitigates.map(m => <span key={m} className="chip tag">{m}</span>)}</div>}
                  </td>
                  <td className="num" style={{ color: inUse[c.id] ? 'var(--c-strong)' : 'var(--muted)' }}>{inUse[c.id] || 0}</td>
                  <td>
                    <div className="row gap-sm">
                      <button className="btn btn-sm" onClick={() => setEditing(isEditing ? null : c.id)}>{isEditing ? 'Done' : 'Edit'}</button>
                      <button className="btn btn-sm btn-danger" onClick={() => del(c.id)}>Del</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

function SettingsView({ state, update, onExport, onImport, onReset }) {
  const s = state.settings;
  const wSum = s.weights.P + s.weights.C + s.weights.G + s.weights.Ch;
  const setW = (k, v) => update(st => { st.settings.weights[k] = parseFloat(v) || 0; });
  const setN = (k, v) => update(st => { st.settings[k] = parseFloat(v) || 0; });

  return (
    <>
      <div className="view-head">
        <div>
          <div className="view-title">Settings</div>
          <div className="view-sub">Calibrate the framework. All changes are saved automatically and applied to every risk unit live.</div>
        </div>
      </div>
      <div className="settings-grid">
        <div className="card">
          <div className="card-title"><span className="accent-dot" /> Factor weights</div>
          {['P','C','G','Ch'].map(k => (
            <div className="kv" key={k}>
              <span className="k">{FACTOR_RUBRICS[k].label} ({k})</span>
              <span className="v">
                <input type="range" min="0" max="1" step="0.05" value={s.weights[k]} onChange={(e) => setW(k, e.target.value)} style={{ width: 140 }} />
                <input type="number" min="0" max="1" step="0.05" className="input num-in" value={s.weights[k]} onChange={(e) => setW(k, e.target.value)} />
              </span>
            </div>
          ))}
          <div className="kv">
            <span className="k">Σ (must equal 1.00)</span>
            <span className={`v ${Math.abs(wSum - 1) < 0.001 ? '' : 'weight-status bad'}`}>
              <span className="num" style={{ color: Math.abs(wSum - 1) < 0.001 ? 'var(--c-strong)' : 'var(--r-sev)' }}>{wSum.toFixed(2)}</span>
            </span>
          </div>
        </div>

        <div className="card">
          <div className="card-title"><span className="accent-dot" /> Alpha (α) · control credit cap</div>
          <div className="kv">
            <span className="k">α</span>
            <span className="v">
              <input type="range" min="0" max="1" step="0.05" value={s.alpha} onChange={(e) => setN('alpha', e.target.value)} style={{ width: 200 }} />
              <input type="number" min="0" max="1" step="0.05" className="input num-in" value={s.alpha} onChange={(e) => setN('alpha', e.target.value)} />
            </span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6, lineHeight: 1.5 }}>
            Caps maximum control credit at α × 100% of inherent risk. Default 0.70 — examiners reject values that imply controls can fully neutralize inherent risk.
          </div>
        </div>

        <div className="card">
          <div className="card-title"><span className="accent-dot" /> Weak critical control cap</div>
          <div className="kv">
            <span className="k">Mitigation weight threshold (w &gt;)</span>
            <span className="v"><input type="number" min="0" max="1" step="0.05" className="input num-in" value={s.weakCriticalThreshold} onChange={(e) => setN('weakCriticalThreshold', e.target.value)} /></span>
          </div>
          <div className="kv">
            <span className="k">CE threshold (CE &lt;)</span>
            <span className="v"><input type="number" min="0" max="4" step="0.1" className="input num-in" value={s.weakCriticalCELimit} onChange={(e) => setN('weakCriticalCELimit', e.target.value)} /></span>
          </div>
          <div className="kv">
            <span className="k">Aggregate cap value</span>
            <span className="v"><input type="number" min="0" max="4" step="0.1" className="input num-in" value={s.weakCriticalCap} onChange={(e) => setN('weakCriticalCap', e.target.value)} /></span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6, lineHeight: 1.5 }}>
            §6.4 — if any control with weight above the threshold is rated below the CE threshold, aggregate CE is capped.
          </div>
        </div>

        <div className="card">
          <div className="card-title"><span className="accent-dot" /> Data</div>
          <div className="row gap-sm" style={{ marginBottom: 10 }}>
            <button className="btn" onClick={onExport}>Export JSON</button>
            <button className="btn" onClick={onImport}>Import JSON</button>
            <span className="spacer" />
            <button className="btn btn-danger" onClick={onReset}>Reset to defaults</button>
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>
            State is persisted to <code>localStorage</code> on every edit. Use Export to back up or share. Reset wipes everything and reloads the framework's seed data.
          </div>
        </div>
      </div>
    </>
  );
}

function NewUnitModal({ state, existing, onClose, onCreate }) {
  const [rcId, setRcId] = useState(state.riskCategories[0]?.id || '');
  const [pid, setPid] = useState(state.products[0]?.id || '');
  const [owner, setOwner] = useState('');
  const dup = existing.some(u => u.riskCategoryId === rcId && u.productId === pid);
  return (
    <Modal
      title="New risk unit"
      onClose={onClose}
      actions={[
        <button key="c" className="btn" onClick={onClose}>Cancel</button>,
        <button key="ok" className="btn btn-primary" disabled={dup} onClick={() => onCreate(rcId, pid, owner)}>Create</button>,
      ]}
    >
      <div className="field">
        <span className="field-label">Risk category</span>
        <select className="select" value={rcId} onChange={(e) => setRcId(e.target.value)}>
          {state.riskCategories.map(c => <option key={c.id} value={c.id}>{c.id} · {c.name}</option>)}
        </select>
      </div>
      <div className="field">
        <span className="field-label">Product</span>
        <select className="select" value={pid} onChange={(e) => setPid(e.target.value)}>
          {state.products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>
      <div className="field">
        <span className="field-label">Owner (optional)</span>
        <input className="input" value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="e.g. BSA Officer" />
      </div>
      {dup && <div className="disagree" style={{ marginTop: 10 }}>A risk unit for this category × product already exists.</div>}
    </Modal>
  );
}
