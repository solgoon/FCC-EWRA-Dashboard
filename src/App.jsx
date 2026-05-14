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
  { id:'P-01', name:'P2P Transfers',       short:'P2P',         status:'Live (soft launch)' },
  { id:'P-02', name:'Visa Debit Card',     short:'Visa Debit',  status:'Live (soft launch)' },
  { id:'P-03', name:'Direct Deposit',      short:'Direct Dep.', status:'Roadmap' },
  { id:'P-04', name:'High-Yield Interest', short:'High-Yield',  status:'Roadmap' },
  { id:'P-05', name:'Cashback Rewards',    short:'Cashback',    status:'Roadmap' },
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

const RU_SEEDS = {
  'RC-01_P-01': {
    f:[4.0,3.5,2.0,5.0], owner:'BSA Officer', status:'Assessed', date:'2026-04-01',
    n:{
      P:'High velocity, open-loop, irrevocable P2P with strong cash-equivalence; novelty elevated by in-feed context.',
      C:'Mainstream retail majority but elevated synthetic-ID attempts in soft launch; pseudonymous handle culture.',
      G:'US only at launch.',
      Ch:'Non-face-to-face onboarding; in-feed DM → P2P in seconds; documented bot exposure on parent platform.',
    },
    c:[['CTRL-001','s',3,4],['CTRL-003','k',3,4],['CTRL-006','s',3,4],['CTRL-010','k',4,2],['CTRL-011','s',2,2]],
    notes:'§5.7 worked example. Re-rated quarterly. Sponsor bank reviewed Q1 2026.',
    upd:[
      ['BSA Officer','Reviewed with sponsor bank counterpart; alignment confirmed for Q1.','2026-03-15T10:00:00'],
      ['Fraud Lead','Mule typology detector (CTRL-010) showing strain — see ISS-001 for remediation plan.','2026-04-22T16:30:00'],
    ],
  },
  'RC-02_P-01': {
    f:[3.0,3.0,2.5,4.0], owner:'BSA Officer', status:'Assessed', date:'2026-03-28',
    n:{
      P:'Standard P2P rails; TF exposure primarily a function of customer/sanctions overlap rather than product novelty.',
      C:'Same retail population as ML; small subset of customers map to FATF priority jurisdictions via geo signals.',
      G:'US-only at launch but cross-border via PEP/RCA second-degree connections; small surface.',
      Ch:'In-feed DM solicitation surface modeled in TM scenarios; bot exposure inherits from RC-01.',
    },
    c:[['CTRL-002','k',4,3],['CTRL-006','k',3,4],['CTRL-007','k',3,3]],
  },
  'RC-03_P-01': {
    f:[3.0,3.0,3.0,4.0], owner:'OFAC Officer', status:'Assessed', date:'2026-04-08',
    n:{
      P:'Open-loop P2P with no counterparty restrictions; sanctions exposure tracks customer + geography.',
      C:'PEP rate sub-target; small uptick in name-similarity hits since soft launch.',
      G:'US-only but FATF-grey-list device signals observed at ~0.3% — heightened from baseline.',
      Ch:'VPN/proxy heuristics flag ~1.4% of sessions; CTRL-004 blocks the high-confidence subset.',
    },
    c:[['CTRL-002','k',4,4],['CTRL-004','k',3,3],['CTRL-006','k',3,4]],
    notes:'Hourly OFAC list refresh in progress (ACT-004). Sponsor bank monitoring weekly.',
    upd:[
      ['OFAC Officer','List refresh cadence reduced to hourly target; see ACT-004.','2026-04-25T09:15:00'],
    ],
  },
  'RC-04_P-01': {
    f:[4.0,4.0,2.0,5.0], owner:'Fraud Lead', status:'Assessed', date:'2026-04-05',
    n:{
      P:'Irrevocable P2P, no chargeback rail; high social-engineering ceiling.',
      C:'Scam payout patterns concentrated in 25-44 demographic; synthetic-ID attempts elevated.',
      G:'US-only.',
      Ch:'In-feed DM → P2P creates the lowest-friction scam funnel observed in soft launch.',
    },
    c:[['CTRL-001','s',3,4],['CTRL-003','k',3,4],['CTRL-005','s',3,3],['CTRL-010','k',4,2]],
    notes:'Highest priority residual on the program. Two open issues (ISS-001, ISS-007).',
    upd:[
      ['Fraud Lead','Pig-butchering case volume up 12% MoM; not isolated to mule cluster.','2026-04-10T11:00:00'],
      ['BSA Analyst','Coordinating with T&S on social-graph signal sharing MOU.','2026-04-30T14:20:00'],
    ],
  },
  'RC-05_P-01': {
    f:[3.0,3.0,2.0,4.0], owner:'Fraud Lead', status:'Assessed', date:'2026-03-30',
    n:{
      P:'P2P speed disadvantages elders facing urgent-payment scams.',
      C:'~6% of base flagged as >65 in onboarding data; modest but not negligible.',
      G:'US-only.',
      Ch:'DM-based grandparent and tech-support scams observed in TM samples.',
    },
    c:[['CTRL-003','k',3,4],['CTRL-013','k',3,3],['CTRL-018','s',3,3]],
  },
  'RC-06_P-01': {
    f:[3.0,4.0,2.5,5.0], owner:'BSA Officer', status:'Assessed', date:'2026-04-12',
    n:{
      P:'P2P used as payout rail for exploitative content monetized off-platform.',
      C:'Creator-adjacent segments overrepresented; T&S signal correlations under review.',
      G:'US-only but content originates globally.',
      Ch:'Parent platform Trust & Safety telemetry intermittent — CTRL-011 ramping; high amplification risk.',
    },
    c:[['CTRL-011','k',2,2],['CTRL-012','k',3,3],['CTRL-007','s',3,3]],
    notes:'Owner-shared with parent T&S team. Critical to maintain MOU cadence.',
    upd:[
      ['BSA Officer','T&S signal latency continues to be the blocker (ISS-003).','2026-04-30T17:00:00'],
    ],
  },
  'RC-07_P-01': {
    f:[3.0,3.0,2.0,3.0], owner:'Consumer Compliance Lead', status:'In Review', date:'2026-05-04',
    n:{
      P:'P2P irrevocability and Reg E error-resolution intersect at scam disputes.',
      C:'Complaint mix dominated by Reg E unauthorized claims; modest UDAAP volume.',
      G:'US-only.',
      Ch:'In-app dispute flow under redesign; provisional credit timers consistent with Reg E.',
    },
    c:[['CTRL-008','k',3,3],['CTRL-009','k',3,3],['CTRL-018','k',3,3]],
  },
  'RC-08_P-01': {
    f:[4.0,4.0,2.0,5.0], owner:'CISO', status:'Assessed', date:'2026-04-18',
    n:{
      P:'P2P credential value drives credential stuffing pressure.',
      C:'Parent-platform credential overlap surfaces in 4–6% of failed logins.',
      G:'US-only.',
      Ch:'Mobile + web with no MFA-by-default at signup; step-up only on risky sessions.',
    },
    c:[['CTRL-001','k',3,4],['CTRL-004','k',3,3],['CTRL-005','k',3,3]],
    notes:'Behavioral biometrics retrain pending (ACT-011).',
    upd:[
      ['CISO','SIM-swap attempt volume stable; biometrics model drift the larger concern (ISS-011).','2026-04-26T08:45:00'],
    ],
  },
  'RC-10_P-01': {
    f:[3.0,2.0,2.0,3.0], owner:'TPRM Lead', status:'Assessed', date:'2026-03-25',
    n:{
      P:'Standard fintech-bank program-manager structure.',
      C:'Customer base entirely under sponsor bank deposit insurance perimeter.',
      G:'Sponsor bank US-domiciled; subprocessors limited to US/EU.',
      Ch:'Sponsor bank monthly ops review on cadence; one finding open (ISS-008).',
    },
    c:[['CTRL-016','k',4,3],['CTRL-017','k',3,4],['CTRL-019','s',3,3]],
  },

  'RC-01_P-02': {
    f:[3.0,3.0,2.0,3.0], owner:'BSA Officer', status:'Assessed', date:'2026-03-22',
    n:{
      P:'Visa debit with merchant-network counterparty; ML exposure lower than P2P but non-trivial cash-equivalence.',
      C:'Mainstream debit-card user base; PEP/RCA at baseline.',
      G:'US-only acceptance at launch; some international MCC exposure.',
      Ch:'Card-present and card-not-present surfaces both covered by TM.',
    },
    c:[['CTRL-001','k',3,4],['CTRL-003','k',3,4],['CTRL-006','s',3,4],['CTRL-007','s',3,3]],
    notes:'Lower priority than P2P/DD for ML scrutiny.',
    upd:[
      ['BSA Officer','Q1 review uneventful; no scenario changes proposed.','2026-04-01T13:00:00'],
    ],
  },
  'RC-03_P-02': {
    f:[3.0,3.0,2.5,3.0], owner:'OFAC Officer', status:'Assessed', date:'2026-04-02',
    n:{
      P:'Visa rails carry counterparty screening through network plus K-Money\'s own checks.',
      C:'No PEP/RCA debit-only segment of concern; standard retail.',
      G:'US-only; international MCC requests blocked when issuer-country is sanctioned.',
      Ch:'Standard card auth + network rules; no in-feed surface.',
    },
    c:[['CTRL-002','k',4,4],['CTRL-004','k',3,3],['CTRL-006','s',3,4]],
  },
  'RC-04_P-02': {
    f:[4.0,3.0,2.0,4.0], owner:'Fraud Lead', status:'Assessed', date:'2026-04-15',
    n:{
      P:'Card-not-present fraud and BIN-attack pressure typical for new fintech cards.',
      C:'No high-risk merchant segments; standard retail use.',
      G:'US-only.',
      Ch:'CNP transactions are the primary risk surface; chargeback rail provides recovery.',
    },
    c:[['CTRL-001','s',3,4],['CTRL-003','k',3,4],['CTRL-005','k',3,3],['CTRL-010','s',3,3]],
    notes:'Mid-March BIN-attack spike under review (ISS-009).',
    upd:[
      ['Fraud Lead','Containment runbook (ACT-009) ready for tabletop next Thursday.','2026-04-28T10:30:00'],
    ],
  },
  'RC-07_P-02': {
    f:[3.0,3.0,2.0,3.0], owner:'Consumer Compliance Lead', status:'Assessed', date:'2026-03-30',
    n:{
      P:'Card-fee schedule simple; no junk-fee pattern flagged.',
      C:'Complaint volume stable; Reg E mix dominant.',
      G:'US-only.',
      Ch:'In-app dispute flow + call center; provisional credit SLA met >99% in Q1.',
    },
    c:[['CTRL-008','k',3,3],['CTRL-009','k',3,4],['CTRL-018','k',3,3]],
  },
  'RC-08_P-02': {
    f:[3.0,3.0,2.0,4.0], owner:'CISO', status:'Assessed', date:'2026-04-09',
    n:{
      P:'Card credentials targeted by SIM-swap-adjacent ATO chains.',
      C:'Same parent-platform-credential overlap as RC-08 × P-01.',
      G:'US-only.',
      Ch:'Wallet/Apple Pay enrollment is the primary ATO vector; CTRL-005 step-up applied.',
    },
    c:[['CTRL-001','s',3,4],['CTRL-004','k',3,3],['CTRL-005','k',3,3]],
  },
  'RC-10_P-02': {
    f:[3.0,2.0,2.0,3.0], owner:'TPRM Lead', status:'Assessed', date:'2026-03-25',
    n:{
      P:'Card BIN sponsor + issuer-processor chain adds parties; well-documented.',
      C:'Same as P-01.',
      G:'Same.',
      Ch:'Quarterly joint risk review covers card-specific topics.',
    },
    c:[['CTRL-016','k',4,3],['CTRL-017','k',3,4],['CTRL-019','s',3,3]],
  },

  'RC-01_P-03': {
    f:[3.0,3.0,2.0,3.0], owner:'BSA Officer', status:'Assessed', date:'2026-04-05',
    n:{
      P:'Direct deposit gives a stable funding rail; ML risk via staged-employment / funnel-account patterns.',
      C:'Salary-receiving segment is lower-risk; subset of self-employed inflows under scrutiny.',
      G:'US-only.',
      Ch:'ACH operator + originator chain visible; TM rules cover funnel patterns.',
    },
    c:[['CTRL-001','k',3,4],['CTRL-003','k',3,4],['CTRL-006','k',3,4],['CTRL-007','s',3,3]],
    notes:'Roadmap product — pre-launch addendum approved.',
    upd:[
      ['BSA Officer','DD launch dependency on EDD backlog clearance (ISS-008).','2026-04-22T09:00:00'],
    ],
  },
  'RC-03_P-03': {
    f:[3.0,3.0,2.0,2.0], owner:'OFAC Officer', status:'Assessed', date:'2026-03-31',
    n:{
      P:'ACH originators screened on file; sanctions-evasion risk via small employers low.',
      C:'No PEP concentration.',
      G:'US-only originators.',
      Ch:'Closed-loop bank-to-bank channel; minimal abuse surface.',
    },
    c:[['CTRL-002','k',4,4],['CTRL-004','k',3,3],['CTRL-006','s',3,4]],
  },
  'RC-04_P-03': {
    f:[4.0,4.0,2.0,3.0], owner:'Fraud Lead', status:'Assessed', date:'2026-04-20',
    n:{
      P:'Payroll redirection + tax refund redirection are the headline DD fraud typologies.',
      C:'Account-takeover-driven changes to DD instructions concentrated post-tax-season.',
      G:'US-only.',
      Ch:'In-app DD instruction change is the controlled surface; step-up applied.',
    },
    c:[['CTRL-001','k',3,4],['CTRL-003','k',3,4],['CTRL-005','k',3,3],['CTRL-010','s',3,3]],
    notes:'DD launch gating: step-up coverage gap (ISS-007) must close before public release.',
    upd:[
      ['Fraud Lead','Tax-season postmortem rolled into pre-launch readiness pack.','2026-05-02T15:45:00'],
    ],
  },
  'RC-07_P-03': {
    f:[3.0,3.0,2.0,3.0], owner:'Consumer Compliance Lead', status:'In Review', date:'2026-05-06',
    n:{
      P:'Reg E provisional-credit timers are the primary compliance surface for DD-error claims.',
      C:'Standard retail.',
      G:'US-only.',
      Ch:'CTRL-008 currently operating sub-target due to volume — issue open (ISS-006).',
    },
    c:[['CTRL-008','k',3,2],['CTRL-009','k',3,4],['CTRL-018','k',3,3]],
    notes:'CE rated Needs Improvement until backlog clears.',
    upd:[
      ['Consumer Compliance Lead','Two new analysts join 5/19; backlog burndown plan in ACT-006.','2026-05-08T11:15:00'],
    ],
  },
  'RC-08_P-03': {
    f:[4.0,3.0,2.0,3.0], owner:'CISO', status:'Assessed', date:'2026-04-14',
    n:{
      P:'BEC attempts targeting DD instruction changes are the dominant cyber risk for this product.',
      C:'Customer susceptibility average; phishing-aware messaging at change time.',
      G:'US-only.',
      Ch:'Email-channel BEC primarily; in-app + biometrics provide channel separation.',
    },
    c:[['CTRL-001','k',3,4],['CTRL-004','k',3,3],['CTRL-005','k',3,3]],
    notes:'See ISS-007 for legacy-iOS step-up gap.',
    upd:[
      ['CISO','Legacy iOS deprecation timeline accelerated; ACT-007 on track.','2026-04-29T13:20:00'],
    ],
  },
  'RC-10_P-03': {
    f:[3.0,2.0,2.0,3.0], owner:'TPRM Lead', status:'Assessed', date:'2026-03-29',
    n:{
      P:'ACH operator + sponsor bank chain; documented and reviewed.',
      C:'Customer base unchanged from other products.',
      G:'US-only.',
      Ch:'Same quarterly cadence as P-02.',
    },
    c:[['CTRL-016','k',4,3],['CTRL-017','k',3,4],['CTRL-019','s',3,3]],
  },

  'RC-07_P-04': {
    f:[4.0,3.0,2.0,3.0], owner:'CCO', status:'In Review', date:'2026-05-10',
    n:{
      P:'High-yield interest is the headline UDAAP exposure: Reg DD + FDIC-claim sensitivity.',
      C:'Mainstream retail attracted by yield rate; misperception risk on insurance status.',
      G:'US-only.',
      Ch:'In-app marketing copy is the primary disclosure surface; gate is CTRL-009.',
    },
    c:[['CTRL-009','k',4,3],['CTRL-008','s',3,3],['CTRL-018','k',3,3]],
    notes:'Senate Banking Committee letter referenced explicitly. Top-of-mind for the CCO.',
    upd:[
      ['CCO','Marketing copy v3 in sponsor-bank legal review; targeting 5/15 sign-off.','2026-05-04T16:00:00'],
      ['Consumer Compliance Lead','Reg DD APY calc validated end-to-end against latest TISA guidance.','2026-05-08T10:30:00'],
    ],
  },
  'RC-10_P-04': {
    f:[3.0,2.0,2.0,3.0], owner:'TPRM Lead', status:'Assessed', date:'2026-04-08',
    n:{
      P:'Deposit-side product depends entirely on sponsor bank balance sheet; vendor concentration limited.',
      C:'No segment-specific exposure beyond standard.',
      G:'US-only.',
      Ch:'Sponsor bank financial-health attestation quarterly.',
    },
    c:[['CTRL-016','k',4,3],['CTRL-017','k',3,4],['CTRL-019','s',3,3]],
  },

  'RC-04_P-05': {
    f:[3.0,3.0,2.0,3.0], owner:'Fraud Lead', status:'Draft', date:'2026-05-09',
    n:{
      P:'Cashback rewards create a bonus-abuse and synthetic-account-farm incentive.',
      C:'New-account cohorts disproportionately exhibit bonus-stacking patterns.',
      G:'US-only.',
      Ch:'In-app referral surface is the primary abuse vector.',
    },
    c:[['CTRL-003','k',3,3],['CTRL-005','k',3,3],['CTRL-010','k',3,3]],
    notes:'Pre-launch draft. Promo-engine team owns abuse-rule design.',
    upd:[
      ['Fraud Lead','Abuse-rule v1 baseline FPR ~6%, targeting <3% before launch.','2026-05-07T14:00:00'],
    ],
  },
  'RC-07_P-05': {
    f:[3.0,3.0,2.0,3.0], owner:'UDAAP Specialist', status:'Draft', date:'2026-05-09',
    n:{
      P:'Cashback terms disclosure and earn-cap clarity are the UDAAP surface.',
      C:'Mainstream retail.',
      G:'US-only.',
      Ch:'In-app T&Cs surface; legal review pending.',
    },
    c:[['CTRL-008','k',3,3],['CTRL-009','k',3,4],['CTRL-018','k',3,3]],
  },
};

function makeDefaultRiskUnits() {
  const units = [];
  let idx = 0;
  for (const [pid, cats] of Object.entries(PRODUCT_CATEGORIES)) {
    for (const cat of cats) {
      idx++;
      const id = `RU-${String(idx).padStart(3,'0')}`;
      const key = `${cat}_${pid}`;
      const seed = RU_SEEDS[key];
      if (!seed) {
        units.push({
          id, riskCategoryId: cat, productId: pid,
          owner:'Unassigned', status:'Draft', notes:'',
          lastUpdated: todayISO(),
          factorScores:{ P:3, C:3, G:2, Ch:3 },
          factorNarratives:{ P:'', C:'', G:'', Ch:'' },
          linkedControls:[], updates:[],
        });
        continue;
      }
      units.push({
        id, riskCategoryId: cat, productId: pid,
        owner: seed.owner, status: seed.status, notes: seed.notes || '',
        lastUpdated: seed.date,
        factorScores:{ P:seed.f[0], C:seed.f[1], G:seed.f[2], Ch:seed.f[3] },
        factorNarratives: seed.n,
        linkedControls: (seed.c || []).map(([cid, t, de, oe]) => ({
          controlId: cid,
          tier: t === 'k' ? 'key' : 'supporting',
          DE: de, OE: oe,
        })),
        updates: (seed.upd || []).map(([author, text, date], i) => ({
          id:`upd-${id}-${i+1}`, author, text, date,
        })),
      });
    }
  }
  return units;
}

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
const round3 = (n) => Math.round((n + Number.EPSILON) * 1000) / 1000;
const clamp  = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

const productSuffix = (pid) => {
  if (!pid) return '';
  const m = /(\d+)/.exec(pid);
  return m ? m[1].padStart(2, '0') : '';
};
const rcRefCode = (rcId, pid) => `${rcId || ''}-${productSuffix(pid)}`;
const ruRefCode = (unit) => unit ? rcRefCode(unit.riskCategoryId, unit.productId) : '';

function computeControlWeights(linked) {
  const out = (linked || []).map(l => ({ ...l }));
  const K = out.filter(l => l.tier === 'key').length;
  const S = out.filter(l => l.tier !== 'key').length;
  const denom = 2 * K + S;
  if (denom === 0) { out.forEach(l => { l.weight = 0; }); return out; }
  const wk = 2 / denom;
  const ws = 1 / denom;
  for (const l of out) l.weight = l.tier === 'key' ? wk : ws;
  return out;
}

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
  const weighted = computeControlWeights(linked);
  const weightSum = round2(weighted.reduce((s, l) => s + (l.weight || 0), 0));
  if (weighted.length === 0) return { value:null, raw:null, band:null, capped:false, weightSum, perControl: [] };

  const valid = weighted.filter(l => Number.isFinite(getCEFromMatrix(l.DE, l.OE)));
  if (valid.length === 0) return { value:null, raw:null, band:null, capped:false, weightSum, perControl: weighted };

  const raw = round2(valid.reduce((s, l) => s + l.weight * getCEFromMatrix(l.DE, l.OE), 0));
  const trigger = weighted.some(l =>
    l.weight > settings.weakCriticalThreshold &&
    getCEFromMatrix(l.DE, l.OE) < settings.weakCriticalCELimit
  );
  const capped = trigger && raw > settings.weakCriticalCap;
  const value = capped ? settings.weakCriticalCap : raw;
  return { value:round2(value), raw, band:getCEBand(value), capped, weightSum, perControl: weighted };
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

const STORAGE_KEY = 'kmoney-ewra-v3';
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return migrate(JSON.parse(raw));
  } catch {}
  return null;
}
function saveState(s) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch {}
}
function migrate(s) {
  if (!s) return s;
  if (!Array.isArray(s.issues)) s.issues = [];
  if (!Array.isArray(s.actions)) s.actions = [];
  if (!Array.isArray(s.savedViews)) s.savedViews = [];
  for (const u of s.riskUnits || []) {
    if (!Array.isArray(u.updates)) u.updates = [];
    if (u.notes == null) u.notes = '';
    for (const lc of (u.linkedControls || [])) {
      if (lc.tier == null) {
        lc.tier = (Number(lc.mitigationWeight) || 0) >= 0.25 ? 'key' : 'supporting';
      }
      delete lc.mitigationWeight;
    }
  }
  for (const c of s.controls || []) {
    if (!Array.isArray(c.updates)) c.updates = [];
  }
  return s;
}
function getDefaults() {
  return {
    riskCategories: DEFAULT_RISK_CATEGORIES,
    products: DEFAULT_PRODUCTS,
    productCategories: PRODUCT_CATEGORIES,
    controls: DEFAULT_CONTROLS.map(c => ({ ...c, mitigates:[...c.mitigates], updates: [] })),
    riskUnits: makeDefaultRiskUnits(),
    issues: SEED_ISSUES(),
    actions: SEED_ACTIONS(),
    savedViews: [],
    settings: { ...DEFAULT_SETTINGS, weights:{ ...DEFAULT_SETTINGS.weights } },
  };
}

function todayISO() { return new Date().toISOString().slice(0,10); }
function nowISO()   { return new Date().toISOString(); }
function isOverdue(dateStr) {
  if (!dateStr) return false;
  const d = String(dateStr).slice(0,10);
  return d < todayISO();
}
function dueWithinDays(dateStr, days) {
  if (!dateStr) return false;
  const d = new Date(String(dateStr).slice(0,10));
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() + days);
  return d <= cutoff && d >= new Date(todayISO());
}
function formatDate(dateStr) {
  if (!dateStr) return '—';
  return String(dateStr).slice(0,10);
}
function nextId(prefix, list) {
  const nums = (list || []).map(x => {
    const m = new RegExp(`^${prefix}-?(\\d+)$`).exec(x.id || '');
    return m ? parseInt(m[1], 10) : 0;
  });
  const n = (nums.length ? Math.max(...nums) : 0) + 1;
  return `${prefix}-${String(n).padStart(3, '0')}`;
}

const ISSUE_SEVERITIES = ['Critical','High','Medium','Low'];
const ISSUE_TYPES      = ['Finding','Observation','Incident'];
const ISSUE_SOURCES    = ['Self-identified','Audit','Regulatory','Sponsor Bank'];
const ISSUE_STATUSES   = ['Open','In Progress','Closed'];
const ACTION_STATUSES  = ['Not Started','In Progress - Planning','In Progress - Execution','Completed','Cancelled'];

const SEV_CLASS = { Critical:'r-sev', High:'r-high', Medium:'r-mod', Low:'r-low' };
const STATUS_CLASS = {
  'Open':'r-high', 'In Progress':'accent', 'Closed':'r-low',
  'Not Started':'tag', 'In Progress - Planning':'accent',
  'In Progress - Execution':'r-mod', 'Completed':'r-low', 'Cancelled':'tag',
};

function SEED_ISSUES() {
  return [
    {
      id:'ISS-001',
      title:'Mule-detection false-positive rate above tolerance',
      description:'CTRL-010 alert volume up 38% week-over-week; analysts confirm majority are FPs. Risk: alert fatigue, true mules slipping through.',
      severity:'High', type:'Finding', source:'Self-identified', status:'In Progress',
      owner:'Fraud Lead', team:'BSA/AML',
      identifiedDate:'2026-04-22', dueDate:'2026-05-25',
      linkedRiskUnits:['RU-001','RU-004'], linkedControls:['CTRL-010'],
      notes:'', updates:[
        { id:'upd-1', author:'BSA Officer', text:'Engineering scoped retune; ETA ~2 weeks.', date:'2026-04-28T15:10:00' },
        { id:'upd-2', author:'Fraud Lead', text:'Tabletop walkthrough completed; runbook v2 ready for QA.', date:'2026-05-05T11:20:00' },
      ],
    },
    {
      id:'ISS-002',
      title:'Reg E disclosure language for high-yield APY pending review',
      description:'Marketing copy for 6% APY feature has not yet passed CTRL-009 gate. Senate Banking Committee letter referenced explicitly.',
      severity:'Critical', type:'Finding', source:'Regulatory', status:'Open',
      owner:'CCO', team:'Compliance',
      identifiedDate:'2026-04-18', dueDate:'2026-05-10',
      linkedRiskUnits:['RU-022'], linkedControls:['CTRL-009'],
      notes:'Pre-launch gating issue for the 6% APY rollout.', updates:[],
    },
    {
      id:'ISS-003',
      title:'Platform-integrity feed ingestion gap',
      description:'CTRL-011 ramping with intermittent dropped events from parent platform; design effective but operating sub-target.',
      severity:'Medium', type:'Observation', source:'Self-identified', status:'Open',
      owner:'Platform Engineering Lead', team:'Engineering',
      identifiedDate:'2026-04-30', dueDate:'2026-06-15',
      linkedRiskUnits:['RU-001','RU-006'], linkedControls:['CTRL-011'],
      notes:'', updates:[],
    },
    {
      id:'ISS-004',
      title:'OFAC SDN list synchronization delay',
      description:'Vendor list-refresh cadence drifted from hourly to ~6-hour windows during w/c 2026-04-12. No true-hit miss confirmed, but exposure window widened.',
      severity:'High', type:'Finding', source:'Audit', status:'In Progress',
      owner:'OFAC Officer', team:'BSA/AML',
      identifiedDate:'2026-04-20', dueDate:'2026-05-08',
      linkedRiskUnits:['RU-003','RU-011','RU-017'], linkedControls:['CTRL-002'],
      notes:'Sponsor bank notified within 24h per escalation policy.', updates:[
        { id:'upd-1', author:'OFAC Officer', text:'Vendor SLA breach acknowledged; alternate list-source PoC opened in parallel.', date:'2026-04-24T08:30:00' },
        { id:'upd-2', author:'CCO', text:'Quarterly Board pack to reference this finding and ACT-004 status.', date:'2026-05-02T17:00:00' },
      ],
    },
    {
      id:'ISS-005',
      title:'CIP non-doc verification failure rate elevated for synthetic ID cohort',
      description:'CIP failure rate for synthetic-ID-flagged applicants is 1.1% vs <0.5% target — non-documentary verification not catching device-farm clusters.',
      severity:'High', type:'Finding', source:'Self-identified', status:'Open',
      owner:'Onboarding Risk Lead', team:'1LoD',
      identifiedDate:'2026-05-01', dueDate:'2026-06-30',
      linkedRiskUnits:['RU-001','RU-004','RU-018'], linkedControls:['CTRL-001'],
      notes:'New vendor signals being scoped for integration.', updates:[
        { id:'upd-1', author:'Onboarding Risk Lead', text:'Vendor shortlist (3 providers) returns Friday; PoC scoping next week.', date:'2026-05-06T14:00:00' },
      ],
    },
    {
      id:'ISS-006',
      title:'Reg E provisional-credit SLA breach in Q1',
      description:'CTRL-008 provisional-credit SLA at 96.4% for Q1 vs 99% target. Two cases breached statutory 10-day window.',
      severity:'High', type:'Finding', source:'Self-identified', status:'In Progress',
      owner:'Consumer Compliance Lead', team:'Compliance',
      identifiedDate:'2026-04-08', dueDate:'2026-05-20',
      linkedRiskUnits:['RU-019'], linkedControls:['CTRL-008'],
      notes:'Root cause: claim-volume spike post-tax-season + analyst capacity.', updates:[
        { id:'upd-1', author:'Consumer Compliance Lead', text:'Two new analysts join 5/19; backlog burn-down model in ACT-006.', date:'2026-05-03T10:45:00' },
      ],
    },
    {
      id:'ISS-007',
      title:'Step-up auth coverage gap on legacy iOS versions',
      description:'CTRL-005 step-up flows fail silently on iOS <16.x; affected fleet ~3.2% of MAU. ATO risk inflated for that cohort.',
      severity:'Medium', type:'Finding', source:'Self-identified', status:'Open',
      owner:'CISO', team:'Engineering',
      identifiedDate:'2026-04-25', dueDate:'2026-06-10',
      linkedRiskUnits:['RU-008','RU-018','RU-020'], linkedControls:['CTRL-005'],
      notes:'iOS legacy deprecation timeline being accelerated.', updates:[],
    },
    {
      id:'ISS-008',
      title:'Sponsor-bank Q1 finding: EDD case backlog',
      description:'Sponsor bank Q1 joint review flagged 9 EDD cases open >60 days vs 0-tolerance target. CTRL-006 design effective but volume outpacing capacity.',
      severity:'High', type:'Finding', source:'Sponsor Bank', status:'In Progress',
      owner:'BSA Officer', team:'BSA/AML',
      identifiedDate:'2026-04-02', dueDate:'2026-04-30',
      linkedRiskUnits:['RU-009'], linkedControls:['CTRL-006','CTRL-017'],
      notes:'Sponsor bank Risk Committee tracking weekly.', updates:[
        { id:'upd-1', author:'BSA Officer', text:'Burndown plan ACT-008 approved; backlog 9 → 4 as of 4/29.', date:'2026-04-29T15:00:00' },
        { id:'upd-2', author:'CCO', text:'Sponsor bank acknowledged trajectory; next checkpoint 5/13.', date:'2026-05-06T09:00:00' },
      ],
    },
    {
      id:'ISS-009',
      title:'Card BIN-attack spike — mid-March',
      description:'Mid-March observed 4.2× baseline CNP fraud-attempt volume against the BIN. CTRL-003 caught >98% but tail caused $42k loss.',
      severity:'Medium', type:'Incident', source:'Self-identified', status:'In Progress',
      owner:'Fraud Operations Manager', team:'Fraud Ops',
      identifiedDate:'2026-03-19', dueDate:'2026-05-15',
      linkedRiskUnits:['RU-012'], linkedControls:['CTRL-003'],
      notes:'Postmortem complete; tabletop scheduled 5/15.', updates:[
        { id:'upd-1', author:'Fraud Operations Manager', text:'Card-network BIN-attack rules tuned; tabletop runbook drafted (ACT-009).', date:'2026-04-08T13:30:00' },
      ],
    },
    {
      id:'ISS-010',
      title:'Annual independent BSA/AML audit deferred Q3 → Q4',
      description:'Independent audit firm engagement deferred from Q3 to Q4 due to scope expansion. Formal communication to sponsor bank required.',
      severity:'Low', type:'Observation', source:'Self-identified', status:'Open',
      owner:'CCO', team:'Compliance',
      identifiedDate:'2026-05-01', dueDate:'2026-09-30',
      linkedRiskUnits:['RU-009'], linkedControls:['CTRL-016'],
      notes:'Risk Committee informed at April meeting.', updates:[],
    },
    {
      id:'ISS-011',
      title:'Behavioral-biometrics model drift on new device fleet',
      description:'CTRL-005 model accuracy dropped 3.4 pts after Apr OS release; false-step-up rate rose accordingly.',
      severity:'Medium', type:'Observation', source:'Self-identified', status:'Open',
      owner:'CISO', team:'Engineering',
      identifiedDate:'2026-05-02', dueDate:'2026-06-05',
      linkedRiskUnits:['RU-008'], linkedControls:['CTRL-005'],
      notes:'', updates:[],
    },
    {
      id:'ISS-012',
      title:'Elder typology rule hit-rate above tolerance',
      description:'CTRL-013 elder-indicator alerts up 60% in April; high noise rate suggests threshold needs review.',
      severity:'Low', type:'Observation', source:'Self-identified', status:'Open',
      owner:'Fraud Lead', team:'Fraud Ops',
      identifiedDate:'2026-05-04', dueDate:'2026-05-22',
      linkedRiskUnits:['RU-005'], linkedControls:['CTRL-013'],
      notes:'', updates:[],
    },
  ];
}
function SEED_ACTIONS() {
  return [
    {
      id:'ACT-001',
      title:'Retune mule-typology detector thresholds',
      description:'Adjust velocity and graph-similarity thresholds to bring FPR back under 25%. Re-test on prior 30 days.',
      status:'In Progress - Execution',
      owner:'Fraud Engineering Manager', team:'Engineering',
      dueDate:'2026-05-20', linkedIssueId:'ISS-001',
      linkedRiskUnitIds:['RU-001','RU-004'],
      notes:'', updates:[
        { id:'upd-1', author:'Fraud Lead', text:'Test set assembled; tuning underway.', date:'2026-05-02T11:30:00' },
        { id:'upd-2', author:'Fraud Engineering Manager', text:'v2 model FPR down to 21% on holdout; QA next.', date:'2026-05-08T16:00:00' },
      ],
      createdDate:'2026-04-23',
    },
    {
      id:'ACT-002',
      title:'Resubmit APY marketing copy through CTRL-009 gate',
      description:'Rewrite to remove implied FDIC-direct language; route through sponsor bank legal review.',
      status:'In Progress - Planning',
      owner:'Marketing Lead', team:'Marketing',
      dueDate:'2026-05-08', linkedIssueId:'ISS-002',
      linkedRiskUnitIds:['RU-022'], notes:'', updates:[],
      createdDate:'2026-04-19',
    },
    {
      id:'ACT-003',
      title:'Telemetry retry + DLQ for parent integrity feed',
      description:'Add retry logic + dead-letter queue for the integrity ingestion pipeline; alert on backlog > 5 min.',
      status:'Not Started',
      owner:'Platform Engineering Lead', team:'Engineering',
      dueDate:'2026-06-12', linkedIssueId:'ISS-003',
      linkedRiskUnitIds:['RU-001','RU-006'], notes:'', updates:[],
      createdDate:'2026-05-01',
    },
    {
      id:'ACT-004',
      title:'Migrate OFAC list refresh to hourly cron + parallel source',
      description:'Reduce refresh window from 6h to ≤1h; stand up alternate list-source ingestion for redundancy.',
      status:'In Progress - Execution',
      owner:'OFAC Officer', team:'BSA/AML',
      dueDate:'2026-05-15', linkedIssueId:'ISS-004',
      linkedRiskUnitIds:['RU-003','RU-011','RU-017'],
      notes:'', updates:[
        { id:'upd-1', author:'OFAC Officer', text:'Hourly cron live in staging; production cutover 5/12.', date:'2026-05-04T09:30:00' },
        { id:'upd-2', author:'Engineering Lead', text:'Alternate source contract signed; data feed in QA.', date:'2026-05-09T14:15:00' },
      ],
      createdDate:'2026-04-21',
    },
    {
      id:'ACT-005',
      title:'Integrate two new synthetic-ID vendor signals into CIP non-doc verification',
      description:'PoC + production integration for two device-graph signals to close synthetic-ID gap.',
      status:'In Progress - Planning',
      owner:'Onboarding Risk Lead', team:'1LoD',
      dueDate:'2026-06-20', linkedIssueId:'ISS-005',
      linkedRiskUnitIds:['RU-001','RU-004','RU-018'],
      notes:'Vendor PoC scoping in progress.', updates:[
        { id:'upd-1', author:'Onboarding Risk Lead', text:'PoC SOW finalized; data exchange next week.', date:'2026-05-07T11:00:00' },
      ],
      createdDate:'2026-05-02',
    },
    {
      id:'ACT-006',
      title:'Reg E claims-queue capacity expansion + workflow tuning',
      description:'Hire 2 analysts, redirect 1 lead from disputes; tune CTRL-008 timer thresholds.',
      status:'In Progress - Planning',
      owner:'Consumer Compliance Lead', team:'Compliance',
      dueDate:'2026-05-30', linkedIssueId:'ISS-006',
      linkedRiskUnitIds:['RU-019'],
      notes:'', updates:[
        { id:'upd-1', author:'Consumer Compliance Lead', text:'Offers extended to both candidates; start date 5/19.', date:'2026-05-05T12:00:00' },
      ],
      createdDate:'2026-04-10',
    },
    {
      id:'ACT-007',
      title:'Roll out step-up auth to legacy iOS via fallback web flow',
      description:'Provide web-based step-up for iOS <16 fleet until app deprecation is enforced.',
      status:'In Progress - Execution',
      owner:'Mobile Engineering Lead', team:'Engineering',
      dueDate:'2026-06-01', linkedIssueId:'ISS-007',
      linkedRiskUnitIds:['RU-008','RU-018','RU-020'],
      notes:'', updates:[],
      createdDate:'2026-04-26',
    },
    {
      id:'ACT-008',
      title:'EDD case-backlog burndown plan',
      description:'Burn EDD backlog from 9 → 0 by 5/25; daily standup with sponsor bank counterpart.',
      status:'In Progress - Planning',
      owner:'BSA Analyst Lead', team:'BSA/AML',
      dueDate:'2026-05-25', linkedIssueId:'ISS-008',
      linkedRiskUnitIds:['RU-009'],
      notes:'', updates:[
        { id:'upd-1', author:'BSA Analyst Lead', text:'Backlog at 4 cases as of 5/05; on track for 5/25 zero.', date:'2026-05-06T10:30:00' },
      ],
      createdDate:'2026-04-04',
    },
    {
      id:'ACT-009',
      title:'BIN-attack containment runbook + tabletop',
      description:'Document detect → throttle → block flow for BIN attacks; run cross-team tabletop.',
      status:'In Progress - Execution',
      owner:'Fraud Operations Manager', team:'Fraud Ops',
      dueDate:'2026-05-15', linkedIssueId:'ISS-009',
      linkedRiskUnitIds:['RU-012'],
      notes:'Tabletop scheduled 5/15 with card-network + sponsor bank Ops.', updates:[
        { id:'upd-1', author:'Fraud Operations Manager', text:'Runbook v1 distributed; tabletop scenarios approved.', date:'2026-05-08T15:30:00' },
      ],
      createdDate:'2026-04-09',
    },
    {
      id:'ACT-010',
      title:'Q4 independent BSA/AML audit RFP',
      description:'Issue RFP to three qualified firms; selection by end of Q3 for Q4 fieldwork.',
      status:'Not Started',
      owner:'CCO', team:'Compliance',
      dueDate:'2026-08-01', linkedIssueId:'ISS-010',
      linkedRiskUnitIds:['RU-009'],
      notes:'', updates:[],
      createdDate:'2026-05-04',
    },
    {
      id:'ACT-011',
      title:'Retrain behavioral-biometrics model on Mar-Apr 2026 data',
      description:'Pull recent device-population sample; retrain + canary deploy.',
      status:'Not Started',
      owner:'CISO', team:'Engineering',
      dueDate:'2026-06-15', linkedIssueId:'ISS-011',
      linkedRiskUnitIds:['RU-008'],
      notes:'', updates:[],
      createdDate:'2026-05-03',
    },
    {
      id:'ACT-012',
      title:'Elder typology threshold review and tuning',
      description:'Recalibrate CTRL-013 alert thresholds against Q1 case data; reduce noise.',
      status:'In Progress - Planning',
      owner:'Fraud Lead', team:'Fraud Ops',
      dueDate:'2026-06-20', linkedIssueId:'ISS-012',
      linkedRiskUnitIds:['RU-005'],
      notes:'', updates:[],
      createdDate:'2026-05-05',
    },
  ];
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
          type="range" min="1" max="5" step="0.5"
          value={score}
          onChange={(e) => onScore(parseFloat(e.target.value))}
          list={`factor-ticks-${keyName}`}
        />
        <datalist id={`factor-ticks-${keyName}`}>
          {[1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].map(v => <option key={v} value={v} />)}
        </datalist>
        <div className="factor-score">{Number(score).toFixed(1)}</div>
      </div>
      <div className="factor-ticks">
        {[1, 2, 3, 4, 5].map(v => <span key={v}>{v}</span>)}
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
  const [tab, setTab] = useState('dashboard');
  const [selectedUnitId, setSelectedUnitId] = useState(null);
  const [selectedIssueId, setSelectedIssueId] = useState(null);
  const [selectedActionId, setSelectedActionId] = useState(null);
  const [selectedControlId, setSelectedControlId] = useState(null);
  const [filters, setFilters] = useState({ category:'', product:'', rrBand:'', search:'', status:'', unassessed:false });
  const [sort, setSort] = useState({ key:'rr', dir:'desc' });
  const [newUnitOpen, setNewUnitOpen] = useState(false);
  const [newIssueOpen, setNewIssueOpen] = useState(false);
  const [newActionOpen, setNewActionOpen] = useState(false);
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
        weighted: agg.perControl,
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
      if (filters.status && u.status !== filters.status) return false;
      if (filters.unassessed && !(u.status === 'Draft' && u.linkedControls.length === 0)) return false;
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

  const overdueIssues  = useMemo(() => state.issues.filter(i => i.status !== 'Closed' && isOverdue(i.dueDate)).length, [state.issues]);
  const overdueActions = useMemo(() => state.actions.filter(a => a.status !== 'Completed' && a.status !== 'Cancelled' && isOverdue(a.dueDate)).length, [state.actions]);

  const goRegister = (patch = {}) => { setFilters(f => ({ category:'', product:'', rrBand:'', search:'', status:'', unassessed:false, ...patch })); setTab('register'); setSelectedUnitId(null); setSelectedIssueId(null); setSelectedActionId(null); setSelectedControlId(null); };
  const goTab = (key) => { setTab(key); setSelectedUnitId(null); setSelectedIssueId(null); setSelectedActionId(null); setSelectedControlId(null); };
  const openUnit    = (id) => { setSelectedUnitId(id); setSelectedIssueId(null); setSelectedActionId(null); setSelectedControlId(null); };
  const openIssue   = (id) => { setSelectedIssueId(id); setSelectedUnitId(null); setSelectedActionId(null); setSelectedControlId(null); setTab('issues'); };
  const openAction  = (id) => { setSelectedActionId(id); setSelectedUnitId(null); setSelectedIssueId(null); setSelectedControlId(null); setTab('actions'); };
  const openControl = (id) => { setSelectedControlId(id); setSelectedUnitId(null); setSelectedIssueId(null); setSelectedActionId(null); setTab('controls'); };

  let activeView = tab;
  if (selectedUnitId)    activeView = 'detail';
  if (selectedIssueId)   activeView = 'issueDetail';
  if (selectedActionId)  activeView = 'actionDetail';
  if (selectedControlId) activeView = 'controlDetail';

  const navTabs = [
    { key:'dashboard', label:'Dashboard' },
    { key:'register',  label:'Register' },
    { key:'controls',  label:'Controls' },
    { key:'issues',    label:'Issues',   badge: overdueIssues  || null },
    { key:'actions',   label:'Actions',  badge: overdueActions || null },
    { key:'reports',   label:'Reports' },
    { key:'settings',  label:'Settings' },
  ];

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
        <nav className="tabs tabs-compact" aria-label="Primary">
          {navTabs.map(t => {
            const isActive = (t.key === 'register' && (activeView === 'register' || activeView === 'detail'))
              || (t.key === 'issues' && (activeView === 'issues' || activeView === 'issueDetail'))
              || (t.key === 'actions' && (activeView === 'actions' || activeView === 'actionDetail'))
              || (t.key === 'controls' && (activeView === 'controls' || activeView === 'controlDetail'))
              || activeView === t.key;
            return (
              <button
                key={t.key}
                className={`tab ${isActive ? 'active' : ''}`}
                onClick={() => goTab(t.key)}
              >
                {t.label}
                {t.badge ? <span className="tab-badge">{t.badge}</span> : null}
              </button>
            );
          })}
        </nav>
        <div className="topbar-right">
          <span className="chip tag" title="Control credit cap (α)"><span>α</span><span className="num">{state.settings.alpha.toFixed(2)}</span></span>
        </div>
      </header>

      <main>
        {activeView === 'dashboard' && (
          <DashboardView
            state={state}
            units={computedUnits}
            goRegister={goRegister}
            goTab={goTab}
            openUnit={openUnit}
            openIssue={openIssue}
            openAction={openAction}
            openControl={openControl}
          />
        )}
        {activeView === 'register' && (
          <RegisterView
            state={state} units={filtered} sort={sort} onSort={onSort}
            filters={filters} setFilters={setFilters}
            onSelect={openUnit}
            onNew={() => setNewUnitOpen(true)}
          />
        )}
        {activeView === 'controls' && (
          <ControlsView
            state={state} update={update} toast={toast}
            units={computedUnits}
            onOpen={openControl}
          />
        )}
        {activeView === 'controlDetail' && (
          <ControlDetailView
            state={state} update={update}
            controlId={selectedControlId}
            units={computedUnits}
            onBack={() => setSelectedControlId(null)}
            openUnit={openUnit}
            openIssue={openIssue}
            toast={toast}
          />
        )}
        {activeView === 'issues' && (
          <IssuesView
            state={state}
            onOpen={openIssue}
            onNew={() => setNewIssueOpen(true)}
          />
        )}
        {activeView === 'issueDetail' && (
          <IssueDetailView
            state={state} update={update}
            issueId={selectedIssueId}
            onBack={() => setSelectedIssueId(null)}
            openUnit={openUnit}
            openControl={openControl}
            openAction={openAction}
            onNewAction={() => setNewActionOpen(true)}
            toast={toast}
          />
        )}
        {activeView === 'actions' && (
          <ActionsView
            state={state}
            onOpen={openAction}
            onNew={() => setNewActionOpen(true)}
          />
        )}
        {activeView === 'actionDetail' && (
          <ActionDetailView
            state={state} update={update}
            actionId={selectedActionId}
            onBack={() => setSelectedActionId(null)}
            openIssue={openIssue}
            openUnit={openUnit}
            toast={toast}
          />
        )}
        {activeView === 'reports' && (
          <ReportsView
            state={state}
            units={computedUnits}
            openUnit={openUnit}
            openIssue={openIssue}
            openAction={openAction}
            openControl={openControl}
            onExport={exportJSON}
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
            openControl={openControl}
            openIssue={openIssue}
            openAction={openAction}
            onNewIssue={() => setNewIssueOpen(true)}
            onNewAction={() => setNewActionOpen(true)}
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
            const id = nextId('RU', state.riskUnits);
            update(s => {
              s.riskUnits.push({
                id, riskCategoryId: rcId, productId: pid,
                owner: owner || '', status: 'Draft', notes: '',
                lastUpdated: todayISO(),
                factorScores: { P:3, C:3, G:2, Ch:3 },
                factorNarratives: { P:'', C:'', G:'', Ch:'' },
                linkedControls: [], updates: [],
              });
            });
            setNewUnitOpen(false);
            openUnit(id);
            toast('Risk unit created');
          }}
        />
      )}

      {newIssueOpen && (
        <NewIssueModal
          state={state}
          defaultRiskUnitId={selectedUnitId || ''}
          onClose={() => setNewIssueOpen(false)}
          onCreate={(payload) => {
            const id = nextId('ISS', state.issues);
            update(s => { s.issues.push({ id, ...payload, identifiedDate: todayISO(), updates: [] }); });
            setNewIssueOpen(false);
            openIssue(id);
            toast('Issue created');
          }}
        />
      )}

      {newActionOpen && (
        <NewActionModal
          state={state}
          defaultIssueId={selectedIssueId || ''}
          defaultRiskUnitId={selectedUnitId || ''}
          onClose={() => setNewActionOpen(false)}
          onCreate={(payload) => {
            const id = nextId('ACT', state.actions);
            update(s => { s.actions.push({ id, ...payload, createdDate: todayISO(), updates: [] }); });
            setNewActionOpen(false);
            openAction(id);
            toast('Action created');
          }}
        />
      )}

      {toastNode}
    </>
  );
}

function DetailView({ state, update, unit, onBack, onAlpha, openControl, openIssue, openAction, onNewIssue, onNewAction, toast }) {
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
    s.riskUnits[idx].linkedControls.push({ controlId: next?.id || s.controls[0]?.id || '', tier: 'supporting', DE: 3, OE: 3 });
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

  const weightedLinked = computeControlWeights(raw.linkedControls);

  const linkedIssues  = state.issues.filter(i => (i.linkedRiskUnits || []).includes(unit.id));
  const linkedActions = state.actions.filter(a => (a.linkedRiskUnitIds || []).includes(unit.id));

  return (
    <>
      <Breadcrumb items={[
        { label:'Dashboard' },
        { label:'Register', onClick: onBack },
        { label: ruRefCode(unit) },
        { label: prod?.name },
        { label: unit.id },
      ]} />

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
            <span>{ruRefCode(unit)}</span>
            <span className="sep">/</span>
            <span>{prod?.name}</span>
          </div>
          <div className="title">
            <span className="code">{ruRefCode(unit)}</span>
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
              <th className="col-tier">Tier</th>
              <th className="col-w">Weight</th>
              <th className="col-de">Design Effectiveness</th>
              <th className="col-oe">Operating Effectiveness</th>
              <th className="col-ce">CE</th>
              <th className="col-x"></th>
            </tr>
          </thead>
          <tbody>
            {raw.linkedControls.length === 0 && (
              <tr><td colSpan={7} className="empty" style={{ padding: 24 }}>No controls linked yet — click "Add control" to start.</td></tr>
            )}
            {weightedLinked.map((lc, i) => {
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
                    <select
                      className="select"
                      value={lc.tier || 'supporting'}
                      onChange={(e) => updateLC(i, { tier: e.target.value })}
                      title="Key controls receive twice the weight of supporting controls"
                    >
                      <option value="key">Key</option>
                      <option value="supporting">Supporting</option>
                    </select>
                  </td>
                  <td className="num" style={{ fontSize: 13 }}>{round3(lc.weight).toFixed(3)}</td>
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
          <span className="weight-status muted" style={{ fontSize: 11.5 }}>
            {weightedLinked.filter(l => l.tier === 'key').length} key · {weightedLinked.filter(l => l.tier !== 'key').length} supporting · Σ = <span className="num">{(unit.ceWeightSum || 0).toFixed(2)}</span>
          </span>
        </div>
      </div>

      {unit.ce !== null && (
        <div className="card">
          <div className="card-title"><span className="accent-dot" /> 3 · Aggregate control effectiveness</div>
          <div className="calc">
            <span>CE</span><span className="eq">=</span>
            {weightedLinked.map((lc, i) => (
              <span key={i}><b>{round3(lc.weight).toFixed(3)}·{getCEFromMatrix(lc.DE, lc.OE).toFixed(1)}</b>{i < weightedLinked.length - 1 ? <span className="eq"> + </span> : null}</span>
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

      <div className="dash-grid">
        <div className="card">
          <div className="card-title" style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <span><span className="accent-dot" /> Linked issues</span>
            <button className="btn btn-sm" onClick={onNewIssue}>+ Issue</button>
          </div>
          {linkedIssues.length === 0
            ? <div className="empty" style={{ padding: 20 }}>No issues raised against this risk unit.</div>
            : (
              <table className="lc-table">
                <thead><tr><th>Ref</th><th>Title</th><th>Severity</th><th>Due</th><th>Status</th></tr></thead>
                <tbody>
                  {linkedIssues.map(i => (
                    <tr key={i.id} className="click" onClick={() => openIssue(i.id)}>
                      <td className="num" style={{ color:'var(--accent)' }}>{i.id}</td>
                      <td>{i.title}</td>
                      <td><SeverityChip severity={i.severity} /></td>
                      <td className="num">{formatDate(i.dueDate)} <OverduePill date={i.status === 'Closed' ? null : i.dueDate} /></td>
                      <td><WorkStatusChip status={i.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
        </div>
        <div className="card">
          <div className="card-title" style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <span><span className="accent-dot" /> Linked actions</span>
            <button className="btn btn-sm" onClick={onNewAction}>+ Action</button>
          </div>
          {linkedActions.length === 0
            ? <div className="empty" style={{ padding: 20 }}>No remediation actions assigned.</div>
            : (
              <table className="lc-table">
                <thead><tr><th>Ref</th><th>Title</th><th>Owner</th><th>Due</th><th>Status</th></tr></thead>
                <tbody>
                  {linkedActions.map(a => (
                    <tr key={a.id} className="click" onClick={() => openAction(a.id)}>
                      <td className="num" style={{ color:'var(--accent)' }}>{a.id}</td>
                      <td>{a.title}</td>
                      <td className="muted">{a.owner || '—'}</td>
                      <td className="num">{formatDate(a.dueDate)} <OverduePill date={['Completed','Cancelled'].includes(a.status) ? null : a.dueDate} /></td>
                      <td><WorkStatusChip status={a.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
        </div>
      </div>

      <div className="card">
        <div className="card-title"><span className="accent-dot" /> Notes</div>
        <textarea
          className="textarea" placeholder="Assessor rationale, examiner feedback, anything that doesn't fit a factor narrative…"
          value={raw.notes || ''} onChange={(e) => setMeta('notes', e.target.value)}
          style={{ minHeight: 80 }}
        />
      </div>

      <UpdatesPanel
        updates={raw.updates}
        defaultAuthor={raw.owner || 'admin'}
        onPost={(u) => update(s => { s.riskUnits[idx].updates = [...(s.riskUnits[idx].updates || []), u]; })}
        onDelete={(uid) => update(s => { s.riskUnits[idx].updates = (s.riskUnits[idx].updates || []).filter(x => x.id !== uid); })}
      />
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
  const overdueByUnit = useMemo(() => {
    const m = {};
    for (const i of state.issues) {
      if (i.status === 'Closed' || !isOverdue(i.dueDate)) continue;
      for (const rid of (i.linkedRiskUnits || [])) m[rid] = (m[rid] || 0) + 1;
    }
    for (const a of state.actions) {
      if (['Completed','Cancelled'].includes(a.status) || !isOverdue(a.dueDate)) continue;
      for (const rid of (a.linkedRiskUnitIds || [])) m[rid] = (m[rid] || 0) + 1;
    }
    return m;
  }, [state.issues, state.actions]);
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
                      <span className="bot">{ruRefCode(u)}</span>
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
                      {overdueByUnit[u.id] && <span className="dot-pill" title={`${overdueByUnit[u.id]} overdue item${overdueByUnit[u.id]>1?'s':''}`}>▲ overdue</span>}
                      {u.status === 'Draft' && u.linkedControls.length === 0 && <span className="dot-pill tag" title="No assessment yet">unassessed</span>}
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

function ControlsView({ state, update, toast, units = [], onOpen }) {
  const inUse = useMemo(() => {
    const m = {};
    state.riskUnits.forEach(u => u.linkedControls.forEach(lc => {
      m[lc.controlId] = (m[lc.controlId] || 0) + 1;
    }));
    return m;
  }, [state.riskUnits]);

  const avgCE = useMemo(() => {
    const m = {};
    for (const u of units) {
      for (const lc of (u.linkedControls || [])) {
        const v = getCEFromMatrix(lc.DE, lc.OE);
        if (!Number.isFinite(v)) continue;
        if (!m[lc.controlId]) m[lc.controlId] = { sum: 0, n: 0 };
        m[lc.controlId].sum += v; m[lc.controlId].n += 1;
      }
    }
    const out = {};
    for (const k in m) out[k] = m[k].n ? Math.round((m[k].sum / m[k].n) * 100) / 100 : null;
    return out;
  }, [units]);

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
              <th style={{ width: 110 }}>Avg CE</th>
              <th style={{ width: 140 }}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={10} className="empty">No controls match your search.</td></tr>
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
                    {avgCE[c.id] != null
                      ? <Chip kind="ce" band={getCEBand(avgCE[c.id])} value={avgCE[c.id]} />
                      : <span className="muted">—</span>}
                  </td>
                  <td>
                    <div className="row gap-sm">
                      <button className="btn btn-sm" onClick={() => onOpen?.(c.id)}>Open</button>
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

function Breadcrumb({ items }) {
  return (
    <div className="bc">
      {items.map((it, i) => (
        <span key={i} className="bc-seg">
          {it.onClick ? <button className="bc-link" onClick={it.onClick}>{it.label}</button> : <span>{it.label}</span>}
          {i < items.length - 1 && <span className="bc-sep">/</span>}
        </span>
      ))}
    </div>
  );
}

function SeverityChip({ severity }) {
  if (!severity) return null;
  const cls = SEV_CLASS[severity] || 'tag';
  return <span className={`chip ${cls}`}>{severity}</span>;
}

function WorkStatusChip({ status }) {
  if (!status) return null;
  const cls = STATUS_CLASS[status] || 'tag';
  return <span className={`chip ${cls}`}>{status}</span>;
}

function OverduePill({ date, kind = 'date' }) {
  if (!date || !isOverdue(date)) return null;
  return <span className="overdue-pill" title="Past due">▲ OVERDUE</span>;
}

function UpdatesPanel({ updates, defaultAuthor = 'admin', onPost, onDelete }) {
  const [text, setText] = useState('');
  const [author, setAuthor] = useState(defaultAuthor || 'admin');
  const sorted = [...(updates || [])].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const post = () => {
    const t = text.trim(); if (!t) return;
    onPost({ id: `upd-${Date.now()}`, author: author || defaultAuthor || 'admin', text: t, date: nowISO() });
    setText('');
  };
  return (
    <div className="card">
      <div className="card-title"><span className="accent-dot" /> Updates</div>
      <div className="update-input">
        <input
          className="input" style={{ width: 160 }}
          placeholder="Author" value={author} onChange={(e) => setAuthor(e.target.value)}
        />
        <textarea
          className="textarea" placeholder="Post an update…" value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') post(); }}
          style={{ flex: 1, minHeight: 48 }}
        />
        <button className="btn btn-primary" onClick={post} disabled={!text.trim()}>Post</button>
      </div>
      {sorted.length === 0 ? (
        <div className="empty" style={{ padding: 20 }}>No updates yet.</div>
      ) : (
        <div className="update-list">
          {sorted.map(u => (
            <div className="update-item" key={u.id}>
              <div className="update-head">
                <span className="update-author">{u.author || 'admin'}</span>
                <span className="update-date num">{(u.date || '').replace('T', ' ').slice(0,16)}</span>
                {onDelete && <button className="btn btn-sm btn-ghost" onClick={() => onDelete(u.id)} title="Delete">×</button>}
              </div>
              <div className="update-text">{u.text}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function KpiCard({ label, value, sub, tone = 'accent', onClick }) {
  return (
    <button className={`kpi kpi-${tone}`} onClick={onClick} disabled={!onClick}>
      <div className="kpi-value num">{value}</div>
      <div className="kpi-label">{label}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
    </button>
  );
}

function MiniHeat({ title, units, axisLabel, getBand, products: productList = [] }) {
  const irBands = ['Severe','High','Moderate','Low-Moderate','Low'];
  const productIds = productList.length
    ? productList.map(p => p.id).filter(pid => units.some(u => u.productId === pid))
    : [...new Set(units.map(u => u.productId))];
  const productName = (pid) => {
    const p = productList.find(p => p.id === pid);
    return p?.short || p?.name || pid;
  };
  const grid = {};
  irBands.forEach(b => { grid[b] = {}; productIds.forEach(pid => { grid[b][pid] = 0; }); });
  for (const u of units) {
    const b = getBand(u);
    if (!b || !grid[b]) continue;
    if (grid[b][u.productId] == null) grid[b][u.productId] = 0;
    grid[b][u.productId]++;
  }
  return (
    <div className="card">
      <div className="card-title"><span className="accent-dot" />{title}</div>
      <div className="mini-heat-wrap">
        <table className="mini-heat">
          <thead>
            <tr>
              <th className="corner">{axisLabel}</th>
              {productIds.map(pid => <th key={pid} className="axis-x">{productName(pid)}</th>)}
            </tr>
          </thead>
          <tbody>
            {irBands.map(b => (
              <tr key={b}>
                <th className="axis-y"><Chip band={b} /></th>
                {productIds.map(pid => {
                  const n = grid[b][pid] || 0;
                  const cls = `lvl-${RR_BAND_CLASS[b]?.replace('r-', '') || ''}`;
                  return (
                    <td key={pid} className={`mini-cell ${n ? cls : 'mini-empty'}`}>
                      <span className="num">{n || ''}</span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DashboardView({ state, units, goRegister, goTab, openUnit, openIssue, openAction, openControl }) {
  const total = units.length;
  const assessed = units.filter(u => u.status === 'Assessed').length;
  const draft = units.filter(u => u.status === 'Draft').length;
  const highSev = units.filter(u => u.rrMatrixBand === 'High' || u.rrMatrixBand === 'Severe');
  const highCount = highSev.filter(u => u.rrMatrixBand === 'High').length;
  const sevCount  = highSev.filter(u => u.rrMatrixBand === 'Severe').length;

  const weakControlsCount = useMemo(() => {
    let cnt = 0, ruIds = new Set();
    for (const u of units) {
      for (const lc of (u.linkedControls || [])) {
        const ceVal = getCEFromMatrix(lc.DE, lc.OE);
        const b = getCEBand(ceVal);
        if (b === 'Weak' || b === 'Needs Improvement') { cnt++; ruIds.add(u.id); }
      }
    }
    return { cnt, ruIds: ruIds.size };
  }, [units]);

  const unassessed = units.filter(u => u.status === 'Draft' && (u.linkedControls || []).length === 0).length;

  const ceBuckets = { 'Strong':0, 'Satisfactory':0, 'Needs Improvement':0, 'Weak':0, 'Unassessed':0 };
  for (const u of units) {
    if (!u.ceBand) ceBuckets['Unassessed']++;
    else ceBuckets[u.ceBand]++;
  }
  const ceTotal = total || 1;

  const attention = useMemo(() => {
    const out = [];
    for (const u of units) {
      if (u.disagree) out.push({ kind:'unit', id:u.id, label:`${u.id} · matrix/formula disagree by >1 band`, tone:'r-mod', click: () => openUnit(u.id) });
    }
    for (const u of units) {
      if (u.status === 'Draft' && (u.linkedControls || []).length === 0)
        out.push({ kind:'unit', id:u.id, label:`${u.id} · draft with no linked controls`, tone:'tag', click: () => openUnit(u.id) });
    }
    const usedControls = new Set(units.flatMap(u => u.linkedControls.map(l => l.controlId)));
    for (const c of state.controls) {
      if (!usedControls.has(c.id))
        out.push({ kind:'control', id:c.id, label:`${c.id} · orphan control (not linked to any risk unit)`, tone:'tag', click: () => openControl(c.id) });
    }
    for (const u of units) {
      for (const lc of u.linkedControls) {
        if (lc.DE === 1 || lc.OE === 1) {
          out.push({ kind:'unit', id:u.id, label:`${u.id} · ${lc.controlId} rated ${lc.DE === 1 ? 'DE=1' : ''}${lc.DE === 1 && lc.OE === 1 ? ' / ' : ''}${lc.OE === 1 ? 'OE=1' : ''} (ineffective)`, tone:'r-sev', click: () => openUnit(u.id) });
          break;
        }
      }
    }
    return out.slice(0, 12);
  }, [units, state.controls]);

  const recentActivity = useMemo(() => {
    const items = [];
    for (const i of state.issues) for (const u of (i.updates || [])) items.push({ ...u, parent:`ISS · ${i.id}`, parentLabel: i.title, click: () => openIssue(i.id) });
    for (const a of state.actions) for (const u of (a.updates || [])) items.push({ ...u, parent:`ACT · ${a.id}`, parentLabel: a.title, click: () => openAction(a.id) });
    for (const u of state.riskUnits) for (const up of (u.updates || [])) items.push({ ...up, parent:`RU · ${u.id}`, parentLabel: `${ruRefCode(u)} · ${state.products.find(p => p.id === u.productId)?.name || u.productId}`, click: () => openUnit(u.id) });
    items.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    return items.slice(0, 8);
  }, [state.issues, state.actions, state.riskUnits, state.products]);

  return (
    <>
      <div className="view-head">
        <div>
          <div className="view-title">Dashboard</div>
          <div className="view-sub">{total} risk units · {assessed} assessed · {state.issues.length} issues · {state.actions.length} actions</div>
        </div>
      </div>

      <div className="kpi-row">
        <KpiCard label="Total risk units"      value={total}        sub={`${assessed} assessed · ${draft} draft`}              tone="accent" onClick={() => goRegister()} />
        <KpiCard label="High / Severe residual"value={highSev.length} sub={`${highCount} high · ${sevCount} severe`}            tone="sev"    onClick={() => goRegister({ rrBand:'High' })} />
        <KpiCard label="Weak / Needs improv."  value={weakControlsCount.cnt} sub={`across ${weakControlsCount.ruIds} risk units`}      tone="high"   onClick={() => goTab('controls')} />
        <KpiCard label="Unassessed units"      value={unassessed}   sub="draft, no controls linked"                                 tone="tag"    onClick={() => goRegister({ unassessed: true })} />
      </div>

      <div className="dash-grid">
        <MiniHeat title="Inherent Risk by Product"  units={units} products={state.products} axisLabel="IR / Product" getBand={(u) => u.irBand} />
        <MiniHeat title="Residual Risk by Product"  units={units} products={state.products} axisLabel="RR / Product" getBand={(u) => u.rrMatrixBand} />
      </div>

      <div className="card">
        <div className="card-title"><span className="accent-dot" /> Control Effectiveness distribution</div>
        <div className="stack-bar">
          {['Strong','Satisfactory','Needs Improvement','Weak','Unassessed'].map(b => {
            const n = ceBuckets[b];
            if (!n) return null;
            const pct = Math.round((n / ceTotal) * 100);
            const cls = b === 'Unassessed' ? 'tag' : (CE_BAND_CLASS[b] || 'tag');
            return (
              <button key={b} className={`stack-seg seg-${cls}`} style={{ width: `${pct}%` }} title={`${b}: ${n} (${pct}%)`} onClick={() => goRegister({ rrBand:'' })}>
                <span className="seg-label">{b}</span>
                <span className="seg-count num">{n}</span>
              </button>
            );
          })}
        </div>
        <div className="stack-legend">
          {Object.entries(ceBuckets).map(([b, n]) => (
            <span key={b} className="legend-item">
              <span className={`legend-dot dot-${b === 'Unassessed' ? 'tag' : (CE_BAND_CLASS[b] || 'tag')}`} />
              {b} <span className="num">{n}</span>
            </span>
          ))}
        </div>
      </div>

      <div className="dash-grid">
        <div className="card">
          <div className="card-title"><span className="accent-dot" /> Attention items</div>
          {attention.length === 0
            ? <div className="empty" style={{ padding: 20 }}>Nothing needs attention right now. Nice.</div>
            : (
              <div className="attn-list">
                {attention.map((a, i) => (
                  <button key={i} className={`attn-item attn-${a.tone}`} onClick={a.click}>
                    <span className="attn-dot" />
                    <span className="attn-label">{a.label}</span>
                  </button>
                ))}
              </div>
            )}
        </div>
        <div className="card">
          <div className="card-title"><span className="accent-dot" /> Recent activity</div>
          {recentActivity.length === 0
            ? <div className="empty" style={{ padding: 20 }}>No updates posted yet.</div>
            : (
              <div className="activity-list">
                {recentActivity.map((it, i) => (
                  <button key={i} className="activity-item" onClick={it.click}>
                    <div className="activity-meta">
                      <span className="activity-author">{it.author || 'admin'}</span>
                      <span className="activity-parent">{it.parent}</span>
                      <span className="activity-date num">{(it.date || '').replace('T',' ').slice(0,16)}</span>
                    </div>
                    <div className="activity-text">{it.text}</div>
                  </button>
                ))}
              </div>
            )}
        </div>
      </div>

      <div className="card">
        <div className="card-title"><span className="accent-dot" /> Risk Category × Product coverage</div>
        <div className="coverage-wrap">
          <table className="coverage">
            <thead>
              <tr>
                <th></th>
                {state.products.map(p => <th key={p.id}>{p.name}</th>)}
              </tr>
            </thead>
            <tbody>
              {state.riskCategories.map(rc => (
                <tr key={rc.id}>
                  <th className="rc-cell"><span className="num" style={{ color:'var(--accent)' }}>{rc.id}</span> <span className="muted">{rc.name}</span></th>
                  {state.products.map(p => {
                    const u = units.find(x => x.riskCategoryId === rc.id && x.productId === p.id);
                    if (!u) return <td key={p.id} className="cov-empty">·</td>;
                    let dot = 'dot-tag', title = `${u.id} · ${u.status}`;
                    if (u.status === 'Draft') dot = 'dot-tag';
                    else if (u.rrMatrixBand === 'Severe') dot = 'dot-r-sev';
                    else if (u.rrMatrixBand === 'High') dot = 'dot-r-mod';
                    else if (u.rrMatrixBand) dot = 'dot-r-low';
                    title += u.rrMatrixBand ? ` · RR ${u.rrMatrixBand}` : '';
                    return (
                      <td key={p.id}>
                        <button className={`cov-dot ${dot}`} title={title} onClick={() => openUnit(u.id)} />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function IssuesView({ state, onOpen, onNew }) {
  const [search, setSearch] = useState('');
  const [sev, setSev] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('Active');
  const [sort, setSort] = useState({ key:'due', dir:'asc' });

  const rows = useMemo(() => {
    let r = state.issues.filter(i => {
      if (sev && i.severity !== sev) return false;
      if (type && i.type !== type) return false;
      if (status === 'Active' && i.status === 'Closed') return false;
      else if (status && status !== 'Active' && i.status !== status) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        if (!`${i.id} ${i.title} ${i.owner} ${i.team} ${i.description}`.toLowerCase().includes(q)) return false;
      }
      return true;
    });
    const d = sort.dir === 'asc' ? 1 : -1;
    const sevOrder = { Critical:4, High:3, Medium:2, Low:1 };
    r.sort((a, b) => {
      switch (sort.key) {
        case 'id':    return d * a.id.localeCompare(b.id);
        case 'title': return d * a.title.localeCompare(b.title);
        case 'sev':   return d * ((sevOrder[a.severity] || 0) - (sevOrder[b.severity] || 0));
        case 'due':   return d * (a.dueDate || '').localeCompare(b.dueDate || '');
        case 'owner': return d * (a.owner || '').localeCompare(b.owner || '');
        case 'status':return d * a.status.localeCompare(b.status);
        default:      return 0;
      }
    });
    return r;
  }, [state.issues, search, sev, type, status, sort]);

  const onSort = (k) => setSort(s => s.key === k ? { key:k, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key:k, dir:'asc' });

  return (
    <>
      <div className="view-head">
        <div>
          <div className="view-title">Issues</div>
          <div className="view-sub">{rows.length} of {state.issues.length} · findings, observations, and incidents</div>
        </div>
        <button className="btn btn-primary" onClick={onNew}>+ New issue</button>
      </div>

      <div className="filterbar">
        <span className="label">Filter</span>
        <input className="input" placeholder="Search id, title, owner…" value={search} onChange={e => setSearch(e.target.value)} />
        <select className="select" value={sev} onChange={e => setSev(e.target.value)}>
          <option value="">All severities</option>
          {ISSUE_SEVERITIES.map(s => <option key={s}>{s}</option>)}
        </select>
        <select className="select" value={type} onChange={e => setType(e.target.value)}>
          <option value="">All types</option>
          {ISSUE_TYPES.map(s => <option key={s}>{s}</option>)}
        </select>
        <select className="select" value={status} onChange={e => setStatus(e.target.value)}>
          <option value="Active">Active (Open + In Progress)</option>
          <option value="">All</option>
          {ISSUE_STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <SortHeader label="Ref"      k="id"     sort={sort} onSort={onSort} />
              <SortHeader label="Title"    k="title"  sort={sort} onSort={onSort} />
              <SortHeader label="Severity" k="sev"    sort={sort} onSort={onSort} />
              <th>Type</th>
              <SortHeader label="Owner"    k="owner"  sort={sort} onSort={onSort} />
              <th>Team</th>
              <SortHeader label="Due"      k="due"    sort={sort} onSort={onSort} />
              <SortHeader label="Status"   k="status" sort={sort} onSort={onSort} />
              <th>Source</th>
              <th>Links</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={10} className="empty">No issues match your filters. <button className="btn btn-sm btn-primary" style={{ marginLeft: 8 }} onClick={onNew}>+ Create your first issue</button></td></tr>
            ) : rows.map(i => (
              <tr key={i.id} className="click" onClick={() => onOpen(i.id)}>
                <td className="num" style={{ color:'var(--accent)', fontWeight:600 }}>{i.id}</td>
                <td>
                  <div className="two-line">
                    <span className="top">{i.title}</span>
                    <span className="bot" style={{ color:'var(--muted)', fontFamily:'var(--sans)', fontSize:12 }}>{i.description?.slice(0,80)}{i.description?.length > 80 ? '…' : ''}</span>
                  </div>
                </td>
                <td><SeverityChip severity={i.severity} /></td>
                <td className="muted">{i.type}</td>
                <td>{i.owner || <span className="muted">—</span>}</td>
                <td className="muted">{i.team || '—'}</td>
                <td className="num">{formatDate(i.dueDate)} <OverduePill date={i.status === 'Closed' ? null : i.dueDate} /></td>
                <td><WorkStatusChip status={i.status} /></td>
                <td className="muted">{i.source}</td>
                <td className="muted num">
                  {(i.linkedRiskUnits?.length || 0)}R · {(i.linkedControls?.length || 0)}C
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function LinkPicker({ value, onChange, options, placeholder, onClick }) {
  const remaining = options.filter(o => !value.includes(o.id));
  return (
    <>
      <div className="mit-list">
        {value.length === 0 && <span className="muted" style={{ fontSize: 12.5 }}>None linked yet.</span>}
        {value.map(id => (
          <span key={id} className="chip tag removable">
            <button className="link-text" onClick={(e) => { e.stopPropagation(); onClick?.(id); }}>{id}</button>
            <span className="x" onClick={() => onChange(value.filter(v => v !== id))}>×</span>
          </span>
        ))}
      </div>
      {remaining.length > 0 && (
        <select
          className="select" value="" style={{ marginTop: 8, maxWidth: 360 }}
          onChange={(e) => { if (e.target.value) onChange([...value, e.target.value]); }}
        >
          <option value="">+ {placeholder}</option>
          {remaining.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
        </select>
      )}
    </>
  );
}

function IssueDetailView({ state, update, issueId, onBack, openUnit, openControl, openAction, onNewAction, toast }) {
  const idx = state.issues.findIndex(i => i.id === issueId);
  const issue = state.issues[idx];
  if (!issue) return <div className="empty">Issue not found. <button className="btn btn-sm" onClick={onBack}>Back</button></div>;

  const set = (patch) => update(s => { Object.assign(s.issues[idx], patch); });
  const linkedActions = state.actions.filter(a => a.linkedIssueId === issue.id);

  const del = () => {
    if (!confirm(`Delete ${issue.id}? This cannot be undone.`)) return;
    update(s => {
      s.issues = s.issues.filter(i => i.id !== issue.id);
      for (const a of s.actions) if (a.linkedIssueId === issue.id) a.linkedIssueId = '';
    });
    toast('Issue deleted');
    onBack();
  };

  return (
    <>
      <Breadcrumb items={[
        { label: 'Dashboard' },
        { label: 'Issues', onClick: onBack },
        { label: issue.id },
      ]} />

      <div className="row gap-sm" style={{ marginBottom: 10 }}>
        <button className="btn btn-sm btn-ghost" onClick={onBack}>← Back</button>
        <span className="spacer" />
        <button className="btn btn-sm btn-danger" onClick={del}>Delete</button>
      </div>

      <div className="detail-head">
        <div className="left">
          <div className="breadcrumb"><span>{issue.id}</span></div>
          <div className="title"><span>{issue.title}</span></div>
          <div className="meta">
            <span>Source <b>{issue.source}</b></span>
            <span>Identified <b className="num">{formatDate(issue.identifiedDate)}</b></span>
            <span>Due <b className="num">{formatDate(issue.dueDate)}</b> <OverduePill date={issue.status === 'Closed' ? null : issue.dueDate} /></span>
          </div>
        </div>
        <div className="right">
          <SeverityChip severity={issue.severity} />
          <WorkStatusChip status={issue.status} />
        </div>
      </div>

      <div className="card">
        <div className="card-title"><span className="accent-dot" /> Details</div>
        <div className="form-grid">
          <div className="field span-2">
            <span className="field-label">Title</span>
            <input className="input" value={issue.title} onChange={e => set({ title: e.target.value })} />
          </div>
          <div className="field">
            <span className="field-label">Severity</span>
            <select className="select" value={issue.severity} onChange={e => set({ severity: e.target.value })}>
              {ISSUE_SEVERITIES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="field">
            <span className="field-label">Type</span>
            <select className="select" value={issue.type} onChange={e => set({ type: e.target.value })}>
              {ISSUE_TYPES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="field">
            <span className="field-label">Source</span>
            <select className="select" value={issue.source} onChange={e => set({ source: e.target.value })}>
              {ISSUE_SOURCES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="field">
            <span className="field-label">Status</span>
            <select className="select" value={issue.status} onChange={e => set({ status: e.target.value })}>
              {ISSUE_STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="field">
            <span className="field-label">Owner</span>
            <input className="input" value={issue.owner} onChange={e => set({ owner: e.target.value })} placeholder="Unassigned" />
          </div>
          <div className="field">
            <span className="field-label">Team</span>
            <input className="input" value={issue.team} onChange={e => set({ team: e.target.value })} placeholder="e.g. BSA/AML" />
          </div>
          <div className="field">
            <span className="field-label">Due date</span>
            <input className="input" type="date" value={issue.dueDate || ''} onChange={e => set({ dueDate: e.target.value })} />
          </div>
          <div className="field span-2">
            <span className="field-label">Description</span>
            <textarea className="textarea" value={issue.description} onChange={e => set({ description: e.target.value })} />
          </div>
        </div>
      </div>

      <div className="dash-grid">
        <div className="card">
          <div className="card-title"><span className="accent-dot" /> Linked risk units</div>
          <LinkPicker
            value={issue.linkedRiskUnits || []}
            onChange={(v) => set({ linkedRiskUnits: v })}
            options={state.riskUnits.map(u => ({ id: u.id, label: `${u.id} · ${ruRefCode(u)} · ${state.products.find(p => p.id === u.productId)?.name}` }))}
            placeholder="Add risk unit"
            onClick={openUnit}
          />
        </div>
        <div className="card">
          <div className="card-title"><span className="accent-dot" /> Linked controls</div>
          <LinkPicker
            value={issue.linkedControls || []}
            onChange={(v) => set({ linkedControls: v })}
            options={state.controls.map(c => ({ id: c.id, label: `${c.id} · ${c.name}` }))}
            placeholder="Add control"
            onClick={openControl}
          />
        </div>
      </div>

      <div className="card">
        <div className="card-title" style={{ alignItems:'center', justifyContent:'space-between', display:'flex' }}>
          <span><span className="accent-dot" /> Remediation actions</span>
          <button className="btn btn-sm btn-primary" onClick={onNewAction}>+ Add action</button>
        </div>
        {linkedActions.length === 0
          ? <div className="empty" style={{ padding: 20 }}>No actions linked to this issue yet.</div>
          : (
            <table className="lc-table">
              <thead>
                <tr><th>Ref</th><th>Title</th><th>Owner</th><th>Due</th><th>Status</th></tr>
              </thead>
              <tbody>
                {linkedActions.map(a => (
                  <tr key={a.id} className="click" onClick={() => openAction(a.id)}>
                    <td className="num" style={{ color:'var(--accent)' }}>{a.id}</td>
                    <td>{a.title}</td>
                    <td className="muted">{a.owner || '—'}</td>
                    <td className="num">{formatDate(a.dueDate)} <OverduePill date={['Completed','Cancelled'].includes(a.status) ? null : a.dueDate} /></td>
                    <td><WorkStatusChip status={a.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </div>

      <UpdatesPanel
        updates={issue.updates}
        defaultAuthor={issue.owner || 'admin'}
        onPost={(u) => update(s => { s.issues[idx].updates = [...(s.issues[idx].updates || []), u]; })}
        onDelete={(uid) => update(s => { s.issues[idx].updates = (s.issues[idx].updates || []).filter(x => x.id !== uid); })}
      />
    </>
  );
}

function NewIssueModal({ state, defaultRiskUnitId, onClose, onCreate }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('Medium');
  const [type, setType] = useState('Finding');
  const [source, setSource] = useState('Self-identified');
  const [owner, setOwner] = useState('');
  const [team, setTeam] = useState('');
  const [dueDate, setDueDate] = useState('');
  const linkedRiskUnits = defaultRiskUnitId ? [defaultRiskUnitId] : [];
  return (
    <Modal
      title="New issue"
      onClose={onClose}
      actions={[
        <button key="c" className="btn" onClick={onClose}>Cancel</button>,
        <button key="ok" className="btn btn-primary" disabled={!title.trim()} onClick={() => onCreate({
          title, description, severity, type, source, status: 'Open',
          owner, team, dueDate, linkedRiskUnits, linkedControls: [], notes: '',
        })}>Create</button>,
      ]}
    >
      <div className="form-grid">
        <div className="field span-2">
          <span className="field-label">Title</span>
          <input className="input" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Mule false-positive rate above tolerance" />
        </div>
        <div className="field">
          <span className="field-label">Severity</span>
          <select className="select" value={severity} onChange={e => setSeverity(e.target.value)}>{ISSUE_SEVERITIES.map(s => <option key={s}>{s}</option>)}</select>
        </div>
        <div className="field">
          <span className="field-label">Type</span>
          <select className="select" value={type} onChange={e => setType(e.target.value)}>{ISSUE_TYPES.map(s => <option key={s}>{s}</option>)}</select>
        </div>
        <div className="field">
          <span className="field-label">Source</span>
          <select className="select" value={source} onChange={e => setSource(e.target.value)}>{ISSUE_SOURCES.map(s => <option key={s}>{s}</option>)}</select>
        </div>
        <div className="field">
          <span className="field-label">Due date</span>
          <input className="input" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
        </div>
        <div className="field">
          <span className="field-label">Owner</span>
          <input className="input" value={owner} onChange={e => setOwner(e.target.value)} />
        </div>
        <div className="field">
          <span className="field-label">Team</span>
          <input className="input" value={team} onChange={e => setTeam(e.target.value)} />
        </div>
        <div className="field span-2">
          <span className="field-label">Description</span>
          <textarea className="textarea" value={description} onChange={e => setDescription(e.target.value)} />
        </div>
      </div>
    </Modal>
  );
}

function ActionsView({ state, onOpen, onNew }) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('Active');
  const [team, setTeam] = useState('');
  const [sort, setSort] = useState({ key:'due', dir:'asc' });
  const teams = useMemo(() => [...new Set(state.actions.map(a => a.team).filter(Boolean))], [state.actions]);

  const rows = useMemo(() => {
    let r = state.actions.filter(a => {
      if (status === 'Active' && (a.status === 'Completed' || a.status === 'Cancelled')) return false;
      else if (status && status !== 'Active' && a.status !== status) return false;
      if (team && a.team !== team) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        if (!`${a.id} ${a.title} ${a.owner} ${a.team} ${a.description}`.toLowerCase().includes(q)) return false;
      }
      return true;
    });
    const d = sort.dir === 'asc' ? 1 : -1;
    r.sort((a, b) => {
      switch (sort.key) {
        case 'id':    return d * a.id.localeCompare(b.id);
        case 'title': return d * a.title.localeCompare(b.title);
        case 'due':   return d * (a.dueDate || '').localeCompare(b.dueDate || '');
        case 'status':return d * a.status.localeCompare(b.status);
        case 'owner': return d * (a.owner || '').localeCompare(b.owner || '');
        default:      return 0;
      }
    });
    return r;
  }, [state.actions, search, status, team, sort]);

  const onSort = (k) => setSort(s => s.key === k ? { key:k, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key:k, dir:'asc' });

  return (
    <>
      <div className="view-head">
        <div>
          <div className="view-title">Actions</div>
          <div className="view-sub">{rows.length} of {state.actions.length} · remediation workstreams</div>
        </div>
        <button className="btn btn-primary" onClick={onNew}>+ New action</button>
      </div>

      <div className="filterbar">
        <span className="label">Filter</span>
        <input className="input" placeholder="Search id, title, owner…" value={search} onChange={e => setSearch(e.target.value)} />
        <select className="select" value={status} onChange={e => setStatus(e.target.value)}>
          <option value="Active">Active (not Completed / Cancelled)</option>
          <option value="">All</option>
          {ACTION_STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
        <select className="select" value={team} onChange={e => setTeam(e.target.value)}>
          <option value="">All teams</option>
          {teams.map(t => <option key={t}>{t}</option>)}
        </select>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <SortHeader label="Ref"    k="id"     sort={sort} onSort={onSort} />
              <SortHeader label="Title"  k="title"  sort={sort} onSort={onSort} />
              <SortHeader label="Owner"  k="owner"  sort={sort} onSort={onSort} />
              <th>Team</th>
              <SortHeader label="Status" k="status" sort={sort} onSort={onSort} />
              <SortHeader label="Due"    k="due"    sort={sort} onSort={onSort} />
              <th>Issue</th>
              <th>Risk</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={8} className="empty">No actions match your filters. <button className="btn btn-sm btn-primary" style={{ marginLeft: 8 }} onClick={onNew}>+ Create your first action</button></td></tr>
            ) : rows.map(a => (
              <tr key={a.id} className="click" onClick={() => onOpen(a.id)}>
                <td className="num" style={{ color:'var(--accent)', fontWeight:600 }}>{a.id}</td>
                <td>
                  <div className="two-line">
                    <span className="top">{a.title}</span>
                    <span className="bot" style={{ color:'var(--muted)', fontFamily:'var(--sans)', fontSize:12 }}>{a.description?.slice(0,80)}{a.description?.length > 80 ? '…' : ''}</span>
                  </div>
                </td>
                <td>{a.owner || <span className="muted">—</span>}</td>
                <td className="muted">{a.team || '—'}</td>
                <td><WorkStatusChip status={a.status} /></td>
                <td className="num">{formatDate(a.dueDate)} <OverduePill date={['Completed','Cancelled'].includes(a.status) ? null : a.dueDate} /></td>
                <td className="muted num">{a.linkedIssueId || '—'}</td>
                <td className="muted num">{(a.linkedRiskUnitIds || []).join(', ') || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function ActionDetailView({ state, update, actionId, onBack, openIssue, openUnit, toast }) {
  const idx = state.actions.findIndex(a => a.id === actionId);
  const action = state.actions[idx];
  if (!action) return <div className="empty">Action not found. <button className="btn btn-sm" onClick={onBack}>Back</button></div>;
  const set = (patch) => update(s => { Object.assign(s.actions[idx], patch); });
  const parentIssue = state.issues.find(i => i.id === action.linkedIssueId);
  const del = () => {
    if (!confirm(`Delete ${action.id}? This cannot be undone.`)) return;
    update(s => { s.actions = s.actions.filter(a => a.id !== action.id); });
    toast('Action deleted');
    onBack();
  };
  const overdue = !['Completed','Cancelled'].includes(action.status) && isOverdue(action.dueDate);

  return (
    <>
      <Breadcrumb items={[
        { label:'Dashboard' },
        { label:'Actions', onClick: onBack },
        ...(parentIssue ? [{ label: parentIssue.id, onClick: () => openIssue(parentIssue.id) }] : []),
        { label: action.id },
      ]} />

      <div className="row gap-sm" style={{ marginBottom: 10 }}>
        <button className="btn btn-sm btn-ghost" onClick={onBack}>← Back</button>
        <span className="spacer" />
        <button className="btn btn-sm btn-danger" onClick={del}>Delete</button>
      </div>

      <div className="detail-head">
        <div className="left">
          <div className="breadcrumb"><span>{action.id}</span></div>
          <div className="title"><span>{action.title}</span></div>
          <div className="meta">
            <span>Owner <b>{action.owner || 'Unassigned'}</b></span>
            <span>Team <b>{action.team || '—'}</b></span>
            <span>Due <b className="num">{formatDate(action.dueDate)}</b> {overdue && <OverduePill date={action.dueDate} />}</span>
            <span>Created <b className="num">{formatDate(action.createdDate)}</b></span>
          </div>
        </div>
        <div className="right">
          <WorkStatusChip status={action.status} />
        </div>
      </div>

      <div className="card">
        <div className="card-title"><span className="accent-dot" /> Details</div>
        <div className="form-grid">
          <div className="field span-2">
            <span className="field-label">Title</span>
            <input className="input" value={action.title} onChange={e => set({ title: e.target.value })} />
          </div>
          <div className="field">
            <span className="field-label">Status</span>
            <select className="select" value={action.status} onChange={e => set({ status: e.target.value })}>
              {ACTION_STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="field">
            <span className="field-label">Owner</span>
            <input className="input" value={action.owner} onChange={e => set({ owner: e.target.value })} />
          </div>
          <div className="field">
            <span className="field-label">Team</span>
            <input className="input" value={action.team} onChange={e => set({ team: e.target.value })} />
          </div>
          <div className="field">
            <span className="field-label">Due date</span>
            <input className="input" type="date" value={action.dueDate || ''} onChange={e => set({ dueDate: e.target.value })} />
          </div>
          <div className="field span-2">
            <span className="field-label">Description</span>
            <textarea className="textarea" value={action.description} onChange={e => set({ description: e.target.value })} />
          </div>
        </div>
      </div>

      <div className="dash-grid">
        <div className="card">
          <div className="card-title"><span className="accent-dot" /> Parent issue</div>
          {parentIssue ? (
            <button className="link-text" onClick={() => openIssue(parentIssue.id)} style={{ textAlign:'left' }}>
              <div className="row gap-sm">
                <span className="chip tag">{parentIssue.id}</span>
                <SeverityChip severity={parentIssue.severity} />
              </div>
              <div style={{ marginTop: 6 }}>{parentIssue.title}</div>
            </button>
          ) : (
            <div className="muted" style={{ fontSize: 12.5 }}>No parent issue linked. Pick one:</div>
          )}
          <select
            className="select" value={action.linkedIssueId || ''} style={{ marginTop: 8, maxWidth: 360 }}
            onChange={(e) => set({ linkedIssueId: e.target.value })}
          >
            <option value="">— No issue —</option>
            {state.issues.map(i => <option key={i.id} value={i.id}>{i.id} · {i.title}</option>)}
          </select>
        </div>
        <div className="card">
          <div className="card-title"><span className="accent-dot" /> Linked risk units</div>
          <LinkPicker
            value={action.linkedRiskUnitIds || []}
            onChange={(v) => set({ linkedRiskUnitIds: v })}
            options={state.riskUnits.map(u => ({ id: u.id, label: `${u.id} · ${ruRefCode(u)} · ${state.products.find(p => p.id === u.productId)?.name}` }))}
            placeholder="Add risk unit"
            onClick={openUnit}
          />
        </div>
      </div>

      <div className="card">
        <div className="card-title"><span className="accent-dot" /> Evidence / attachments</div>
        <div className="evidence-empty">
          <span className="muted">No files attached yet.</span>
          <button className="btn btn-sm" disabled title="Coming soon">Upload</button>
        </div>
      </div>

      <UpdatesPanel
        updates={action.updates}
        defaultAuthor={action.owner || 'admin'}
        onPost={(u) => update(s => { s.actions[idx].updates = [...(s.actions[idx].updates || []), u]; })}
        onDelete={(uid) => update(s => { s.actions[idx].updates = (s.actions[idx].updates || []).filter(x => x.id !== uid); })}
      />
    </>
  );
}

function NewActionModal({ state, defaultIssueId, defaultRiskUnitId, onClose, onCreate }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('Not Started');
  const [owner, setOwner] = useState('');
  const [team, setTeam] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [linkedIssueId, setLinkedIssueId] = useState(defaultIssueId || '');
  const linkedRiskUnitIds = defaultRiskUnitId ? [defaultRiskUnitId] : [];
  return (
    <Modal
      title="New action"
      onClose={onClose}
      actions={[
        <button key="c" className="btn" onClick={onClose}>Cancel</button>,
        <button key="ok" className="btn btn-primary" disabled={!title.trim()} onClick={() => onCreate({
          title, description, status, owner, team, dueDate, linkedIssueId, linkedRiskUnitIds, notes: '',
        })}>Create</button>,
      ]}
    >
      <div className="form-grid">
        <div className="field span-2">
          <span className="field-label">Title</span>
          <input className="input" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Retune mule-typology detector thresholds" />
        </div>
        <div className="field">
          <span className="field-label">Status</span>
          <select className="select" value={status} onChange={e => setStatus(e.target.value)}>{ACTION_STATUSES.map(s => <option key={s}>{s}</option>)}</select>
        </div>
        <div className="field">
          <span className="field-label">Due date</span>
          <input className="input" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
        </div>
        <div className="field">
          <span className="field-label">Owner</span>
          <input className="input" value={owner} onChange={e => setOwner(e.target.value)} />
        </div>
        <div className="field">
          <span className="field-label">Team</span>
          <input className="input" value={team} onChange={e => setTeam(e.target.value)} />
        </div>
        <div className="field span-2">
          <span className="field-label">Parent issue</span>
          <select className="select" value={linkedIssueId} onChange={e => setLinkedIssueId(e.target.value)}>
            <option value="">— No issue —</option>
            {state.issues.map(i => <option key={i.id} value={i.id}>{i.id} · {i.title}</option>)}
          </select>
        </div>
        <div className="field span-2">
          <span className="field-label">Description</span>
          <textarea className="textarea" value={description} onChange={e => setDescription(e.target.value)} />
        </div>
      </div>
    </Modal>
  );
}

function ControlDetailView({ state, update, controlId, units, onBack, openUnit, openIssue, toast }) {
  const idx = state.controls.findIndex(c => c.id === controlId);
  const ctrl = state.controls[idx];
  if (!ctrl) return <div className="empty">Control not found. <button className="btn btn-sm" onClick={onBack}>Back</button></div>;
  const set = (patch) => update(s => { Object.assign(s.controls[idx], patch); });

  const usageRows = useMemo(() => {
    const out = [];
    for (const u of units) {
      const weighted = computeControlWeights(u.linkedControls || []);
      const lcw = weighted.find(x => x.controlId === ctrl.id);
      if (!lcw) continue;
      const ceVal = getCEFromMatrix(lcw.DE, lcw.OE);
      out.push({ u, lc: lcw, weight: lcw.weight, ce: ceVal, ceBand: getCEBand(ceVal) });
    }
    return out;
  }, [units, ctrl.id]);

  const issuesAgainst = state.issues.filter(i => (i.linkedControls || []).includes(ctrl.id));

  return (
    <>
      <Breadcrumb items={[
        { label:'Dashboard' },
        { label:'Controls', onClick: onBack },
        { label: ctrl.id },
      ]} />

      <div className="row gap-sm" style={{ marginBottom: 10 }}>
        <button className="btn btn-sm btn-ghost" onClick={onBack}>← Back</button>
      </div>

      <div className="detail-head">
        <div className="left">
          <div className="breadcrumb"><span>{ctrl.id}</span></div>
          <div className="title"><span>{ctrl.name}</span></div>
          <div className="meta">
            <span>Type <b>{ctrl.type}</b></span>
            <span>Nature <b>{ctrl.nature}</b></span>
            <span>Frequency <b>{ctrl.frequency}</b></span>
            <span>Owner <b>{ctrl.owner}</b></span>
          </div>
        </div>
        <div className="right">
          <span className="chip tag">{usageRows.length} risk units</span>
          <span className="chip tag">{issuesAgainst.length} issues</span>
        </div>
      </div>

      <div className="card">
        <div className="card-title"><span className="accent-dot" /> Details</div>
        <div className="form-grid">
          <div className="field span-2">
            <span className="field-label">Name</span>
            <input className="input" value={ctrl.name} onChange={e => set({ name: e.target.value })} />
          </div>
          <div className="field span-2">
            <span className="field-label">Description</span>
            <textarea className="textarea" value={ctrl.desc} onChange={e => set({ desc: e.target.value })} />
          </div>
          <div className="field">
            <span className="field-label">Type</span>
            <select className="select" value={ctrl.type} onChange={e => set({ type: e.target.value })}>{CONTROL_TYPES.map(t => <option key={t}>{t}</option>)}</select>
          </div>
          <div className="field">
            <span className="field-label">Nature</span>
            <select className="select" value={ctrl.nature} onChange={e => set({ nature: e.target.value })}>{CONTROL_NATURES.map(t => <option key={t}>{t}</option>)}</select>
          </div>
          <div className="field">
            <span className="field-label">Frequency</span>
            <select className="select" value={ctrl.frequency} onChange={e => set({ frequency: e.target.value })}>{CONTROL_FREQUENCIES.map(t => <option key={t}>{t}</option>)}</select>
          </div>
          <div className="field">
            <span className="field-label">Owner</span>
            <select className="select" value={ctrl.owner} onChange={e => set({ owner: e.target.value })}>{CONTROL_OWNERS.map(t => <option key={t}>{t}</option>)}</select>
          </div>
          <div className="field span-2">
            <span className="field-label">Mitigates</span>
            <MitigatesEditor value={ctrl.mitigates} onChange={(v) => set({ mitigates: v })} categories={state.riskCategories} />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-title"><span className="accent-dot" /> Risk units using this control</div>
        {usageRows.length === 0
          ? <div className="empty" style={{ padding: 20 }}>This control isn't linked to any risk unit yet.</div>
          : (
            <table className="lc-table">
              <thead>
                <tr><th>Risk unit</th><th>Tier</th><th>Weight</th><th>DE</th><th>OE</th><th>CE</th><th>Unit residual</th></tr>
              </thead>
              <tbody>
                {usageRows.map(r => (
                  <tr key={r.u.id} className="click" onClick={() => openUnit(r.u.id)}>
                    <td>
                      <div className="two-line">
                        <span className="top">{r.u.id}</span>
                        <span className="bot">{ruRefCode(r.u)} · {state.products.find(p => p.id === r.u.productId)?.name}</span>
                      </div>
                    </td>
                    <td className="muted">{r.lc.tier === 'key' ? 'Key' : 'Supporting'}</td>
                    <td className="num">{round3(r.weight).toFixed(3)}</td>
                    <td className="num">{r.lc.DE}</td>
                    <td className="num">{r.lc.OE}</td>
                    <td><Chip kind="ce" band={r.ceBand} value={r.ce} /></td>
                    <td>{r.u.rrMatrixBand ? <Chip band={r.u.rrMatrixBand} /> : <span className="muted">—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </div>

      <div className="card">
        <div className="card-title"><span className="accent-dot" /> Issues against this control</div>
        {issuesAgainst.length === 0
          ? <div className="empty" style={{ padding: 20 }}>No issues reference this control.</div>
          : (
            <table className="lc-table">
              <thead>
                <tr><th>Ref</th><th>Title</th><th>Severity</th><th>Due</th><th>Status</th></tr>
              </thead>
              <tbody>
                {issuesAgainst.map(i => (
                  <tr key={i.id} className="click" onClick={() => openIssue(i.id)}>
                    <td className="num" style={{ color:'var(--accent)' }}>{i.id}</td>
                    <td>{i.title}</td>
                    <td><SeverityChip severity={i.severity} /></td>
                    <td className="num">{formatDate(i.dueDate)} <OverduePill date={i.status === 'Closed' ? null : i.dueDate} /></td>
                    <td><WorkStatusChip status={i.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </div>

      <UpdatesPanel
        updates={ctrl.updates}
        defaultAuthor={ctrl.owner || 'admin'}
        onPost={(u) => update(s => { s.controls[idx].updates = [...(s.controls[idx].updates || []), u]; })}
        onDelete={(uid) => update(s => { s.controls[idx].updates = (s.controls[idx].updates || []).filter(x => x.id !== uid); })}
      />
    </>
  );
}

function ReportsView({ state, units, openUnit, openIssue, openAction, openControl, onExport }) {
  const [view, setView] = useState(null);

  const downloadJSON = (name, data) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `kmoney-${name}-${todayISO()}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  const counts = {
    overdueActions: state.actions.filter(a => !['Completed','Cancelled'].includes(a.status) && isOverdue(a.dueDate)).length,
    soon7Actions:   state.actions.filter(a => !['Completed','Cancelled'].includes(a.status) && dueWithinDays(a.dueDate, 7)).length,
    soon30Actions:  state.actions.filter(a => !['Completed','Cancelled'].includes(a.status) && dueWithinDays(a.dueDate, 30)).length,
    overdueIssues:  state.issues.filter(i => i.status !== 'Closed' && isOverdue(i.dueDate)).length,
    soon7Issues:    state.issues.filter(i => i.status !== 'Closed' && dueWithinDays(i.dueDate, 7)).length,
    highIssues:     state.issues.filter(i => i.status !== 'Closed' && (i.severity === 'High' || i.severity === 'Critical')).length,
  };

  if (view === 'controlEff') {
    const avg = {};
    for (const u of units) for (const lc of (u.linkedControls || [])) {
      const v = getCEFromMatrix(lc.DE, lc.OE);
      if (!Number.isFinite(v)) continue;
      if (!avg[lc.controlId]) avg[lc.controlId] = { sum:0, n:0 };
      avg[lc.controlId].sum += v; avg[lc.controlId].n += 1;
    }
    const rows = state.controls.map(c => {
      const a = avg[c.id]; const ce = a && a.n ? round2(a.sum / a.n) : null;
      return { c, ce, ceBand: ce != null ? getCEBand(ce) : null, n: a?.n || 0 };
    }).sort((x, y) => (x.ce ?? 99) - (y.ce ?? 99));
    return (
      <>
        <ReportHeader title="Control Effectiveness Dashboard" onBack={() => setView(null)} />
        <div className="table-wrap">
          <table>
            <thead><tr><th>Control</th><th>Type</th><th>Owner</th><th>Linked units</th><th>Avg CE</th></tr></thead>
            <tbody>
              {rows.map(({ c, ce, ceBand, n }) => (
                <tr key={c.id} className="click" onClick={() => openControl(c.id)}>
                  <td>
                    <div className="two-line"><span className="top">{c.name}</span><span className="bot">{c.id}</span></div>
                  </td>
                  <td className="muted">{c.type}</td>
                  <td className="muted">{c.owner}</td>
                  <td className="num">{n}</td>
                  <td>{ce != null ? <Chip kind="ce" band={ceBand} value={ce} /> : <span className="muted">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  }

  if (view === 'coverage') {
    const rows = state.riskCategories.map(rc => {
      const us = units.filter(u => u.riskCategoryId === rc.id);
      const assessed = us.filter(u => u.status === 'Assessed').length;
      const irs = us.map(u => u.ir).filter(Number.isFinite);
      const irMin = irs.length ? Math.min(...irs) : null;
      const irMax = irs.length ? Math.max(...irs) : null;
      const rrBands = us.map(u => u.rrMatrixBand).filter(Boolean);
      const ctrls = new Set();
      for (const u of us) for (const lc of u.linkedControls) ctrls.add(lc.controlId);
      const issuesOpen = state.issues.filter(i => i.status !== 'Closed' && i.linkedRiskUnits?.some(rid => us.some(u => u.id === rid))).length;
      return { rc, units: us.length, assessed, irMin, irMax, rrBands, ctrls: ctrls.size, issuesOpen };
    });
    return (
      <>
        <ReportHeader title="Risk Category Coverage Report" onBack={() => setView(null)} />
        <div className="table-wrap">
          <table>
            <thead><tr><th>Category</th><th>Risk units</th><th>Assessed</th><th>IR range</th><th>RR bands</th><th>Controls mapped</th><th>Open issues</th></tr></thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.rc.id}>
                  <td><div className="two-line"><span className="top">{r.rc.name}</span><span className="bot">{r.rc.id}</span></div></td>
                  <td className="num">{r.units}</td>
                  <td className="num">{r.assessed}</td>
                  <td className="num">{r.irMin != null ? `${r.irMin.toFixed(2)}–${r.irMax.toFixed(2)}` : '—'}</td>
                  <td className="row gap-sm" style={{ flexWrap:'wrap' }}>
                    {[...new Set(r.rrBands)].map(b => <Chip key={b} band={b} />)}
                  </td>
                  <td className="num">{r.ctrls}</td>
                  <td className="num">{r.issuesOpen}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  }

  if (view === 'completion') {
    const rows = units.map(u => {
      const narr = ['P','C','G','Ch'].every(k => (u.factorNarratives?.[k] || '').trim().length > 0);
      const links = u.linkedControls.length > 0;
      const wOk = u.linkedControls.length > 0;
      const status = u.status === 'Assessed';
      const score = [narr, links, wOk, status].filter(Boolean).length;
      return { u, narr, links, wOk, status, score };
    }).sort((a, b) => a.score - b.score);
    return (
      <>
        <ReportHeader title="Assessment Completion Tracker" onBack={() => setView(null)} />
        <div className="table-wrap">
          <table>
            <thead><tr><th>Risk unit</th><th>Narratives</th><th>Controls</th><th>Σ = 1.00</th><th>Status</th><th>Score</th></tr></thead>
            <tbody>
              {rows.map(({ u, narr, links, wOk, status, score }) => (
                <tr key={u.id} className="click" onClick={() => openUnit(u.id)}>
                  <td><div className="two-line"><span className="top">{u.id}</span><span className="bot">{ruRefCode(u)} · {state.products.find(p => p.id === u.productId)?.name}</span></div></td>
                  <td>{narr ? <CheckChip on /> : <CheckChip />}</td>
                  <td>{links ? <CheckChip on /> : <CheckChip />}</td>
                  <td>{wOk ? <CheckChip on /> : <CheckChip />}</td>
                  <td>{status ? <CheckChip on /> : <CheckChip />}</td>
                  <td className="num">{score} / 4</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  }

  if (view === 'anomaly') {
    const out = [];
    for (const u of units) {
      if (u.disagree) out.push({ id:u.id, label:`${u.id} · matrix/formula disagree by >1 band`, click:() => openUnit(u.id) });
      if (u.ceCapped) out.push({ id:u.id, label:`${u.id} · weak-critical-control cap applied (raw=${u.ceRaw?.toFixed(2)})`, click:() => openUnit(u.id) });
    }
    return (
      <>
        <ReportHeader title="Disagree / Anomaly Report" onBack={() => setView(null)} />
        {out.length === 0
          ? <div className="empty" style={{ padding: 40 }}>No anomalies detected. The assessment passes integrity checks.</div>
          : <div className="card">
              <div className="attn-list">
                {out.map((x, i) => <button key={i} className="attn-item attn-r-mod" onClick={x.click}><span className="attn-dot" /><span className="attn-label">{x.label}</span></button>)}
              </div>
            </div>}
      </>
    );
  }

  return (
    <>
      <div className="view-head">
        <div>
          <div className="view-title">Reports</div>
          <div className="view-sub">Cross-cutting views and one-click filtered exports</div>
        </div>
      </div>

      <div className="dash-grid">
        <div className="card">
          <div className="card-title"><span className="accent-dot" /> Interactive reports</div>
          <div className="report-list">
            <button className="report-card" onClick={() => setView('controlEff')}>
              <div className="rc-title">Control Effectiveness Dashboard</div>
              <div className="rc-sub">Avg CE per control across every linked risk unit</div>
            </button>
            <button className="report-card" onClick={() => setView('coverage')}>
              <div className="rc-title">Risk Category Coverage Report</div>
              <div className="rc-sub">For each RC: units, assessed, IR range, RR bands, controls, open issues</div>
            </button>
            <button className="report-card" onClick={() => setView('completion')}>
              <div className="rc-title">Assessment Completion Tracker</div>
              <div className="rc-sub">Narratives, controls linked, Σ weights = 1.00, status Assessed</div>
            </button>
            <button className="report-card" onClick={() => setView('anomaly')}>
              <div className="rc-title">Disagree / Anomaly Report</div>
              <div className="rc-sub">Matrix vs formula gaps, capped CE, weight violations</div>
            </button>
          </div>
        </div>

        <div className="card">
          <div className="card-title"><span className="accent-dot" /> Filtered exports</div>
          <div className="export-list">
            <ExportButton label="Overdue actions"             count={counts.overdueActions} onClick={() => downloadJSON('overdue-actions',     state.actions.filter(a => !['Completed','Cancelled'].includes(a.status) && isOverdue(a.dueDate)))} />
            <ExportButton label="Actions due in 7 days"       count={counts.soon7Actions}   onClick={() => downloadJSON('actions-due-7d',      state.actions.filter(a => !['Completed','Cancelled'].includes(a.status) && dueWithinDays(a.dueDate, 7)))} />
            <ExportButton label="Actions due in 30 days"      count={counts.soon30Actions}  onClick={() => downloadJSON('actions-due-30d',     state.actions.filter(a => !['Completed','Cancelled'].includes(a.status) && dueWithinDays(a.dueDate, 30)))} />
            <ExportButton label="Overdue issues"              count={counts.overdueIssues}  onClick={() => downloadJSON('overdue-issues',      state.issues.filter(i => i.status !== 'Closed' && isOverdue(i.dueDate)))} />
            <ExportButton label="Issues due in 7 days"        count={counts.soon7Issues}    onClick={() => downloadJSON('issues-due-7d',       state.issues.filter(i => i.status !== 'Closed' && dueWithinDays(i.dueDate, 7)))} />
            <ExportButton label="Open High/Critical issues"   count={counts.highIssues}     onClick={() => downloadJSON('open-high-critical-issues', state.issues.filter(i => i.status !== 'Closed' && (i.severity === 'High' || i.severity === 'Critical')))} />
            <ExportButton label="Full register (everything)"  count={null}                  onClick={onExport} primary />
          </div>
        </div>
      </div>
    </>
  );
}

function ReportHeader({ title, onBack }) {
  return (
    <>
      <Breadcrumb items={[{ label:'Dashboard' }, { label:'Reports', onClick: onBack }, { label: title }]} />
      <div className="row gap-sm" style={{ marginBottom: 12 }}>
        <button className="btn btn-sm btn-ghost" onClick={onBack}>← All reports</button>
        <span className="spacer" />
        <div className="view-title" style={{ fontSize: 18 }}>{title}</div>
      </div>
    </>
  );
}

function ExportButton({ label, count, onClick, primary }) {
  return (
    <button className={`export-btn ${primary ? 'primary' : ''}`} onClick={onClick}>
      <span>{label}</span>
      {count != null && <span className={`export-count ${count > 0 ? 'on' : 'off'}`}>{count}</span>}
    </button>
  );
}

function CheckChip({ on }) {
  return <span className={`check-chip ${on ? 'on' : ''}`}>{on ? '✓' : '·'}</span>;
}


