import { useState, useRef, useEffect, useCallback } from "react";

// ── Persistent Storage ─────────────────────────────────────────────────────────
const STORAGE_KEY = "apm_exam_crusher_v1";

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    totalXP: 0, gems: 0, streak: 0,
    lastStudiedDate: null,
    completedLessons: {},
    studyDates: [],
  };
}

function saveProgress(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function computeStreak(studyDates) {
  if (!studyDates || studyDates.length === 0) return 0;
  const sorted = [...new Set(studyDates)].sort().reverse();
  const today = todayStr();
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (sorted[0] !== today && sorted[0] !== yesterday) return 0;
  let streak = 1;
  for (let i = 1; i < sorted.length; i++) {
    const diff = (new Date(sorted[i-1]) - new Date(sorted[i])) / 86400000;
    if (diff === 1) streak++;
    else break;
  }
  return streak;
}

// ── Theme ──────────────────────────────────────────────────────────────────────
const C = {
  bg: "#080F0F",
  card: "#0D1F1F",
  border: "#143030",
  accent: "#00E676",
  accentDark: "#00C853",
  accentGlow: "#00E67622",
  accentText: "#00E676",
  green2: "#69F0AE",
  gold: "#FFD600",
  red: "#FF5252",
  blue: "#40C4FF",
  text: "#E0F2F1",
  muted: "#546E7A",
  white: "#FFFFFF",
};

// ── Data ───────────────────────────────────────────────────────────────────────
const TOPICS = [
  { id: "spc", icon: "🎯", color: "#00E676", title: "Strategic Planning & Control",    short: "SPC" },
  { id: "pms", icon: "📊", color: "#69F0AE", title: "Performance Measurement Systems", short: "PMS" },
  { id: "esf", icon: "🌍", color: "#40C4FF", title: "Environmental & Social Factors",  short: "ESF" },
  { id: "qm",  icon: "✅", color: "#B9F6CA", title: "Quality Management",              short: "QM"  },
  { id: "ru",  icon: "⚠️", color: "#FFD600", title: "Risk & Uncertainty",              short: "R&U" },
  { id: "tp",  icon: "🔄", color: "#69F0AE", title: "Transfer Pricing",                short: "TP"  },
  { id: "dp",  icon: "🏢", color: "#40C4FF", title: "Divisional Performance",          short: "DP"  },
];

const LESSONS = {
  spc: [
    { id: 1, title: "Key Definitions", type: "flashcard", xpReward: 30,
      cards: [
        { term: "Critical Success Factors (CSFs)", def: "The limited number of areas in which satisfactory results will ensure successful competitive performance for the individual, department or organisation." },
        { term: "Key Performance Indicators (KPIs)", def: "Quantitative measures used to evaluate the success of an organisation in meeting objectives. They are derived from CSFs." },
        { term: "Mission Statement", def: "A statement of the overriding direction and purpose of the organisation — the reason it exists." },
        { term: "Balanced Scorecard", def: "A strategic management tool by Kaplan & Norton measuring performance across four perspectives: Financial, Customer, Internal Processes, and Learning & Growth." },
        { term: "Strategy Map", def: "A visual representation of the cause-and-effect relationships between strategic objectives across the four Balanced Scorecard perspectives." },
        { term: "Benchmarking", def: "The process of comparing an organisation's performance metrics against industry bests or best practices from other organisations." },
      ]
    },
    { id: 2, title: "Balanced Scorecard Quiz", type: "mcq", xpReward: 60,
      questions: [
        { q: "The Balanced Scorecard was developed by:", options: ["Porter & Mintzberg","Kaplan & Norton","Johnson & Scholes","Drucker & Mayo"], answer: 1, explanation: "Robert Kaplan and David Norton developed the Balanced Scorecard in 1992 as a strategic performance measurement framework." },
        { q: "Which perspective asks 'How do customers see us?'", options: ["Financial","Internal Business Process","Customer","Learning & Growth"], answer: 2, explanation: "The Customer perspective focuses on how customers perceive the organisation — satisfaction, retention, acquisition and market share." },
        { q: "A 'lag indicator' is best described as:", options: ["A forward-looking measure predicting future performance","A measure of outcomes that have already occurred","A measure of employee capability","A financial ratio"], answer: 1, explanation: "Lag indicators measure past performance outcomes (e.g. profit). Lead indicators are predictive and drive future results." },
        { q: "Which is a weakness of the Balanced Scorecard?", options: ["It only focuses on financial measures","Cause-and-effect relationships can be difficult to identify","It ignores customer satisfaction","It cannot be used in non-profit organisations"], answer: 1, explanation: "A key criticism is that assumed cause-and-effect links between perspectives may not hold in practice." },
      ]
    },
    { id: 3, title: "Strategic Formulas", type: "formula", xpReward: 40,
      formulas: [
        { name: "ROCE", formula: "PBIT ÷ Capital Employed × 100", purpose: "Measures how effectively management uses capital to generate profit. A primary financial KPI in most scorecards." },
        { name: "Residual Income (RI)", formula: "Divisional Profit − (Capital Employed × Cost of Capital %)", purpose: "Measures profit after deducting a notional capital charge. Encourages goal congruence better than ROI." },
        { name: "Economic Value Added (EVA)", formula: "NOPAT − (WACC × Capital Invested)", purpose: "Measures value created above the required return of investors. Aligns management decisions with shareholder wealth." },
      ]
    },
    { id: 4, title: "Scenario: Riverside Hotel", type: "scenario", xpReward: 35,
      scenario: {
        context: "Riverside Hotel is a 4-star hotel with declining customer satisfaction despite strong revenue growth. Staff turnover is 35% annually — well above the industry average of 18%. The CEO wants to implement a Balanced Scorecard.",
        question: "Which TWO statements best support placing staff turnover in the Learning & Growth perspective?",
        options: ["High staff turnover directly reduces room revenue in the short term","Staff capability and retention drives service quality, impacting customer satisfaction","Reducing turnover requires investment in training, a Learning & Growth initiative","Staff turnover is a financial metric belonging in the Financial perspective","Customer complaints are caused solely by staff turnover"],
        answers: [1, 2],
        explanation: "The Learning & Growth perspective covers employee skills, retention and knowledge. High turnover reduces service quality (linking to Customer). Investment in training is a classic L&G initiative."
      }
    },
    { id: 5, title: "Examiner Tips", type: "examtips", xpReward: 25,
      tips: [
        { tip: "Always link BSC perspectives", detail: "Explain cause-and-effect links — e.g. 'improving staff training (L&G) improves service quality (Internal Process) leading to higher customer retention (Customer) and ultimately revenue growth (Financial)'." },
        { tip: "CSFs vs KPIs — know the difference", detail: "A CSF is the AREA that matters (e.g. 'customer service quality'). A KPI is the MEASURE of that area (e.g. 'average satisfaction score out of 10'). Mixing these up is a very common exam mistake." },
        { tip: "Always criticise the scorecard", detail: "Show balance — discuss weaknesses: too many measures cause confusion, cause-and-effect links may be assumed not proven, and implementation is time-consuming." },
      ]
    },
  ],
  pms: [
    { id: 1, title: "Key Definitions", type: "flashcard", xpReward: 30,
      cards: [
        { term: "Throughput Accounting", def: "An approach based on the Theory of Constraints. Focuses on maximising throughput (revenue minus direct material costs) while minimising inventory and operating expenses." },
        { term: "Bottleneck Resource", def: "The resource that limits the rate of output of the entire system. All decisions in throughput accounting focus on maximising use of the bottleneck." },
        { term: "Activity-Based Costing (ABC)", def: "A costing method that assigns overhead costs to products based on actual activities that drive costs, rather than simple volume-based allocation." },
        { term: "Cost Driver", def: "Any factor that causes a change in the cost of an activity. In ABC, cost drivers are used to assign activity costs to cost objects." },
        { term: "Value Chain Analysis", def: "Porter's framework identifying primary and support activities and how each contributes to competitive advantage." },
        { term: "Lean Management", def: "A philosophy focused on eliminating the seven wastes (muda): overproduction, waiting, transport, over-processing, inventory, motion, and defects." },
      ]
    },
    { id: 2, title: "Throughput Formulas", type: "formula", xpReward: 40,
      formulas: [
        { name: "Throughput Contribution", formula: "Sales Revenue − Direct Material Cost", purpose: "Only material costs are truly variable; all other costs are fixed in the short run." },
        { name: "Throughput Accounting Ratio (TAR)", formula: "Throughput Contribution per hour ÷ Total Conversion Cost per hour", purpose: "If TAR > 1: product is profitable. Rank products by TAR to prioritise the bottleneck resource." },
        { name: "Return per Factory Hour", formula: "Throughput Contribution ÷ Time on Bottleneck Resource", purpose: "Used to rank products when a bottleneck exists. Higher = higher priority." },
      ]
    },
    { id: 3, title: "Performance Systems Quiz", type: "mcq", xpReward: 60,
      questions: [
        { q: "In Throughput Accounting, 'Throughput Contribution' is:", options: ["Sales Revenue − All Variable Costs","Sales Revenue − Direct Material Costs","Sales Revenue − Labour Costs","Gross Profit − Overhead"], answer: 1, explanation: "Throughput Contribution = Sales Revenue − Direct Material Costs only. Labour is treated as fixed in throughput accounting." },
        { q: "Which is NOT one of Porter's Primary Activities in the Value Chain?", options: ["Inbound Logistics","Human Resource Management","Operations","Marketing & Sales"], answer: 1, explanation: "HRM is a Support Activity. The 5 primary activities are: Inbound Logistics, Operations, Outbound Logistics, Marketing & Sales, and Service." },
        { q: "Activity-Based Management (ABM) differs from ABC in that:", options: ["ABM uses cost pools while ABC does not","ABM uses ABC information to improve decisions and eliminate waste","ABM is only used in manufacturing","ABM ignores overhead costs"], answer: 1, explanation: "ABM uses information generated by ABC to manage activities — reducing or eliminating non-value-added activities." },
      ]
    },
    { id: 4, title: "Examiner Tips", type: "examtips", xpReward: 25,
      tips: [
        { tip: "Throughput vs Marginal Costing", detail: "In marginal costing, labour is variable. In throughput accounting, ONLY materials are variable — labour is fixed. Always state which approach you are using." },
        { tip: "Always identify the bottleneck first", detail: "In any throughput question, your first step must be to identify the bottleneck resource. All rankings flow from this identification." },
        { tip: "When to recommend ABC", detail: "Recommend ABC when: overhead is a high proportion of total cost, products are diverse, traditional costing produces distorted costs. Don't recommend it for simple single-product manufacturers." },
      ]
    },
  ],
  esf: [
    { id: 1, title: "Key Definitions", type: "flashcard", xpReward: 30,
      cards: [
        { term: "Triple Bottom Line (TBL)", def: "A framework measuring organisational performance across: Economic (Profit), Social (People), and Environmental (Planet). Coined by John Elkington." },
        { term: "Corporate Social Responsibility (CSR)", def: "The ongoing commitment by businesses to behave ethically and contribute to economic development while improving quality of life of workforce and society." },
        { term: "Integrated Reporting (<IR>)", def: "A reporting approach showing how an organisation's strategy creates value across six capitals: financial, manufactured, intellectual, human, social, and natural." },
        { term: "Carbon Footprint", def: "The total greenhouse gases emitted directly or indirectly by an organisation's activities, measured in tonnes of CO₂ equivalent." },
        { term: "Life Cycle Assessment (LCA)", def: "Analysis of the environmental impact of a product across its entire life — from raw material extraction through production, use, and disposal." },
      ]
    },
    { id: 2, title: "ESF Quiz", type: "mcq", xpReward: 60,
      questions: [
        { q: "The 'Triple Bottom Line' concept was coined by:", options: ["Milton Friedman","John Elkington","Michael Porter","Robert Kaplan"], answer: 1, explanation: "John Elkington coined the Triple Bottom Line in 1994. It expands performance measurement beyond profit to include People and Planet." },
        { q: "An 'externality' is best described as:", options: ["A cost borne by the organisation itself","A cost or benefit imposed on third parties not involved in the transaction","A government tax on pollution","An internal audit finding"], answer: 1, explanation: "An externality is a cost (negative) or benefit (positive) that falls on external parties — e.g. a factory's pollution affecting local residents." },
        { q: "Integrated Reporting recognises how many types of capital?", options: ["3","4","5","6"], answer: 3, explanation: "The <IR> Framework identifies 6 capitals: Financial, Manufactured, Intellectual, Human, Social & Relationship, and Natural capital." },
      ]
    },
    { id: 3, title: "Examiner Tips", type: "examtips", xpReward: 25,
      tips: [
        { tip: "Link ESF to performance measurement", detail: "ESF questions are almost always linked to the Balanced Scorecard. Show how environmental/social KPIs fit into existing performance systems rather than treating them as separate." },
        { tip: "Know GRI vs <IR>", detail: "GRI focuses on sustainability reporting (impacts on the world). Integrated Reporting focuses on value creation across six capitals. They serve different purposes — don't confuse them." },
        { tip: "Always quantify where possible", detail: "Generic statements like 'reduce emissions' score poorly. Better: 'Implement a carbon KPI targeting 20% reduction in CO₂ per unit produced within 3 years'." },
      ]
    },
  ],
  qm: [
    { id: 1, title: "Key Definitions", type: "flashcard", xpReward: 30,
      cards: [
        { term: "Total Quality Management (TQM)", def: "A management philosophy focused on continuous improvement in all functions of an organisation, with the aim of meeting or exceeding customer expectations every time." },
        { term: "Cost of Quality (CoQ)", def: "The total cost to ensure quality. Divided into: Prevention, Appraisal, Internal failure, and External failure costs (PAIF)." },
        { term: "Prevention Costs", def: "Costs incurred to prevent defects occurring. Examples: staff training, quality planning, supplier evaluation, process improvement." },
        { term: "Appraisal Costs", def: "Costs of checking and inspecting to ensure quality standards are met. Examples: quality inspections, testing, audits." },
        { term: "Internal Failure Costs", def: "Costs arising from defects discovered BEFORE delivery to the customer. Examples: scrap, rework, re-inspection." },
        { term: "External Failure Costs", def: "Costs arising from defects discovered AFTER delivery to the customer. Examples: warranty claims, returns, loss of goodwill, legal claims." },
        { term: "Kaizen", def: "A Japanese philosophy of continuous, incremental improvement involving all employees. Focuses on eliminating waste. Contrasts with large-step innovation." },
      ]
    },
    { id: 2, title: "Quality Management Quiz", type: "mcq", xpReward: 60,
      questions: [
        { q: "A product recall after a defect reaches a customer is an example of:", options: ["Prevention cost","Appraisal cost","Internal failure cost","External failure cost"], answer: 3, explanation: "External failure costs occur after the defective product has reached the customer — recalls, warranty repairs, compensation and reputational damage." },
        { q: "The philosophy that 'getting it right first time' reduces total quality costs is associated with:", options: ["Six Sigma only","Total Quality Management (TQM)","Statistical Process Control","ISO 9001"], answer: 1, explanation: "TQM is built on the belief that investing in prevention reduces total quality costs by eliminating costly failures." },
        { q: "Conformance costs and non-conformance costs are:", options: ["Always equal","Directly proportional","Inversely related","Independent of each other"], answer: 2, explanation: "Spending more on conformance (prevention + appraisal) reduces non-conformance (failure) costs — they move in opposite directions." },
      ]
    },
    { id: 3, title: "Examiner Tips", type: "examtips", xpReward: 25,
      tips: [
        { tip: "PAIF — learn the four categories cold", detail: "Prevention, Appraisal, Internal failure, External failure. Every CoQ exam question requires correct classification. External failure is always most expensive." },
        { tip: "TQM is cultural, not just a system", detail: "Examiners want to see you understand TQM requires cultural change — top management commitment, employee empowerment, and customer focus." },
        { tip: "Kaizen vs Innovation", detail: "Kaizen = small, continuous, incremental improvements by all staff. Innovation = large, occasional, step-change improvements by specialists." },
      ]
    },
  ],
  ru: [
    { id: 1, title: "Key Definitions", type: "flashcard", xpReward: 30,
      cards: [
        { term: "Risk", def: "A situation where outcomes are uncertain but probabilities can be estimated or known. Risk can be quantified." },
        { term: "Uncertainty", def: "A situation where outcomes are unknown AND probabilities cannot be estimated. True uncertainty cannot be quantified." },
        { term: "Expected Value (EV)", def: "A weighted average of all possible outcomes where weights are probabilities. EV = Σ(Probability × Outcome). Best for repeated decisions." },
        { term: "Maximin", def: "A risk-averse strategy selecting the option with the best worst-case outcome. Used by pessimists." },
        { term: "Maximax", def: "A risk-seeking strategy selecting the option with the best best-case outcome. Used by optimists." },
        { term: "Minimax Regret", def: "Selects the option that minimises the maximum regret (opportunity cost) across all possible outcomes." },
        { term: "Sensitivity Analysis", def: "Tests how sensitive a decision is to changes in key variables. Asks 'by how much would X need to change before the decision changes?'" },
      ]
    },
    { id: 2, title: "Risk Formulas", type: "formula", xpReward: 40,
      formulas: [
        { name: "Expected Value (EV)", formula: "Σ (Probability × Outcome)", purpose: "A long-run average outcome. Best used for repeated decisions. Ignores the spread of outcomes (risk)." },
        { name: "Sensitivity Analysis %", formula: "(NPV ÷ PV of Variable) × 100", purpose: "Shows % change needed to make NPV = 0. Lower % = more sensitive = riskier variable." },
        { name: "Standard Deviation", formula: "√ Σ[P × (x − EV)²]", purpose: "Measures the spread/risk of outcomes around the expected value. Higher SD = higher risk." },
      ]
    },
    { id: 3, title: "Risk & Uncertainty Quiz", type: "mcq", xpReward: 60,
      questions: [
        { q: "A risk-averse manager would use which decision criterion?", options: ["Maximax","Minimax Regret","Maximin","Expected Value"], answer: 2, explanation: "Maximin is used by risk-averse (pessimistic) managers — it selects the option with the best worst-case outcome." },
        { q: "Expected Value is MOST appropriate when:", options: ["A one-off high-stakes decision is being made","The decision will be repeated many times","The manager is highly risk averse","Probabilities cannot be estimated"], answer: 1, explanation: "EV is a long-run average. It is most useful for repeated decisions where the average will be realised over time." },
        { q: "A sensitivity of 8% on selling price means:", options: ["The selling price must increase by 8%","The selling price can fall by 8% before NPV becomes zero","8% is the probability of price change","Reject if price changes by more than 8%"], answer: 1, explanation: "Sensitivity % shows how much a variable can change adversely before NPV = 0. Lower % = higher sensitivity = more risk." },
      ]
    },
    { id: 4, title: "Examiner Tips", type: "examtips", xpReward: 25,
      tips: [
        { tip: "Always state which criterion and why", detail: "Never just calculate — always state which decision rule you used AND justify why it's appropriate given the manager's risk attitude in the scenario." },
        { tip: "EV limitation in exam answers", detail: "Always critique EV: it ignores risk, assumes the decision is repeated, and managers may be risk-averse. Always note these limitations." },
        { tip: "Minimax Regret — build the table carefully", detail: "Step 1: Build payoff table. Step 2: Find best outcome per state of nature. Step 3: Subtract each payoff from the best. Step 4: Find max regret per option. Step 5: Choose minimum." },
      ]
    },
  ],
  tp: [
    { id: 1, title: "Key Definitions", type: "flashcard", xpReward: 30,
      cards: [
        { term: "Transfer Price", def: "The price at which goods or services are transferred between divisions of the same organisation. Affects divisional profits but not group profit overall." },
        { term: "Minimum Transfer Price", def: "The lowest price the selling division will accept. Formula: Marginal Cost + Opportunity Cost. Ensures the selling division is no worse off." },
        { term: "Maximum Transfer Price", def: "The highest price the buying division will pay. Should not exceed the external market price (if one exists)." },
        { term: "Goal Congruence", def: "A situation where decisions made by individual managers/divisions are also in the best interests of the organisation as a whole." },
        { term: "Arm's Length Price", def: "A transfer price set as if the two divisions were independent companies trading in an open market. Used for international transfer pricing." },
      ]
    },
    { id: 2, title: "Transfer Pricing Formulas", type: "formula", xpReward: 40,
      formulas: [
        { name: "Min TP (no spare capacity)", formula: "Marginal Cost + Lost Contribution per unit", purpose: "When selling division is at full capacity, it must give up external sales. Lost contribution must be recovered." },
        { name: "Min TP (spare capacity)", formula: "Marginal Cost only", purpose: "When spare capacity exists, there is no opportunity cost — only variable costs need to be covered." },
        { name: "Max Transfer Price", formula: "Lower of: Market Price OR Net Marginal Revenue of buying division", purpose: "The buying division will never pay more than it could source externally." },
      ]
    },
    { id: 3, title: "Examiner Tips", type: "examtips", xpReward: 25,
      tips: [
        { tip: "Always calculate min AND max", detail: "Establish both the minimum (selling division's floor) and maximum (buying division's ceiling). If min > max, no internal transfer is possible." },
        { tip: "Spare capacity changes everything", detail: "Most common exam mistake: forgetting to check spare capacity. With spare capacity: min TP = marginal cost. Without: min TP = marginal cost + opportunity cost." },
        { tip: "International TP — mention tax", detail: "For international transfer pricing, always mention that multinationals may manipulate prices to shift profits to low-tax jurisdictions. Tax authorities require arm's length pricing." },
      ]
    },
  ],
  dp: [
    { id: 1, title: "Key Definitions", type: "flashcard", xpReward: 30,
      cards: [
        { term: "Return on Investment (ROI)", def: "Divisional Profit ÷ Divisional Investment × 100. Widely used but can cause dysfunctional behaviour — managers may reject positive NPV projects that reduce their ROI." },
        { term: "Residual Income (RI)", def: "Divisional Profit − (Capital Employed × Cost of Capital). Promotes goal congruence better than ROI — managers accept any project earning above the cost of capital." },
        { term: "Economic Value Added (EVA®)", def: "NOPAT − (WACC × Capital Invested). A refined version of RI adjusting accounting figures to better reflect economic reality." },
        { term: "Controllable Profit", def: "Divisional revenues minus costs the divisional manager can directly control. Excludes head office recharges. Used to fairly evaluate manager performance." },
        { term: "DuPont Analysis", def: "Decomposes ROI into Net Profit Margin × Asset Turnover. Useful for diagnosing whether declining ROI is due to margin erosion or poor asset utilisation." },
      ]
    },
    { id: 2, title: "Divisional Performance Formulas", type: "formula", xpReward: 40,
      formulas: [
        { name: "Return on Investment (ROI)", formula: "Controllable Profit ÷ Divisional Net Assets × 100", purpose: "Widely used but can cause managers to reject profitable investments that would reduce their division's ROI." },
        { name: "Residual Income (RI)", formula: "Controllable Profit − (Net Assets × Cost of Capital %)", purpose: "Absolute measure. Promotes goal congruence — managers accept all projects earning above the cost of capital." },
        { name: "Economic Value Added (EVA)", formula: "NOPAT − (WACC × Capital Invested)", purpose: "Adjusts for accounting distortions. Closest measure to true economic profit." },
        { name: "DuPont Analysis", formula: "ROI = Net Profit Margin × Asset Turnover", purpose: "Decomposes ROI to diagnose whether issues are from margin or asset efficiency." },
      ]
    },
    { id: 3, title: "Divisional Performance Quiz", type: "mcq", xpReward: 60,
      questions: [
        { q: "A manager using ROI may reject a project with ROI of 18% when the company's cost of capital is 12%. This is because:", options: ["18% is too high a return","The project reduces the division's current ROI of 22%","The project has negative NPV","ROI cannot be used for investment decisions"], answer: 1, explanation: "Classic ROI dysfunctional behaviour. The project is good for the company (18% > 12% WACC) but the manager rejects it because it pulls down their division's 22% ROI." },
        { q: "Which measure is BEST for comparing divisions of different sizes?", options: ["Residual Income","Economic Value Added","Return on Investment","Controllable Profit"], answer: 2, explanation: "ROI is a percentage, making it suitable for comparing divisions of different sizes. RI and EVA are absolute measures." },
        { q: "EVA adjustments are made to better reflect:", options: ["Tax liabilities","Economic reality rather than accounting conventions","Shareholder dividends","Cash flows only"], answer: 1, explanation: "EVA adjusts for accounting distortions (e.g. capitalising R&D, adding back goodwill amortisation) to better reflect true economic profit." },
      ]
    },
    { id: 4, title: "Examiner Tips", type: "examtips", xpReward: 25,
      tips: [
        { tip: "ROI vs RI — when each fails", detail: "ROI fails when a manager rejects a project with ROI above WACC but below current ROI (dysfunctional). RI solves this but fails for comparing different-sized divisions." },
        { tip: "EVA adjustments — know at least 3", detail: "R&D is capitalised not expensed, goodwill amortisation is added back, operating leases are capitalised. Always mention these improve decision-making." },
        { tip: "Controllable vs traceable costs", detail: "Appraise the MANAGER on controllable profit. Appraise the DIVISION's viability on traceable profit. Never mix these up in an exam answer." },
      ]
    },
  ],
};

// ── UI Helpers ─────────────────────────────────────────────────────────────────
function XPBar({ xp, max = 200, color }) {
  const pct = max === 0 ? 0 : Math.min((xp / max) * 100, 100);
  return (
    <div style={{ background: "#0D2020", borderRadius: 99, height: 7, overflow: "hidden", flex: 1 }}>
      <div style={{ width: `${pct}%`, height: "100%", background: color || C.accent, borderRadius: 99, transition: "width .8s cubic-bezier(.4,2,.6,1)", boxShadow: `0 0 8px ${color || C.accent}88` }} />
    </div>
  );
}
function Badge({ label, color }) {
  return <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, padding: "3px 8px", borderRadius: 99, background: color + "22", color, border: `1px solid ${color}44`, textTransform: "uppercase" }}>{label}</span>;
}
function ProgressBar({ current, total, color }) {
  return (
    <div style={{ display: "flex", gap: 5 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{ flex: 1, height: 6, borderRadius: 99, background: i <= current ? color : C.border, transition: "background .3s", boxShadow: i <= current ? `0 0 6px ${color}88` : "none" }} />
      ))}
    </div>
  );
}

// ── Completion ─────────────────────────────────────────────────────────────────
function CompletionScreen({ xp, score, onContinue }) {
  return (
    <div style={{ padding: "60px 24px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", minHeight: "80vh", justifyContent: "center" }}>
      <div style={{ fontSize: 80, marginBottom: 20 }}>💪</div>
      <h2 style={{ color: C.accent, fontSize: 28, fontWeight: 900, marginBottom: 8, fontFamily: "'Playfair Display',serif" }}>Lesson Crushed!</h2>
      {score && <p style={{ color: C.muted, fontSize: 16, marginBottom: 24 }}>Score: {score}</p>}
      <div style={{ background: C.accent + "18", border: `1px solid ${C.accent}44`, borderRadius: 20, padding: "20px 40px", marginBottom: 36, boxShadow: `0 0 32px ${C.accentGlow}` }}>
        <p style={{ color: C.muted, fontSize: 12, margin: "0 0 6px" }}>XP EARNED</p>
        <p style={{ color: C.accent, fontSize: 40, fontWeight: 900, margin: 0 }}>+{xp}</p>
      </div>
      <button onClick={onContinue} style={{ padding: "16px 40px", borderRadius: 99, border: "none", background: `linear-gradient(135deg,${C.accent},${C.accentDark})`, color: "#000", cursor: "pointer", fontWeight: 800, fontSize: 16, boxShadow: `0 8px 32px ${C.accentGlow}` }}>
        Keep Crushing →
      </button>
    </div>
  );
}

// ── Flashcard ──────────────────────────────────────────────────────────────────
function FlashcardLesson({ lesson, topic, onComplete }) {
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(false);
  const cards = lesson.cards;
  const next = () => { setFlipped(false); setTimeout(() => { if (idx + 1 >= cards.length) setDone(true); else setIdx(idx + 1); }, 200); };
  if (done) return <CompletionScreen xp={lesson.xpReward} onContinue={onComplete} />;
  const card = cards[idx];
  return (
    <div style={{ padding: "20px 16px", display: "flex", flexDirection: "column", minHeight: "78vh" }}>
      <ProgressBar current={idx} total={cards.length} color={topic.color} />
      <h3 style={{ color: C.muted, fontSize: 12, letterSpacing: 2, textTransform: "uppercase", margin: "20px 0 24px" }}>{lesson.title}</h3>
      <div onClick={() => setFlipped(!flipped)} style={{ flex: 1, minHeight: 220, background: flipped ? topic.color + "15" : C.card, border: `2px solid ${flipped ? topic.color : C.border}`, borderRadius: 24, padding: 28, cursor: "pointer", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", transition: "all .3s", boxShadow: flipped ? `0 0 24px ${topic.color}33` : "none" }}>
        <div style={{ color: C.muted, fontSize: 11, letterSpacing: 2, marginBottom: 16, textTransform: "uppercase" }}>{flipped ? "DEFINITION" : "TERM — tap to reveal"}</div>
        <div style={{ color: flipped ? C.text : C.accent, fontSize: flipped ? 14 : 20, fontWeight: flipped ? 400 : 800, lineHeight: 1.6, fontFamily: flipped ? "inherit" : "'Playfair Display',serif" }}>{flipped ? card.def : card.term}</div>
        {!flipped && <div style={{ marginTop: 20, fontSize: 28 }}>👆</div>}
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
        {flipped ? <>
          <button onClick={next} style={{ flex: 1, padding: "14px", borderRadius: 14, border: `1px solid ${C.red}44`, background: C.red + "11", color: C.red, cursor: "pointer", fontWeight: 700, fontSize: 14 }}>😅 Again</button>
          <button onClick={next} style={{ flex: 1, padding: "14px", borderRadius: 14, border: `1px solid ${C.accent}44`, background: C.accent + "11", color: C.accent, cursor: "pointer", fontWeight: 700, fontSize: 14 }}>✅ Got it!</button>
        </> : (
          <button onClick={() => setFlipped(true)} style={{ flex: 1, padding: "14px", borderRadius: 14, border: "none", background: `linear-gradient(135deg,${C.accent},${C.accentDark})`, color: "#000", cursor: "pointer", fontWeight: 700, fontSize: 15 }}>Reveal</button>
        )}
      </div>
    </div>
  );
}

// ── MCQ ────────────────────────────────────────────────────────────────────────
function MCQLesson({ lesson, topic, onComplete }) {
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);
  const questions = lesson.questions;
  const q = questions[idx];
  const choose = (i) => { if (selected !== null) return; setSelected(i); if (i === q.answer) setCorrect(c => c + 1); };
  const next = () => { setSelected(null); if (idx + 1 >= questions.length) setDone(true); else setIdx(idx + 1); };
  if (done) return <CompletionScreen xp={Math.round((correct / questions.length) * lesson.xpReward)} score={`${correct}/${questions.length}`} onContinue={onComplete} />;
  return (
    <div style={{ padding: "20px 16px", minHeight: "78vh", display: "flex", flexDirection: "column" }}>
      <ProgressBar current={idx} total={questions.length} color={topic.color} />
      <h3 style={{ color: C.muted, fontSize: 12, letterSpacing: 2, textTransform: "uppercase", margin: "20px 0 20px" }}>Question {idx + 1} of {questions.length}</h3>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: 22, marginBottom: 20 }}>
        <p style={{ color: C.white, fontSize: 15, lineHeight: 1.6, margin: 0, fontWeight: 600 }}>{q.q}</p>
      </div>
      {q.options.map((opt, i) => {
        let bg = C.card, border = C.border, color = C.text;
        if (selected !== null) { if (i === q.answer) { bg = C.accent + "18"; border = C.accent; color = C.accent; } else if (i === selected) { bg = C.red + "18"; border = C.red; color = C.red; } }
        return (
          <button key={i} onClick={() => choose(i)} style={{ width: "100%", background: bg, border: `1.5px solid ${border}`, borderRadius: 14, padding: "14px 16px", cursor: selected ? "default" : "pointer", textAlign: "left", marginBottom: 10, color, fontSize: 14, display: "flex", alignItems: "center", gap: 12, transition: "all .2s" }}>
            <span style={{ width: 28, height: 28, borderRadius: 8, background: border + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, flexShrink: 0, color: border }}>{String.fromCharCode(65 + i)}</span>
            {opt}
          </button>
        );
      })}
      {selected !== null && <>
        <div style={{ background: (selected === q.answer ? C.accent : C.red) + "11", border: `1px solid ${(selected === q.answer ? C.accent : C.red)}33`, borderRadius: 14, padding: 16, marginBottom: 16 }}>
          <p style={{ color: selected === q.answer ? C.accent : C.red, fontWeight: 700, margin: "0 0 6px", fontSize: 14 }}>{selected === q.answer ? "✅ Correct!" : "❌ Incorrect"}</p>
          <p style={{ color: C.muted, fontSize: 13, margin: 0, lineHeight: 1.5 }}>{q.explanation}</p>
        </div>
        <button onClick={next} style={{ width: "100%", padding: "15px", borderRadius: 14, border: "none", background: `linear-gradient(135deg,${C.accent},${C.accentDark})`, color: "#000", cursor: "pointer", fontWeight: 700, fontSize: 15, marginTop: "auto" }}>
          {idx + 1 >= questions.length ? "See Results" : "Next →"}
        </button>
      </>}
    </div>
  );
}

// ── Formula ────────────────────────────────────────────────────────────────────
function FormulaLesson({ lesson, topic, onComplete }) {
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [done, setDone] = useState(false);
  const formulas = lesson.formulas;
  const next = () => { setRevealed(false); setTimeout(() => { if (idx + 1 >= formulas.length) setDone(true); else setIdx(idx + 1); }, 200); };
  if (done) return <CompletionScreen xp={lesson.xpReward} onContinue={onComplete} />;
  const f = formulas[idx];
  return (
    <div style={{ padding: "20px 16px", minHeight: "78vh", display: "flex", flexDirection: "column" }}>
      <ProgressBar current={idx} total={formulas.length} color={topic.color} />
      <h3 style={{ color: C.muted, fontSize: 12, letterSpacing: 2, textTransform: "uppercase", margin: "20px 0 20px" }}>{lesson.title}</h3>
      <div style={{ background: C.card, border: `1px solid ${topic.color}44`, borderRadius: 24, padding: 28, marginBottom: 16, flex: 1, boxShadow: `0 0 24px ${topic.color}11` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <span style={{ fontSize: 28 }}>📐</span>
          <h4 style={{ color: C.white, fontSize: 15, fontWeight: 800, margin: 0 }}>{f.name}</h4>
        </div>
        <div style={{ background: "#040A0A", borderRadius: 16, padding: "20px", marginBottom: 20, border: `1px solid ${C.accent}33`, textAlign: "center", boxShadow: `inset 0 0 20px ${C.accentGlow}` }}>
          <p style={{ color: C.muted, fontSize: 11, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>FORMULA</p>
          <p style={{ color: C.accent, fontSize: 18, fontWeight: 900, margin: 0, fontFamily: "'Courier New',monospace", textShadow: `0 0 12px ${C.accent}88` }}>{f.formula}</p>
        </div>
        {revealed ? (
          <div style={{ background: topic.color + "11", borderRadius: 14, padding: 16, border: `1px solid ${topic.color}33` }}>
            <p style={{ color: C.muted, fontSize: 11, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>PURPOSE & EXAM CONTEXT</p>
            <p style={{ color: C.text, fontSize: 14, margin: 0, lineHeight: 1.6 }}>{f.purpose}</p>
          </div>
        ) : (
          <button onClick={() => setRevealed(true)} style={{ width: "100%", padding: "14px", borderRadius: 14, border: `1px dashed ${C.accent}44`, background: "transparent", color: C.accent, cursor: "pointer", fontSize: 14, fontWeight: 600 }}>
            💡 Show purpose & exam context
          </button>
        )}
      </div>
      {revealed && <button onClick={next} style={{ width: "100%", padding: "15px", borderRadius: 14, border: "none", background: `linear-gradient(135deg,${C.accent},${C.accentDark})`, color: "#000", cursor: "pointer", fontWeight: 700, fontSize: 15 }}>{idx + 1 >= formulas.length ? "Lesson Crushed! 💪" : "Next Formula →"}</button>}
    </div>
  );
}

// ── Scenario ───────────────────────────────────────────────────────────────────
function ScenarioLesson({ lesson, topic, onComplete }) {
  const [selected, setSelected] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const s = lesson.scenario;
  const toggle = (i) => { if (submitted) return; setSelected(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]); };
  const isCorrect = submitted && selected.length === s.answers.length && s.answers.every(a => selected.includes(a));
  return (
    <div style={{ padding: "20px 16px", minHeight: "78vh", display: "flex", flexDirection: "column" }}>
      <div style={{ background: C.accent + "0D", border: `1px solid ${C.accent}22`, borderRadius: 16, padding: 16, marginBottom: 16 }}>
        <p style={{ color: C.accent, fontSize: 11, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>📋 SCENARIO</p>
        <p style={{ color: C.text, fontSize: 13, lineHeight: 1.7, margin: 0 }}>{s.context}</p>
      </div>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 16, marginBottom: 16 }}>
        <p style={{ color: C.white, fontSize: 14, fontWeight: 700, lineHeight: 1.6, margin: 0 }}>{s.question}</p>
      </div>
      {s.options.map((opt, i) => {
        const isSel = selected.includes(i);
        const isAns = s.answers.includes(i);
        let bg = C.card, border = C.border, color = C.text;
        if (submitted) { if (isAns) { bg = C.accent + "18"; border = C.accent; color = C.accent; } else if (isSel) { bg = C.red + "18"; border = C.red; color = C.red; } }
        else if (isSel) { bg = C.accent + "18"; border = C.accent; color = C.accent; }
        return (
          <button key={i} onClick={() => toggle(i)} style={{ width: "100%", background: bg, border: `1.5px solid ${border}`, borderRadius: 14, padding: "12px 16px", cursor: submitted ? "default" : "pointer", textAlign: "left", marginBottom: 8, color, fontSize: 13, lineHeight: 1.5, display: "flex", gap: 10, alignItems: "flex-start", transition: "all .2s" }}>
            <span style={{ width: 24, height: 24, borderRadius: 6, background: border + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, flexShrink: 0, color: border, marginTop: 1 }}>{String.fromCharCode(65 + i)}</span>
            {opt}
          </button>
        );
      })}
      {submitted && (
        <div style={{ background: (isCorrect ? C.accent : C.red) + "11", border: `1px solid ${(isCorrect ? C.accent : C.red)}33`, borderRadius: 14, padding: 16, marginBottom: 16 }}>
          <p style={{ color: isCorrect ? C.accent : C.red, fontWeight: 700, margin: "0 0 8px", fontSize: 14 }}>{isCorrect ? "✅ Crushed it!" : "❌ Not quite — see below"}</p>
          <p style={{ color: C.muted, fontSize: 13, margin: 0, lineHeight: 1.6 }}>{s.explanation}</p>
        </div>
      )}
      {!submitted ? (
        <button onClick={() => setSubmitted(true)} disabled={selected.length === 0} style={{ width: "100%", padding: "15px", borderRadius: 14, border: "none", background: selected.length ? `linear-gradient(135deg,${C.accent},${C.accentDark})` : C.border, color: selected.length ? "#000" : C.muted, cursor: selected.length ? "pointer" : "not-allowed", fontWeight: 700, fontSize: 15, marginTop: "auto" }}>Submit Answer</button>
      ) : (
        <button onClick={onComplete} style={{ width: "100%", padding: "15px", borderRadius: 14, border: "none", background: `linear-gradient(135deg,${C.accent},${C.accentDark})`, color: "#000", cursor: "pointer", fontWeight: 700, fontSize: 15 }}>Continue →</button>
      )}
    </div>
  );
}

// ── Exam Tips ──────────────────────────────────────────────────────────────────
function ExamTipsLesson({ lesson, topic, onComplete }) {
  const [idx, setIdx] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [done, setDone] = useState(false);
  const tips = lesson.tips;
  const next = () => { setExpanded(false); setTimeout(() => { if (idx + 1 >= tips.length) setDone(true); else setIdx(idx + 1); }, 200); };
  if (done) return <CompletionScreen xp={lesson.xpReward} onContinue={onComplete} />;
  const t = tips[idx];
  return (
    <div style={{ padding: "20px 16px", minHeight: "78vh", display: "flex", flexDirection: "column" }}>
      <ProgressBar current={idx} total={tips.length} color={topic.color} />
      <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "20px 0 20px" }}>
        <span style={{ fontSize: 18 }}>🎓</span>
        <h3 style={{ color: C.muted, fontSize: 12, letterSpacing: 2, textTransform: "uppercase", margin: 0 }}>Examiner Tips — {idx + 1}/{tips.length}</h3>
      </div>
      <div style={{ flex: 1, background: C.card, border: `2px solid ${C.accent}44`, borderRadius: 24, padding: 24, display: "flex", flexDirection: "column", boxShadow: `0 0 24px ${C.accentGlow}` }}>
        <div style={{ background: C.accent + "18", borderRadius: 14, padding: "14px 16px", marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 22 }}>⚡</span>
          <p style={{ color: C.accent, fontWeight: 800, fontSize: 16, margin: 0, fontFamily: "'Playfair Display',serif" }}>{t.tip}</p>
        </div>
        {expanded ? (
          <div style={{ background: "#040A0A", borderRadius: 14, padding: 18, flex: 1 }}>
            <p style={{ color: C.muted, fontSize: 11, letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>FULL EXPLANATION</p>
            <p style={{ color: C.text, fontSize: 14, lineHeight: 1.7, margin: 0 }}>{t.detail}</p>
          </div>
        ) : (
          <button onClick={() => setExpanded(true)} style={{ padding: "14px", borderRadius: 14, border: `1px dashed ${C.accent}44`, background: "transparent", color: C.accent, cursor: "pointer", fontSize: 14, fontWeight: 600, flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            🔍 Read full explanation
          </button>
        )}
      </div>
      {expanded && <button onClick={next} style={{ width: "100%", padding: "15px", borderRadius: 14, border: "none", background: `linear-gradient(135deg,${C.accent},${C.accentDark})`, color: "#000", cursor: "pointer", fontWeight: 700, fontSize: 15, marginTop: 16 }}>{idx + 1 >= tips.length ? "Lesson Crushed! 💪" : "Next Tip →"}</button>}
    </div>
  );
}

// ── Topic Screen ───────────────────────────────────────────────────────────────
function TopicScreen({ topic, onSelectLesson, onBack, completedLessons }) {
  const lessons = LESSONS[topic.id] || [];
  const typeIcons = { flashcard: "🃏", mcq: "✅", formula: "📐", scenario: "📋", examtips: "🎓" };
  const typeLabels = { flashcard: "Flashcards", mcq: "Quiz", formula: "Formulas", scenario: "Scenario", examtips: "Examiner Tips" };
  const topicXP = lessons.reduce((sum, l) => sum + (completedLessons[`${topic.id}-${l.id}`]?.xp || 0), 0);
  const maxTopicXP = lessons.reduce((sum, l) => sum + l.xpReward, 0);
  const completedCount = lessons.filter(l => completedLessons[`${topic.id}-${l.id}`]).length;
  return (
    <div style={{ paddingBottom: 80 }}>
      <div style={{ background: `linear-gradient(135deg,${topic.color}12,#080F0F)`, padding: "24px 20px", borderBottom: `1px solid ${topic.color}33` }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 13, padding: 0, marginBottom: 16, display: "flex", alignItems: "center", gap: 6 }}>← Back</button>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: topic.color + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, border: `1px solid ${topic.color}44`, boxShadow: `0 0 16px ${topic.color}33` }}>{topic.icon}</div>
          <div style={{ flex: 1 }}>
            <Badge label="APM" color={topic.color} />
            <h2 style={{ color: C.white, fontSize: 18, fontWeight: 800, margin: "6px 0 4px" }}>{topic.title}</h2>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <XPBar xp={topicXP} max={maxTopicXP} color={topic.color} />
              <span style={{ color: C.muted, fontSize: 11, flexShrink: 0 }}>{topicXP}/{maxTopicXP} XP</span>
            </div>
          </div>
        </div>
      </div>
      <div style={{ padding: "20px 16px" }}>
        <p style={{ color: C.muted, fontSize: 12, marginBottom: 16 }}>{completedCount} of {lessons.length} lessons completed</p>
        {lessons.map(lesson => {
          const key = `${topic.id}-${lesson.id}`;
          const isDone = !!completedLessons[key];
          const earnedXP = completedLessons[key]?.xp || 0;
          return (
            <button key={lesson.id} onClick={() => onSelectLesson(lesson)} style={{ width: "100%", background: C.card, border: `1px solid ${isDone ? topic.color + "44" : C.border}`, borderRadius: 14, padding: "16px", cursor: "pointer", textAlign: "left", marginBottom: 10, display: "flex", alignItems: "center", gap: 14, transition: "all .2s", position: "relative", overflow: "hidden", boxShadow: isDone ? `0 0 12px ${topic.color}18` : "none" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = topic.color}
              onMouseLeave={e => e.currentTarget.style.borderColor = isDone ? topic.color + "44" : C.border}>
              {isDone && <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: topic.color, boxShadow: `0 0 8px ${topic.color}` }} />}
              <div style={{ width: 44, height: 44, borderRadius: 12, background: isDone ? topic.color + "22" : "#0D2020", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{typeIcons[lesson.type]}</div>
              <div style={{ flex: 1 }}>
                <div style={{ color: C.white, fontWeight: 700, fontSize: 14 }}>{lesson.title}</div>
                <div style={{ color: C.muted, fontSize: 12, marginTop: 3 }}>
                  {typeLabels[lesson.type]} · {isDone ? <span style={{ color: topic.color, fontWeight: 700 }}>✓ +{earnedXP} XP earned</span> : <span style={{ color: C.accent }}>+{lesson.xpReward} XP</span>}
                </div>
              </div>
              <div style={{ color: isDone ? topic.color : C.muted, fontSize: 20 }}>{isDone ? "✓" : "›"}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Home Screen ────────────────────────────────────────────────────────────────
function HomeScreen({ onSelectTopic, progress }) {
  const { totalXP, gems, streak, completedLessons, studyDates } = progress;
  const totalLessons = Object.values(LESSONS).flat().length;
  const completedCount = Object.keys(completedLessons).length;
  const maxXP = Object.values(LESSONS).flat().reduce((s, l) => s + l.xpReward, 0);
  const getTopicXP = (id) => (LESSONS[id] || []).reduce((sum, l) => sum + (completedLessons[`${id}-${l.id}`]?.xp || 0), 0);
  const getTopicMax = (id) => (LESSONS[id] || []).reduce((s, l) => s + l.xpReward, 0);

  return (
    <div style={{ paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ background: `linear-gradient(135deg,#001A00,#080F0F)`, padding: "32px 20px 28px", marginBottom: 8, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -60, right: -60, width: 280, height: 280, borderRadius: "50%", background: C.accentGlow, filter: "blur(80px)" }} />
        <div style={{ position: "absolute", bottom: -40, left: -40, width: 180, height: 180, borderRadius: "50%", background: "#00E67611", filter: "blur(60px)" }} />
        <div style={{ position: "relative" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <span style={{ fontSize: 32 }}>💪</span>
                <div>
                  <h1 style={{ color: C.accent, fontSize: 22, fontWeight: 900, margin: 0, fontFamily: "'Playfair Display',serif", textShadow: `0 0 20px ${C.accent}66` }}>APM Exam Crusher</h1>
                  <p style={{ color: C.accentDark, fontSize: 11, fontWeight: 700, letterSpacing: 2, margin: 0, textTransform: "uppercase" }}>Advanced Performance Management</p>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 18 }}>🔥</div>
                <div style={{ color: streak > 0 ? C.gold : C.muted, fontWeight: 800, fontSize: 14 }}>{streak}</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 18 }}>💎</div>
                <div style={{ color: C.blue, fontWeight: 800, fontSize: 14 }}>{gems}</div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 20, background: "#00000033", borderRadius: 12, padding: "12px 16px", border: `1px solid ${C.accent}22` }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ color: C.muted, fontSize: 12 }}>Total XP</span>
              <span style={{ color: C.accent, fontWeight: 700, fontSize: 12 }}>{totalXP} / {maxXP}</span>
            </div>
            <XPBar xp={totalXP} max={maxXP} color={C.accent} />
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
            {[
              { label: "Lessons Done", value: `${completedCount}/${totalLessons}`, icon: "📚" },
              { label: "Days Studied", value: studyDates.length, icon: "📅" },
              { label: "Day Streak", value: streak, icon: "🔥" },
            ].map(s => (
              <div key={s.label} style={{ flex: 1, background: "#00000033", borderRadius: 10, padding: "10px 8px", textAlign: "center", border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 16 }}>{s.icon}</div>
                <div style={{ color: C.accent, fontWeight: 800, fontSize: 16, margin: "4px 0 2px" }}>{s.value}</div>
                <div style={{ color: C.muted, fontSize: 9, letterSpacing: 0.5 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Exam banner */}
      <div style={{ margin: "0 16px 20px", background: C.card, borderRadius: 16, padding: "14px 16px", border: `1px solid ${C.accent}33`, display: "flex", alignItems: "center", gap: 12, boxShadow: `0 0 16px ${C.accentGlow}` }}>
        <span style={{ fontSize: 24 }}>🎯</span>
        <div>
          <p style={{ color: C.accent, fontWeight: 700, fontSize: 13, margin: "0 0 2px" }}>APM — Strategic Professional Level</p>
          <p style={{ color: C.muted, fontSize: 12, margin: 0 }}>3 hr 15 min · Section A (50m) + Section B (50m)</p>
        </div>
      </div>

      {/* Topics */}
      <div style={{ padding: "0 16px" }}>
        <h3 style={{ color: C.muted, fontSize: 11, letterSpacing: 2, textTransform: "uppercase", marginBottom: 14 }}>Topics to Crush</h3>
        {TOPICS.map(topic => {
          const xp = getTopicXP(topic.id);
          const max = getTopicMax(topic.id);
          const lessons = LESSONS[topic.id] || [];
          const done = lessons.filter(l => completedLessons[`${topic.id}-${l.id}`]).length;
          return (
            <button key={topic.id} onClick={() => onSelectTopic(topic)} style={{ width: "100%", background: C.card, border: `1px solid ${xp > 0 ? topic.color + "55" : C.border}`, borderRadius: 16, padding: "16px", cursor: "pointer", textAlign: "left", marginBottom: 10, display: "flex", alignItems: "center", gap: 14, transition: "all .2s", position: "relative", overflow: "hidden", boxShadow: xp > 0 ? `0 0 12px ${topic.color}18` : "none" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = topic.color; e.currentTarget.style.transform = "translateX(4px)"; e.currentTarget.style.boxShadow = `0 0 20px ${topic.color}22`; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = xp > 0 ? topic.color + "55" : C.border; e.currentTarget.style.transform = "translateX(0)"; e.currentTarget.style.boxShadow = xp > 0 ? `0 0 12px ${topic.color}18` : "none"; }}>
              {xp > 0 && <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: topic.color, boxShadow: `0 0 8px ${topic.color}` }} />}
              <div style={{ width: 46, height: 46, borderRadius: 14, background: topic.color + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0, border: `1px solid ${topic.color}33` }}>{topic.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ color: C.white, fontWeight: 700, fontSize: 14, marginBottom: 6 }}>{topic.title}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <XPBar xp={xp} max={max} color={topic.color} />
                  <span style={{ color: C.muted, fontSize: 11, flexShrink: 0 }}>{xp} XP</span>
                </div>
                <span style={{ color: C.muted, fontSize: 11 }}>{done}/{lessons.length} lessons</span>
              </div>
              <div style={{ color: topic.color, fontSize: 20 }}>›</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── AI Chat ────────────────────────────────────────────────────────────────────
function ChatScreen({ currentTopic }) {
  const [messages, setMessages] = useState([
    { role: "assistant", content: `Hey! 👊 I'm your APM AI Tutor — let's crush this exam together.\n\nAsk me anything about APM:\n• Explain concepts & frameworks\n• Work through formulas step by step\n• Practice scenario questions\n• Examiner tips & marking schemes\n\n${currentTopic ? `You're studying **${currentTopic.title}**. What do you need?` : "Which topic shall we tackle?"}` }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  const suggested = currentTopic ? ({
    spc: ["Explain the Balanced Scorecard with an example", "Difference between CSF and KPI?", "Weaknesses of the BSC?"],
    pms: ["Throughput vs marginal costing — key differences?", "When should I recommend ABC?", "Explain value chain analysis"],
    esf: ["Explain the Triple Bottom Line", "GRI vs Integrated Reporting?", "How do I measure ESG as a KPI?"],
    qm: ["Explain the Cost of Quality model (PAIF)", "TQM vs Kaizen — key differences?", "How do I classify quality costs?"],
    ru: ["When should I use EV vs maximin?", "How do I calculate minimax regret?", "Explain sensitivity analysis"],
    tp: ["Minimum transfer price with no spare capacity?", "What is goal congruence?", "Explain the two-part tariff"],
    dp: ["ROI vs Residual Income?", "How is EVA calculated?", "Explain DuPont analysis"],
  }[currentTopic.id] || ["Ask me anything about APM"])
  : ["Explain EVA vs RI", "What is the Balanced Scorecard?", "How do I approach APM Section A?"];

  const sendMessage = async (text) => {
    const userText = text || input.trim();
    if (!userText || loading) return;
    setInput("");
    const newMessages = [...messages, { role: "user", content: userText }];
    setMessages(newMessages);
    setLoading(true);
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: `You are an expert ACCA APM tutor inside APM Exam Crusher — a focused exam prep app. ONLY answer APM-related questions. Be direct and exam-focused. Use **bold** for key terms. Keep answers under 280 words. Use 🎯 for key points, 📐 for formulas, ⚠️ for warnings, ✅ for correct approaches.${currentTopic ? ` Student is studying: ${currentTopic.title}` : ""}`,
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await response.json();
      const reply = data.content?.find(b => b.type === "text")?.text || "Sorry, couldn't get a response. Try again.";
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "⚠️ Connection error. Please check your internet." }]);
    }
    setLoading(false);
  };

  const renderMessage = (text) => text.split('\n').map((line, i) => {
    const parts = line.split(/\*\*(.*?)\*\*/g);
    return <span key={i}>{parts.map((p, j) => j % 2 === 1 ? <strong key={j} style={{ color: C.accent }}>{p}</strong> : p)}{i < text.split('\n').length - 1 && <br />}</span>;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <div style={{ background: `linear-gradient(135deg,${C.accent}12,#080F0F)`, padding: "20px 16px 16px", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: `linear-gradient(135deg,${C.accent},${C.accentDark})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, boxShadow: `0 0 16px ${C.accentGlow}` }}>🤖</div>
          <div style={{ flex: 1 }}>
            <h2 style={{ color: C.white, fontSize: 17, fontWeight: 800, margin: 0 }}>APM AI Tutor</h2>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: C.accent, boxShadow: `0 0 6px ${C.accent}` }} />
              <span style={{ color: C.accent, fontSize: 11, fontWeight: 600 }}>Online · Exam Specialist</span>
            </div>
          </div>
          {currentTopic && <Badge label={currentTopic.short} color={currentTopic.color} />}
        </div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: 12 }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
            {msg.role === "assistant" && <div style={{ width: 30, height: 30, borderRadius: 10, background: `linear-gradient(135deg,${C.accent},${C.accentDark})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, marginRight: 8, flexShrink: 0, alignSelf: "flex-end" }}>🤖</div>}
            <div style={{ maxWidth: "78%", padding: "12px 14px", borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px", background: msg.role === "user" ? `linear-gradient(135deg,${C.accent},${C.accentDark})` : C.card, border: msg.role === "user" ? "none" : `1px solid ${C.border}`, color: msg.role === "user" ? "#000" : C.text, fontSize: 14, lineHeight: 1.6, fontWeight: msg.role === "user" ? 600 : 400 }}>
              {renderMessage(msg.content)}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 30, height: 30, borderRadius: 10, background: `linear-gradient(135deg,${C.accent},${C.accentDark})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🤖</div>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "18px 18px 18px 4px", padding: "14px 18px", display: "flex", gap: 5 }}>
              {[0, 1, 2].map(i => <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: C.accent, animation: "pulse .8s infinite", animationDelay: `${i * .15}s` }} />)}
            </div>
          </div>
        )}
        {messages.length === 1 && (
          <div style={{ marginTop: 8 }}>
            <p style={{ color: C.muted, fontSize: 11, letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>Quick Questions</p>
            {suggested.map(q => (
              <button key={q} onClick={() => sendMessage(q)} style={{ width: "100%", background: C.card, border: `1px solid ${C.accent}33`, borderRadius: 12, padding: "10px 14px", cursor: "pointer", color: C.accent, fontSize: 13, textAlign: "left", fontWeight: 600, marginBottom: 8, transition: "all .2s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.background = C.accent + "11"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.accent + "33"; e.currentTarget.style.background = C.card; }}>
                💬 {q}
              </button>
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div style={{ padding: "12px 16px 20px", background: C.bg, borderTop: `1px solid ${C.border}`, flexShrink: 0 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
          <div style={{ flex: 1, background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "10px 14px" }}>
            <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} placeholder="Ask anything about APM..." rows={1} style={{ flex: 1, background: "none", border: "none", outline: "none", color: C.text, fontSize: 14, resize: "none", fontFamily: "inherit", lineHeight: 1.5, width: "100%" }} />
          </div>
          <button onClick={() => sendMessage()} disabled={!input.trim() || loading} style={{ width: 46, height: 46, borderRadius: 14, border: "none", background: input.trim() && !loading ? `linear-gradient(135deg,${C.accent},${C.accentDark})` : "#0D2020", cursor: input.trim() && !loading ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0, boxShadow: input.trim() && !loading ? `0 0 12px ${C.accentGlow}` : "none" }}>
            {loading ? "⏳" : "➤"}
          </button>
        </div>
        <p style={{ color: C.muted, fontSize: 10, textAlign: "center", marginTop: 8 }}>APM Exam Crusher AI · Always verify with official ACCA materials</p>
      </div>
      <style>{`@keyframes pulse{0%,80%,100%{opacity:.3;transform:scale(1)}40%{opacity:1;transform:scale(1.3)}}`}</style>
    </div>
  );
}

// ── Main App ───────────────────────────────────────────────────────────────────
export default function App() {
  const [progress, setProgress] = useState(() => loadProgress());
  const [tab, setTab] = useState("home");
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [selectedLesson, setSelectedLesson] = useState(null);

  useEffect(() => { saveProgress(progress); }, [progress]);

  const handleLessonComplete = useCallback((xpEarned) => {
    if (!selectedTopic || !selectedLesson) return;
    const key = `${selectedTopic.id}-${selectedLesson.id}`;
    setProgress(prev => {
      const alreadyDone = !!prev.completedLessons[key];
      const xpGain = alreadyDone ? 0 : xpEarned;
      const today = todayStr();
      const newDates = [...new Set([...prev.studyDates, today])];
      const newStreak = computeStreak(newDates);
      return {
        ...prev,
        totalXP: prev.totalXP + xpGain,
        gems: prev.gems + (alreadyDone ? 0 : Math.floor(xpEarned / 5)),
        completedLessons: { ...prev.completedLessons, [key]: { xp: xpEarned, completedAt: new Date().toISOString() } },
        studyDates: newDates,
        streak: newStreak,
        lastStudiedDate: today,
      };
    });
    setSelectedLesson(null);
  }, [selectedTopic, selectedLesson]);

  const renderLesson = () => {
    if (!selectedLesson) return null;
    const props = { lesson: selectedLesson, topic: selectedTopic, onComplete: (xp) => handleLessonComplete(xp || selectedLesson.xpReward) };
    if (selectedLesson.type === "flashcard") return <FlashcardLesson {...props} />;
    if (selectedLesson.type === "mcq") return <MCQLesson {...props} />;
    if (selectedLesson.type === "formula") return <FormulaLesson {...props} />;
    if (selectedLesson.type === "scenario") return <ScenarioLesson {...props} />;
    if (selectedLesson.type === "examtips") return <ExamTipsLesson {...props} />;
  };

  const navItems = [
    { id: "home", icon: "🏠", label: "Learn" },
    { id: "chat", icon: "🤖", label: "AI Tutor" },
    { id: "leaderboard", icon: "🏆", label: "Ranks" },
  ];

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, fontFamily: "'Inter',-apple-system,sans-serif", maxWidth: 480, margin: "0 auto", position: "relative" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@800;900&family=Inter:wght@400;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        body{background:#080F0F;}
        button{font-family:'Inter',sans-serif;}
        ::-webkit-scrollbar{width:4px;}
        ::-webkit-scrollbar-track{background:transparent;}
        ::-webkit-scrollbar-thumb{background:#143030;border-radius:4px;}
        textarea::placeholder{color:#546E7A;}
      `}</style>

      {selectedLesson && (
        <div style={{ position: "fixed", inset: 0, background: C.bg, zIndex: 100, overflowY: "auto", maxWidth: 480, margin: "0 auto" }}>
          <div style={{ padding: "16px 16px 0", borderBottom: `1px solid ${C.border}`, background: C.bg }}>
            <button onClick={() => setSelectedLesson(null)} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 13, padding: "8px 0", display: "flex", alignItems: "center", gap: 6 }}>✕ Exit Lesson</button>
          </div>
          {renderLesson()}
        </div>
      )}

      {selectedTopic && !selectedLesson && (
        <div style={{ position: "fixed", inset: 0, background: C.bg, zIndex: 50, overflowY: "auto", maxWidth: 480, margin: "0 auto" }}>
          <TopicScreen topic={selectedTopic} onSelectLesson={setSelectedLesson} onBack={() => setSelectedTopic(null)} completedLessons={progress.completedLessons} />
        </div>
      )}

      <div style={{ overflowY: tab === "chat" ? "hidden" : "auto", height: tab === "chat" ? "100vh" : "auto", paddingBottom: tab === "chat" ? 0 : 72 }}>
        {tab === "home" && <HomeScreen onSelectTopic={setSelectedTopic} progress={progress} />}
        {tab === "chat" && <ChatScreen currentTopic={selectedTopic} />}
        {tab === "leaderboard" && (
          <div style={{ padding: "24px 16px 80px" }}>
            <h2 style={{ color: C.accent, fontSize: 22, fontWeight: 900, marginBottom: 4, fontFamily: "'Playfair Display',serif" }}>APM Rankings</h2>
            <p style={{ color: C.muted, fontSize: 13, marginBottom: 24 }}>Top APM Exam Crushers this week</p>
            {[
              { name: "Sarah M.", xp: 3840, streak: 42, flag: "🇬🇧" },
              { name: "Ahmed K.", xp: 3210, streak: 35, flag: "🇵🇰" },
              { name: "Priya S.", xp: 2980, streak: 28, flag: "🇮🇳" },
              { name: "You", xp: progress.totalXP, streak: progress.streak, flag: "⭐", isMe: true },
              { name: "Liu W.", xp: 420, streak: 5, flag: "🇨🇳" },
            ].sort((a, b) => b.xp - a.xp).map((p, i) => (
              <div key={p.name} style={{ background: p.isMe ? C.accent + "12" : C.card, border: `1px solid ${p.isMe ? C.accent + "66" : C.border}`, borderRadius: 16, padding: "14px 16px", marginBottom: 10, display: "flex", alignItems: "center", gap: 14, boxShadow: p.isMe ? `0 0 16px ${C.accentGlow}` : "none" }}>
                <div style={{ width: 32, textAlign: "center", fontSize: 20 }}>{["🥇","🥈","🥉"][i] || `#${i+1}`}</div>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: p.isMe ? C.accent + "22" : C.border, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{p.flag}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: p.isMe ? C.accent : C.white, fontWeight: 700, fontSize: 14 }}>{p.name}</div>
                  <div style={{ color: C.muted, fontSize: 12, marginTop: 2 }}>{p.xp.toLocaleString()} XP</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ fontSize: 16 }}>🔥</span>
                  <span style={{ fontWeight: 800, fontSize: 14, color: C.gold }}>{p.streak}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {tab !== "chat" && (
        <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, background: "#050C0C", borderTop: `1px solid ${C.border}`, display: "flex", padding: "8px 0 12px", zIndex: 40 }}>
          {navItems.map(item => (
            <button key={item.id} onClick={() => { setTab(item.id); setSelectedTopic(null); setSelectedLesson(null); }} style={{ flex: 1, background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "6px 0" }}>
              <span style={{ fontSize: 22 }}>{item.icon}</span>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: .5, color: tab === item.id ? C.accent : C.muted }}>{item.label}</span>
              {tab === item.id && <div style={{ width: 16, height: 3, borderRadius: 99, background: C.accent, boxShadow: `0 0 8px ${C.accent}` }} />}
            </button>
          ))}
        </div>
      )}

      {tab !== "chat" && (
        <button onClick={() => setTab("chat")} style={{ position: "fixed", bottom: 82, right: 16, width: 52, height: 52, borderRadius: 16, border: "none", background: `linear-gradient(135deg,${C.accent},${C.accentDark})`, cursor: "pointer", fontSize: 22, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 4px 20px ${C.accentGlow}`, zIndex: 39 }}>
          🤖
        </button>
      )}
    </div>
  );
}
