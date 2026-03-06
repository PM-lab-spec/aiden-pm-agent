export type TemplateCategory = "planning" | "execution" | "analysis" | "communication" | "metrics";

export interface SampleTemplate {
  id: string;
  title: string;
  description: string;
  category: TemplateCategory;
  prompt: string;
}

export const TEMPLATE_CATEGORIES: { id: TemplateCategory; label: string }[] = [
  { id: "planning", label: "Planning" },
  { id: "execution", label: "Execution" },
  { id: "analysis", label: "Analysis" },
  { id: "communication", label: "Communication" },
  { id: "metrics", label: "Metrics & KPIs" },
];

export const SAMPLE_TEMPLATES: SampleTemplate[] = [
  // ── Planning ──
  {
    id: "prd-template",
    title: "Product Requirements Document",
    description: "Full PRD with problem statement, goals, user stories, scope, and success metrics",
    category: "planning",
    prompt: "Generate a comprehensive Product Requirements Document (PRD) with the following sections:\n\n1. **Overview** — Problem statement and product vision\n2. **Goals & Objectives** — Measurable outcomes\n3. **User Personas** — Target audience profiles\n4. **User Stories** — Epics and stories with acceptance criteria\n5. **Scope** — In-scope and out-of-scope items\n6. **Technical Requirements** — Architecture and integration needs\n7. **Success Metrics** — KPIs and measurement plan\n8. **Timeline** — Milestones and delivery phases\n\nUse a professional format with tables where appropriate.",
  },
  {
    id: "project-charter",
    title: "Project Charter",
    description: "Executive-level project authorization with scope, stakeholders, and constraints",
    category: "planning",
    prompt: "Generate a Project Charter document with these sections:\n\n1. **Project Title & Description**\n2. **Business Case** — Why this project matters\n3. **Project Objectives** — SMART goals\n4. **Scope Statement** — Boundaries and deliverables\n5. **Key Stakeholders** — RACI matrix\n6. **Assumptions & Constraints**\n7. **Risks** — Top risks with mitigation strategies\n8. **Budget & Resources** — High-level estimates\n9. **Timeline** — Key milestones\n10. **Approval Signatures**\n\nFormat as a professional document with tables.",
  },
  {
    id: "okr-template",
    title: "OKR Framework",
    description: "Objectives and Key Results template with scoring methodology",
    category: "planning",
    prompt: "Generate an OKR (Objectives and Key Results) framework with:\n\n| Objective | Key Result | Target | Current | Score |\n|-----------|-----------|--------|---------|-------|\n\nInclude:\n- 3-5 strategic objectives\n- 3 key results per objective with measurable targets\n- Scoring methodology (0.0 to 1.0 scale)\n- Quarterly review cadence guidelines\n- Tips for writing effective OKRs\n\nMake objectives ambitious but achievable. Key results must be measurable.",
  },
  {
    id: "sprint-planning",
    title: "Sprint Planning Template",
    description: "Sprint goal, backlog items, capacity planning, and definition of done",
    category: "planning",
    prompt: "Generate a Sprint Planning document template with:\n\n1. **Sprint Goal** — Clear, concise sprint objective\n2. **Sprint Backlog** table:\n\n| ID | User Story | Story Points | Assignee | Priority | Status |\n|----|-----------|-------------|----------|----------|--------|\n\n3. **Team Capacity** — Available hours per team member\n4. **Dependencies** — Cross-team dependencies\n5. **Risks & Blockers** — Known impediments\n6. **Definition of Done** — Checklist for completion\n7. **Sprint Ceremonies** — Schedule for standup, review, retro\n\nInclude sample data for a 2-week sprint.",
  },
  {
    id: "roadmap-template",
    title: "Product Roadmap (Now/Next/Later)",
    description: "Strategic roadmap with timeline, initiatives, and success metrics",
    category: "planning",
    prompt: "Generate a Product Roadmap using the Now/Next/Later framework:\n\n| Timeline | Initiative | Description | Key Features | Success Metric | Owner |\n|----------|-----------|-------------|-------------|----------------|-------|\n\nInclude:\n- **Now (0-3 months)**: 3-4 high-priority items currently in progress\n- **Next (3-6 months)**: 3-4 planned initiatives\n- **Later (6-12 months)**: 2-3 exploratory items\n- Strategic themes linking initiatives\n- Dependencies between items\n- Resource allocation notes",
  },

  // ── Execution ──
  {
    id: "sprint-retro",
    title: "Sprint Retrospective",
    description: "What went well, what didn't, and action items for improvement",
    category: "execution",
    prompt: "Generate a Sprint Retrospective template with:\n\n## Sprint Summary\n- Sprint number, dates, and goal achievement status\n\n## What Went Well ✅\n- (List 4-5 positive items)\n\n## What Didn't Go Well ❌\n- (List 4-5 improvement areas)\n\n## What Can We Improve 🔄\n- (List 3-4 actionable improvements)\n\n## Action Items\n\n| Action | Owner | Due Date | Priority |\n|--------|-------|----------|----------|\n\n## Team Morale Check\n- Overall team sentiment (1-5 scale)\n- Key concerns raised\n\nInclude sample content for a realistic sprint.",
  },
  {
    id: "release-notes",
    title: "Release Notes",
    description: "User-facing changelog with features, fixes, and known issues",
    category: "execution",
    prompt: "Generate a Release Notes template with:\n\n# Release v[X.Y.Z] — [Date]\n\n## 🚀 New Features\n- Feature 1 — Brief description\n- Feature 2 — Brief description\n\n## 🔧 Improvements\n- Enhancement 1\n- Enhancement 2\n\n## 🐛 Bug Fixes\n- Fix 1 — What was resolved\n- Fix 2 — What was resolved\n\n## ⚠️ Known Issues\n- Issue 1 — Workaround if available\n\n## 📋 Migration Notes\n- Any breaking changes or required actions\n\n## 🙏 Acknowledgments\n- Contributors and teams\n\nInclude realistic sample content for a SaaS product.",
  },
  {
    id: "meeting-notes",
    title: "Meeting Notes / MoM",
    description: "Structured minutes with attendees, decisions, and action items",
    category: "execution",
    prompt: "Generate a Meeting Notes (Minutes of Meeting) template:\n\n## Meeting Details\n- **Date:** [Date]\n- **Time:** [Start] - [End]\n- **Attendees:** [Names and roles]\n- **Facilitator:** [Name]\n\n## Agenda\n1. Topic 1\n2. Topic 2\n3. Topic 3\n\n## Discussion Summary\n### Topic 1\n- Key points discussed\n- Different viewpoints raised\n\n## Decisions Made\n| Decision | Rationale | Owner |\n|----------|-----------|-------|\n\n## Action Items\n| Action | Owner | Due Date | Status |\n|--------|-------|----------|--------|\n\n## Next Meeting\n- Date, time, and preliminary agenda",
  },
  {
    id: "bug-report",
    title: "Bug Report Template",
    description: "Standardized bug report with reproduction steps and severity",
    category: "execution",
    prompt: "Generate a Bug Report template:\n\n## Bug Report\n\n| Field | Value |\n|-------|-------|\n| **ID** | BUG-[XXX] |\n| **Title** | [Brief description] |\n| **Severity** | Critical / High / Medium / Low |\n| **Priority** | P0 / P1 / P2 / P3 |\n| **Reporter** | [Name] |\n| **Assignee** | [Name] |\n| **Environment** | [OS, Browser, Version] |\n\n## Description\nBrief summary of the issue.\n\n## Steps to Reproduce\n1. Step 1\n2. Step 2\n3. Step 3\n\n## Expected Behavior\nWhat should happen.\n\n## Actual Behavior\nWhat actually happens.\n\n## Screenshots / Logs\n[Attach relevant evidence]\n\n## Root Cause (Post-fix)\n[To be filled after investigation]",
  },

  // ── Analysis ──
  {
    id: "competitive-analysis",
    title: "Competitive Analysis",
    description: "Feature comparison matrix with positioning and differentiation strategy",
    category: "analysis",
    prompt: "Generate a Competitive Analysis template:\n\n## Market Overview\nBrief industry context and market size.\n\n## Competitor Comparison Matrix\n\n| Feature / Capability | Our Product | Competitor A | Competitor B | Competitor C |\n|---------------------|------------|-------------|-------------|-------------|\n| Core Feature 1 | ✅ | ✅ | ❌ | ✅ |\n| Core Feature 2 | ✅ | ❌ | ✅ | ❌ |\n\n## Competitor Profiles\n### Competitor A\n- **Strengths:**\n- **Weaknesses:**\n- **Pricing:**\n- **Target Market:**\n\n## SWOT Analysis (Our Position)\n| Strengths | Weaknesses |\n|-----------|------------|\n| Opportunities | Threats |\n\n## Differentiation Strategy\n- Key differentiators\n- Positioning statement\n- Go-to-market advantages",
  },
  {
    id: "user-persona",
    title: "User Persona",
    description: "Detailed persona profiles with demographics, goals, and pain points",
    category: "analysis",
    prompt: "Generate 3 User Persona templates:\n\nFor each persona include:\n\n## Persona: [Name]\n\n| Attribute | Details |\n|-----------|--------|\n| **Role** | [Job title] |\n| **Age** | [Range] |\n| **Experience** | [Years in field] |\n| **Tech Savviness** | Low / Medium / High |\n\n### Goals\n- Primary goal\n- Secondary goals\n\n### Pain Points\n- Frustration 1\n- Frustration 2\n\n### Behaviors\n- How they currently solve the problem\n- Tools they use\n\n### Quote\n> \"A representative quote that captures their mindset\"\n\n### How We Help\n- Key value proposition for this persona",
  },
  {
    id: "swot-analysis",
    title: "SWOT Analysis",
    description: "Strengths, Weaknesses, Opportunities, and Threats framework",
    category: "analysis",
    prompt: "Generate a SWOT Analysis template:\n\n## SWOT Analysis: [Product/Project Name]\n\n| | **Helpful** | **Harmful** |\n|---|---|---|\n| **Internal** | **Strengths** | **Weaknesses** |\n| | • Strength 1 | • Weakness 1 |\n| | • Strength 2 | • Weakness 2 |\n| | • Strength 3 | • Weakness 3 |\n| **External** | **Opportunities** | **Threats** |\n| | • Opportunity 1 | • Threat 1 |\n| | • Opportunity 2 | • Threat 2 |\n| | • Opportunity 3 | • Threat 3 |\n\n## Strategic Implications\n- **SO Strategies** (Strengths → Opportunities)\n- **WO Strategies** (Weaknesses → Opportunities)\n- **ST Strategies** (Strengths → Threats)\n- **WT Strategies** (Weaknesses → Threats)\n\n## Priority Actions\n| Action | Type | Impact | Effort |\n|--------|------|--------|--------|",
  },
  {
    id: "market-research",
    title: "Market Research Brief",
    description: "Research plan with methodology, target segments, and key questions",
    category: "analysis",
    prompt: "Generate a Market Research Brief template:\n\n## Research Objective\nWhat we want to learn and why.\n\n## Research Questions\n1. Primary question\n2. Secondary questions (3-5)\n\n## Methodology\n| Method | Sample Size | Duration | Cost |\n|--------|------------|----------|------|\n| User Interviews | 10-15 | 2 weeks | $X |\n| Survey | 200+ | 1 week | $X |\n| Competitive Audit | 5-8 competitors | 1 week | $X |\n\n## Target Segments\n- Segment 1: Description and criteria\n- Segment 2: Description and criteria\n\n## Key Hypotheses\n- H1: [Statement to validate]\n- H2: [Statement to validate]\n\n## Timeline\n| Phase | Dates | Deliverable |\n|-------|-------|-------------|\n\n## Expected Outputs\n- Research report\n- Recommendations deck\n- Data appendix",
  },

  // ── Communication ──
  {
    id: "stakeholder-update",
    title: "Stakeholder Update Email",
    description: "Weekly/monthly executive status update with RAG status indicators",
    category: "communication",
    prompt: "Generate a Stakeholder Update email template:\n\n**Subject: [Project Name] — Weekly Status Update [Date]**\n\n**Overall Status: 🟢 On Track**\n\n**Executive Summary**\nBrief 2-3 sentence overview of progress.\n\n**Key Accomplishments This Week**\n- Achievement 1\n- Achievement 2\n\n**Upcoming Milestones**\n| Milestone | Target Date | Status | Owner |\n|-----------|------------|--------|-------|\n\n**Risks & Issues**\n| Risk/Issue | Impact | Mitigation | Status |\n|-----------|--------|-----------|--------|\n\n**Decisions Needed**\n- Decision 1: Context and options\n\n**Resource Updates**\n- Team changes, budget status\n\n**Next Week Focus**\n- Priority 1\n- Priority 2",
  },
  {
    id: "executive-summary",
    title: "Executive Summary",
    description: "One-page project overview for leadership with key metrics",
    category: "communication",
    prompt: "Generate an Executive Summary template:\n\n# Executive Summary: [Project Name]\n\n## Quick Stats\n| Metric | Value |\n|--------|-------|\n| **Status** | 🟢 On Track |\n| **Budget Used** | X% of total |\n| **Timeline** | On schedule |\n| **Team Size** | X people |\n\n## Problem Statement\nOne paragraph on the problem being solved.\n\n## Proposed Solution\nOne paragraph on the approach.\n\n## Business Impact\n- Revenue impact: $X\n- Cost savings: $X\n- User impact: X users\n\n## Key Milestones\n| Milestone | Date | Status |\n|-----------|------|--------|\n\n## Investment Required\n| Category | Amount |\n|----------|--------|\n\n## Recommendation\nClear ask or recommendation for leadership.",
  },
  {
    id: "change-log",
    title: "Product Changelog",
    description: "Customer-facing changelog organized by date and impact",
    category: "communication",
    prompt: "Generate a Product Changelog template organized by month:\n\n# Product Changelog\n\n## March 2025\n\n### 🎯 Major\n- **[Feature Name]** — Description of the feature and its benefit to users\n\n### ✨ Minor\n- **[Improvement]** — What changed and why\n\n### 🐛 Fixes\n- Fixed [issue description]\n\n---\n\n## February 2025\n(Repeat format)\n\n---\n\nInclude:\n- Visual icons for categories\n- Links to documentation (placeholder)\n- \"What's Coming Next\" teaser section at the top\n- Feedback prompt at the bottom",
  },
  {
    id: "rfp-template",
    title: "RFP / Vendor Evaluation",
    description: "Request for Proposal structure with evaluation criteria and scoring",
    category: "communication",
    prompt: "Generate an RFP (Request for Proposal) template:\n\n## Company Overview\nBrief description of your organization.\n\n## Project Description\nWhat you need and why.\n\n## Scope of Work\n- Deliverable 1\n- Deliverable 2\n- Deliverable 3\n\n## Requirements\n\n### Functional Requirements\n| ID | Requirement | Priority | Must/Nice |\n|----|------------|----------|----------|\n\n### Technical Requirements\n| ID | Requirement | Priority | Must/Nice |\n|----|------------|----------|----------|\n\n## Evaluation Criteria\n| Criteria | Weight |\n|----------|--------|\n| Technical Fit | 30% |\n| Cost | 25% |\n| Experience | 20% |\n| Timeline | 15% |\n| Support | 10% |\n\n## Vendor Scoring Matrix\n| Vendor | Technical | Cost | Experience | Timeline | Support | Total |\n|--------|-----------|------|-----------|----------|---------|-------|\n\n## Submission Guidelines\n- Deadline, format, contact info",
  },

  // ── Metrics & KPIs ──
  {
    id: "kpi-dashboard",
    title: "KPI Dashboard Plan",
    description: "Key metrics definition with targets, data sources, and review cadence",
    category: "metrics",
    prompt: "Generate a KPI Dashboard Plan:\n\n## Dashboard Overview\nPurpose and target audience.\n\n## Key Metrics\n\n| Category | KPI | Description | Target | Current | Trend | Data Source |\n|----------|-----|-------------|--------|---------|-------|------------|\n| Growth | MAU | Monthly Active Users | 50K | 42K | ↑ | Analytics |\n| Revenue | MRR | Monthly Recurring Revenue | $100K | $85K | ↑ | Billing |\n| Quality | NPS | Net Promoter Score | 50+ | 45 | → | Surveys |\n| Engineering | Uptime | Service Availability | 99.9% | 99.95% | → | Monitoring |\n\n## Review Cadence\n- **Daily:** Operational metrics\n- **Weekly:** Growth & engagement\n- **Monthly:** Business & financial\n- **Quarterly:** Strategic OKRs\n\n## Alert Thresholds\n| Metric | 🟢 Healthy | 🟡 Warning | 🔴 Critical |\n|--------|-----------|-----------|------------|",
  },
  {
    id: "experiment-design",
    title: "A/B Experiment Design",
    description: "Hypothesis, test plan, sample size, and success criteria for experiments",
    category: "metrics",
    prompt: "Generate an A/B Experiment Design template:\n\n## Experiment: [Name]\n\n| Field | Value |\n|-------|-------|\n| **Hypothesis** | If we [change], then [metric] will [improve by X%] |\n| **Primary Metric** | [Conversion rate / Engagement / Revenue] |\n| **Secondary Metrics** | [List 2-3 guardrail metrics] |\n| **Duration** | [X weeks] |\n| **Sample Size** | [X users per variant] |\n| **Confidence Level** | 95% |\n\n## Variants\n| Variant | Description | Traffic Split |\n|---------|-------------|---------------|\n| Control (A) | Current experience | 50% |\n| Treatment (B) | [Change description] | 50% |\n\n## Success Criteria\n- Primary: [Metric] improves by ≥X% with statistical significance\n- Guardrails: [Metric] does not degrade by >Y%\n\n## Risks & Mitigation\n- Risk 1: Mitigation\n\n## Results (Post-experiment)\n| Metric | Control | Treatment | Lift | P-value |\n|--------|---------|-----------|------|---------|",
  },
  {
    id: "metrics-plan",
    title: "Product Metrics Plan",
    description: "HEART/AARRR framework with instrumentation and tracking plan",
    category: "metrics",
    prompt: "Generate a Product Metrics Plan using the HEART framework:\n\n## Metrics Framework\n\n| Category | Metric | Description | How to Measure | Target |\n|----------|--------|-------------|---------------|--------|\n| **Happiness** | NPS | Net Promoter Score | Quarterly survey | 50+ |\n| **Happiness** | CSAT | Customer Satisfaction | Post-interaction survey | 4.5/5 |\n| **Engagement** | DAU/MAU | Stickiness ratio | Analytics | 40%+ |\n| **Engagement** | Session Duration | Avg time per session | Analytics | 8 min |\n| **Adoption** | Signup Rate | New user registrations | Funnel tracking | 15% |\n| **Retention** | D7 Retention | Users returning after 7 days | Cohort analysis | 35% |\n| **Task Success** | Completion Rate | Core task completion | Event tracking | 85% |\n\n## Instrumentation Plan\n| Event Name | Trigger | Properties | Priority |\n|-----------|---------|-----------|----------|\n\n## Reporting Cadence\n- Weekly metrics review meeting\n- Monthly metrics report to leadership\n- Quarterly deep-dive analysis",
  },
  {
    id: "health-scorecard",
    title: "Product Health Scorecard",
    description: "Monthly product health check across engagement, quality, and growth",
    category: "metrics",
    prompt: "Generate a Product Health Scorecard template:\n\n# Product Health Scorecard — [Month Year]\n\n## Overall Health: 🟢 Healthy\n\n## Scorecard\n\n| Dimension | Metric | Target | Actual | Status | Trend |\n|-----------|--------|--------|--------|--------|-------|\n| **Growth** | New Users | 5,000 | 5,200 | 🟢 | ↑ 8% |\n| **Growth** | MRR | $100K | $95K | 🟡 | ↑ 3% |\n| **Engagement** | DAU | 10K | 11K | 🟢 | ↑ 5% |\n| **Engagement** | Feature Adoption | 60% | 55% | 🟡 | → |\n| **Quality** | Crash Rate | <0.5% | 0.3% | 🟢 | ↓ |\n| **Quality** | P1 Bugs | <5 | 3 | 🟢 | ↓ |\n| **Satisfaction** | NPS | 50 | 48 | 🟡 | ↑ 2 |\n| **Velocity** | Sprint Completion | 85% | 90% | 🟢 | ↑ |\n\n## Key Insights\n- Insight 1\n- Insight 2\n\n## Actions for Next Month\n| Action | Owner | Priority |\n|--------|-------|----------|",
  },
];
