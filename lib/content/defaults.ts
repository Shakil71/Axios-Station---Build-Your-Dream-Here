/**
 * Default content. Used by the seed script for a fresh install, and by the
 * public site as a fallback when the CMS record is missing. Editable from the
 * admin CMS afterwards. No client names, counts, awards or results are invented.
 */

type Item = { title: string; description: string };

const defaultProcess: Item[] = [
  { title: "Discover", description: "Workshops to understand your goals, users, workflows and constraints." },
  { title: "Design", description: "Architecture, UX flows and a delivery plan you can review before we build." },
  { title: "Build", description: "Iterative sprints with working demos, code reviews and automated tests." },
  { title: "Deploy", description: "Secure, monitored releases to your cloud or on-premise infrastructure." },
  { title: "Support & Evolve", description: "Maintenance, performance tuning and new features as your business grows." },
];

export type SeedService = {
  slug: string;
  title: string;
  icon: string;
  tagline: string;
  excerpt: string;
  overview: string;
  challenges: string[];
  solution: string;
  features: Item[];
  technologies: string[];
  benefits: string[];
  process?: Item[];
  faqs: { q: string; a: string }[];
  featured?: boolean;
};

export const services: SeedService[] = [
  {
    slug: "custom-software-development",
    title: "Custom Software Development",
    icon: "Code2",
    tagline: "Software engineered around the way your business actually works.",
    excerpt: "Bespoke applications designed for your workflows, built to scale and maintained for the long term.",
    overview:
      "Off-the-shelf software forces compromises. We design and build custom platforms — internal tools, customer portals, data platforms and line-of-business systems — around your processes, with clean architecture that is easy to extend.",
    challenges: [
      "Teams juggling spreadsheets and disconnected tools",
      "Generic software that does not fit core workflows",
      "Legacy systems that are hard to change and expensive to run",
      "No single source of truth for business data",
    ],
    solution:
      "We map your workflows, define a modular architecture, and deliver in iterative releases so you see working software early. Every system ships with documentation, automated tests and a maintainable codebase your team can own.",
    features: [
      { title: "Domain-driven architecture", description: "Modules that mirror your business, making change cheap and safe." },
      { title: "Role-based access", description: "Granular permissions and audit trails built in from day one." },
      { title: "Integrations", description: "Connect payment gateways, ERPs, CRMs, SMS and email providers via secure APIs." },
      { title: "Reporting", description: "Dashboards and exports that turn operational data into decisions." },
    ],
    technologies: ["TypeScript", "Next.js", "Node.js", "Python", "Laravel", "MySQL", "PostgreSQL", "Redis"],
    benefits: ["Fits your exact process", "Lower long-term licence costs", "Full ownership of code and data", "Scales with your growth"],
    faqs: [
      { q: "Do we own the source code?", a: "Yes. Unless agreed otherwise in writing, you receive full ownership of the code we write for you." },
      { q: "Can you take over an existing system?", a: "Yes. We start with a technical audit, then stabilise, document and progressively modernise it." },
    ],
    featured: true,
  },
  {
    slug: "ai-integration-development",
    title: "AI Integration & Development",
    icon: "BrainCircuit",
    tagline: "Practical AI that plugs into your products and operations.",
    excerpt: "Integrate large language models, vision and predictive models into your software — securely and measurably.",
    overview:
      "We help businesses move from AI experiments to production features: assistants grounded in your own data, document understanding, classification, forecasting and recommendation — with guardrails, evaluation and cost control.",
    challenges: [
      "Unclear where AI will create real value",
      "Concerns about data privacy and hallucinations",
      "Prototypes that never reach production",
      "Unpredictable usage costs",
    ],
    solution:
      "We identify high-value use cases, build retrieval-augmented and tool-using AI features on top of your data, and add evaluation, monitoring, access control and cost limits so they are safe to run in production.",
    features: [
      { title: "Knowledge assistants", description: "Chat and search over your documents, policies and product data." },
      { title: "Document intelligence", description: "Extract structured data from invoices, forms, IDs and contracts." },
      { title: "Classification & routing", description: "Automatically tag, prioritise and route tickets, leads and emails." },
      { title: "Evaluation & guardrails", description: "Test suites, human review loops and policy filters for reliable output." },
    ],
    technologies: ["OpenAI API", "Anthropic Claude API", "LangChain", "Python", "Vector databases", "FastAPI", "Node.js"],
    benefits: ["Faster decisions", "Less manual data handling", "Better customer response times", "Controlled, auditable AI usage"],
    faqs: [
      { q: "Will our data be used to train public models?", a: "We use provider settings and architectures that keep your data out of model training, and we can deploy self-hosted models where required." },
      { q: "Which AI providers do you work with?", a: "We are provider-agnostic and choose based on accuracy, cost, latency and data-residency needs." },
    ],
    featured: true,
  },
  {
    slug: "ai-automation-intelligent-workflows",
    title: "AI Automation & Intelligent Workflows",
    icon: "Workflow",
    tagline: "Let software handle the repetitive work.",
    excerpt: "Automate multi-step business processes with AI decision points, approvals and human-in-the-loop review.",
    overview:
      "We design automated workflows that connect your tools, read unstructured inputs, make rule- or AI-based decisions, and hand off to people only when judgement is needed.",
    challenges: ["Manual data entry across systems", "Slow approvals and hand-offs", "Errors from copy-paste work", "Staff time spent on low-value tasks"],
    solution:
      "We map the process, automate each step with reliable integrations, add AI where inputs are unstructured, and keep humans in control with approval queues, audit logs and fallbacks.",
    features: [
      { title: "Process mapping", description: "Identify the steps that are safe and valuable to automate first." },
      { title: "Event-driven integrations", description: "Webhooks, queues and schedulers that keep systems in sync." },
      { title: "Human-in-the-loop", description: "Approval steps and exception queues for edge cases." },
      { title: "Monitoring", description: "Dashboards and alerts for every automated run." },
    ],
    technologies: ["n8n", "Node.js", "Python", "Redis queues", "Webhooks", "LLM APIs"],
    benefits: ["Hours saved every week", "Fewer errors", "Faster turnaround", "Consistent, auditable processes"],
    faqs: [
      { q: "What happens when the automation is unsure?", a: "It routes the case to a person with full context, so nothing is decided silently." },
    ],
    featured: true,
  },
  {
    slug: "cloud-computing-deployment",
    title: "Cloud Computing & Deployment",
    icon: "Cloud",
    tagline: "Reliable, cost-aware cloud foundations.",
    excerpt: "Plan, migrate and run workloads on AWS, Azure, GCP or regional cloud providers.",
    overview:
      "We design cloud environments that are secure by default, observable and cost-efficient — from a single VPS to multi-region deployments.",
    challenges: ["Rising, unpredictable cloud bills", "Manual, risky deployments", "Limited visibility into failures", "Security gaps in configuration"],
    solution:
      "We assess your workloads, design the right-sized architecture, automate provisioning and deployments, and set up monitoring, backups and access controls.",
    features: [
      { title: "Cloud migration", description: "Plan and execute low-downtime migrations from on-premise or between providers." },
      { title: "Infrastructure as code", description: "Reproducible environments with version-controlled configuration." },
      { title: "Cost optimisation", description: "Right-sizing, reserved capacity and storage lifecycle policies." },
      { title: "Backups & DR", description: "Automated backups and tested recovery procedures." },
    ],
    technologies: ["AWS", "Microsoft Azure", "Google Cloud", "Terraform", "Linux", "Nginx", "Cloudflare"],
    benefits: ["Predictable costs", "Faster, safer releases", "Higher availability", "Stronger security posture"],
    faqs: [{ q: "Do you support local/regional data centres?", a: "Yes. We deploy to regional providers and on-premise servers as well as hyperscalers." }],
    featured: true,
  },
  {
    slug: "saas-paas-iaas-solutions",
    title: "SaaS, PaaS & IaaS Solutions",
    icon: "Layers",
    tagline: "Turn your product idea into a subscription platform.",
    excerpt: "Multi-tenant SaaS products and platform services with billing, onboarding and tenant isolation.",
    overview:
      "We architect and build SaaS products with tenant isolation, subscription billing, usage metering and self-service onboarding, and help you choose the right IaaS/PaaS foundation.",
    challenges: ["Designing safe multi-tenancy", "Billing and plan management", "Scaling as customers grow", "Operating the platform 24/7"],
    solution:
      "We deliver a production-ready SaaS core — auth, tenants, plans, billing, admin console — and the infrastructure and runbooks to operate it.",
    features: [
      { title: "Multi-tenant architecture", description: "Shared or isolated data models chosen for your compliance needs." },
      { title: "Subscription billing", description: "Plans, trials, invoices and payment gateway integration." },
      { title: "Self-service onboarding", description: "Sign-up, workspace setup and team invitations." },
      { title: "Platform admin", description: "Tenant management, impersonation with audit, and usage analytics." },
    ],
    technologies: ["Next.js", "Node.js", "MySQL", "PostgreSQL", "Redis", "Stripe / local gateways", "Kubernetes or VPS"],
    benefits: ["Recurring revenue model", "Faster time to market", "Scalable foundation", "Lower operational risk"],
    faqs: [{ q: "Can you integrate local payment gateways?", a: "Yes, we integrate international and regional payment providers based on your market." }],
  },
  {
    slug: "devops-infrastructure-engineering",
    title: "DevOps & Infrastructure Engineering",
    icon: "GitBranch",
    tagline: "Ship faster without breaking things.",
    excerpt: "CI/CD pipelines, observability and automation that make releases routine.",
    overview: "We build delivery pipelines and operational tooling so your team can release frequently with confidence.",
    challenges: ["Manual, error-prone releases", "No staging environment", "Slow incident detection", "Configuration drift between servers"],
    solution:
      "We implement CI/CD, environment parity, automated testing gates, centralised logging, metrics and alerting, and clear rollback procedures.",
    features: [
      { title: "CI/CD pipelines", description: "Automated build, test and deploy on every change." },
      { title: "Observability", description: "Logs, metrics, traces and uptime monitoring with actionable alerts." },
      { title: "Configuration management", description: "Consistent, versioned server configuration." },
      { title: "Release strategies", description: "Blue/green and rolling deployments with instant rollback." },
    ],
    technologies: ["GitHub Actions", "GitLab CI", "Ansible", "Terraform", "Prometheus", "Grafana", "PM2", "Nginx"],
    benefits: ["More frequent releases", "Fewer production incidents", "Faster recovery", "Happier engineering teams"],
    faqs: [{ q: "Do we need containers?", a: "No. We design pipelines for VPS/PM2, bare-metal or container platforms depending on your needs." }],
  },
  {
    slug: "system-administration-it-support",
    title: "System Administration & IT Support",
    icon: "ServerCog",
    tagline: "Keep your systems healthy, patched and secure.",
    excerpt: "Proactive Linux/Windows server administration, patching, monitoring and helpdesk support.",
    overview: "We manage servers, user accounts, backups, email and endpoint security so your team can focus on the business.",
    challenges: ["Unpatched servers and software", "No backup verification", "Ad-hoc user and access management", "Slow response to IT issues"],
    solution: "We put proactive monitoring, patch schedules, verified backups and a clear support process in place, backed by documentation.",
    features: [
      { title: "Server management", description: "Linux and Windows server hardening, updates and tuning." },
      { title: "Backup management", description: "Automated, encrypted, tested backups." },
      { title: "Identity & access", description: "Account lifecycle, MFA and least-privilege access." },
      { title: "Helpdesk", description: "Ticketed support with agreed response times." },
    ],
    technologies: ["Ubuntu", "RHEL", "Windows Server", "Active Directory", "Microsoft 365", "Google Workspace"],
    benefits: ["Less downtime", "Reduced security risk", "Predictable IT costs", "Documented environment"],
    faqs: [{ q: "Do you offer on-site support?", a: "On-site availability depends on location; remote support is available for all clients." }],
  },
  {
    slug: "network-regional-infrastructure-setup",
    title: "Network & Regional Infrastructure Setup",
    icon: "Network",
    tagline: "Fast, secure connectivity across every branch.",
    excerpt: "Design and deployment of office, branch and data-centre networks, VPNs and Wi-Fi.",
    overview: "We plan and build network infrastructure for offices, multi-branch businesses and regional data centres.",
    challenges: ["Unreliable connectivity between branches", "Flat, insecure networks", "Poor Wi-Fi coverage", "No network visibility"],
    solution: "We design segmented networks, site-to-site VPNs, redundant links and centralised monitoring, and document everything.",
    features: [
      { title: "Network design", description: "VLAN segmentation, routing and firewall policies." },
      { title: "Site-to-site VPN", description: "Secure links between branches, cloud and HQ." },
      { title: "Enterprise Wi-Fi", description: "Coverage planning and controller-based management." },
      { title: "Monitoring", description: "Bandwidth, latency and device health dashboards." },
    ],
    technologies: ["MikroTik", "Cisco", "Ubiquiti", "pfSense", "WireGuard", "OpenVPN"],
    benefits: ["Reliable branch connectivity", "Better security", "Easier troubleshooting", "Room to grow"],
    faqs: [{ q: "Can you work with our existing equipment?", a: "Yes. We audit what you have and reuse it where it is fit for purpose." }],
  },
  {
    slug: "load-balancing-high-availability",
    title: "Load Balancing & High Availability",
    icon: "Gauge",
    tagline: "Stay online when it matters most.",
    excerpt: "Architectures that remove single points of failure and absorb traffic spikes.",
    overview: "We design redundant application, database and network tiers so your services keep running during failures and peak demand.",
    challenges: ["Downtime during traffic spikes", "Single-server deployments", "Database bottlenecks", "No failover plan"],
    solution: "We introduce load balancers, horizontal scaling, database replication, caching and health-checked failover, then test them.",
    features: [
      { title: "Load balancing", description: "Nginx/HAProxy or cloud load balancers with health checks." },
      { title: "Database replication", description: "Primary/replica and failover for MySQL and PostgreSQL." },
      { title: "Caching layers", description: "Redis and CDN caching to reduce load." },
      { title: "Failover testing", description: "Planned exercises to prove recovery works." },
    ],
    technologies: ["Nginx", "HAProxy", "Keepalived", "MySQL replication", "Redis", "Cloudflare"],
    benefits: ["Higher uptime", "Consistent performance", "Graceful degradation", "Confidence during peaks"],
    faqs: [{ q: "Is high availability expensive?", a: "We match the architecture to your actual uptime requirement so you don't pay for redundancy you don't need." }],
  },
  {
    slug: "erp-implementation-development",
    title: "ERP Implementation & Development",
    icon: "Boxes",
    tagline: "One system for finance, inventory, sales and operations.",
    excerpt: "Custom and modular ERP systems tailored to your industry and processes.",
    overview: "We build and implement ERP platforms covering accounting, inventory, purchasing, sales, HR and reporting — customised to your workflows.",
    challenges: ["Data scattered across departments", "Manual reconciliation", "No real-time stock or financial view", "Rigid ERP products that do not fit"],
    solution: "We deliver a modular ERP configured around your processes, migrate existing data, train your team and support adoption.",
    features: [
      { title: "Finance & accounting", description: "Ledgers, invoicing, payments and financial reports." },
      { title: "Inventory & purchasing", description: "Multi-warehouse stock, reorder levels and supplier management." },
      { title: "Sales & billing", description: "Quotations, orders, invoices and receivables." },
      { title: "Analytics", description: "Real-time dashboards across every module." },
    ],
    technologies: ["Next.js", "Laravel", "Node.js", "MySQL", "Redis", "REST APIs"],
    benefits: ["Single source of truth", "Less manual work", "Real-time visibility", "Processes that scale"],
    faqs: [{ q: "Can we start with a few modules?", a: "Yes. Most clients start with the most painful area and add modules over time." }],
    featured: true,
  },
  {
    slug: "crm-development-integration",
    title: "CRM Development & Integration",
    icon: "Users",
    tagline: "Never lose track of a customer again.",
    excerpt: "Custom CRMs and integrations that unify leads, deals, support and communication.",
    overview: "We build CRMs and integrate existing ones so sales, marketing and support work from the same customer record.",
    challenges: ["Leads lost in inboxes and spreadsheets", "No pipeline visibility", "Disconnected marketing and sales tools", "Manual follow-ups"],
    solution: "We implement pipelines, automated follow-ups, communication history and integrations with your website, email, SMS and accounting.",
    features: [
      { title: "Lead & deal pipelines", description: "Customisable stages, ownership and forecasting." },
      { title: "Omnichannel history", description: "Email, call, SMS and WhatsApp activity in one timeline." },
      { title: "Automation", description: "Reminders, assignment rules and follow-up sequences." },
      { title: "Integrations", description: "Website forms, accounting and marketing platforms." },
    ],
    technologies: ["Next.js", "Node.js", "MySQL", "Webhooks", "Email/SMS APIs"],
    benefits: ["Higher conversion", "Accountable follow-up", "Better forecasting", "Shared customer context"],
    faqs: [{ q: "Can you integrate with our existing CRM?", a: "Yes. We integrate with common CRMs via their APIs or build a custom one if it is a better fit." }],
  },
  {
    slug: "pos-system-development",
    title: "POS System Development",
    icon: "ScanBarcode",
    tagline: "Fast checkout, accurate stock, clear reports.",
    excerpt: "Point-of-sale systems for retail, restaurants and multi-branch businesses.",
    overview: "We develop POS systems that work at the counter and sync with inventory, accounting and loyalty programmes.",
    challenges: ["Slow checkout", "Stock mismatches between branches", "Limited sales reporting", "Hardware compatibility issues"],
    solution: "We deliver a POS with barcode scanning, receipt printing, offline mode, multi-branch sync and real-time reporting.",
    features: [
      { title: "Fast checkout", description: "Barcode scanning, discounts, split payments and receipts." },
      { title: "Offline mode", description: "Keep selling during connectivity loss; sync when back online." },
      { title: "Multi-branch inventory", description: "Central stock control with transfers." },
      { title: "Sales analytics", description: "Daily, product and staff-level reports." },
    ],
    technologies: ["React", "Electron or PWA", "Node.js", "MySQL", "Thermal printers", "Barcode scanners"],
    benefits: ["Shorter queues", "Accurate stock", "Fewer errors", "Better purchasing decisions"],
    faqs: [{ q: "Does it work with existing hardware?", a: "We support common receipt printers, scanners and cash drawers and will verify compatibility first." }],
  },
  {
    slug: "smart-business-automation",
    title: "Smart Business Automation",
    icon: "Bot",
    tagline: "Connected systems that run themselves.",
    excerpt: "Automate reporting, notifications, approvals and data sync across your business.",
    overview: "We connect your applications and automate routine operations — from scheduled reports to inventory alerts and invoice reminders.",
    challenges: ["Repetitive reporting", "Missed follow-ups", "Disconnected applications", "Manual reconciliation"],
    solution: "We build reliable automations with monitoring and clear ownership, starting with the highest-impact tasks.",
    features: [
      { title: "Scheduled reports", description: "Automatic daily/weekly reports to the right people." },
      { title: "Smart alerts", description: "Notifications on thresholds and anomalies." },
      { title: "Approval flows", description: "Structured, auditable approvals." },
      { title: "Data sync", description: "Keep systems consistent automatically." },
    ],
    technologies: ["Node.js", "Python", "n8n", "Cron / queues", "Email/SMS/WhatsApp APIs"],
    benefits: ["Time saved", "Fewer mistakes", "Faster responses", "Scalable operations"],
    faqs: [{ q: "How quickly can we see results?", a: "Simple automations are often live within weeks; we prioritise quick wins first." }],
  },
  {
    slug: "website-web-application-development",
    title: "Website & Web Application Development",
    icon: "Globe",
    tagline: "Fast, secure, search-friendly web experiences.",
    excerpt: "Corporate websites, portals and web apps with modern performance and CMS control.",
    overview: "We design and build websites and web applications that load fast, rank well and are easy for your team to manage.",
    challenges: ["Slow, outdated websites", "Hard-to-update content", "Poor mobile experience", "Low search visibility"],
    solution: "We deliver responsive, accessible, SEO-ready sites with a CMS your team can use, backed by solid hosting and analytics.",
    features: [
      { title: "Responsive design", description: "Great experience on every screen size." },
      { title: "CMS", description: "Edit pages, blogs and media without a developer." },
      { title: "SEO foundations", description: "Metadata, sitemaps, structured data and performance." },
      { title: "Web apps", description: "Portals, dashboards and booking systems." },
    ],
    technologies: ["Next.js", "React", "TypeScript", "Tailwind CSS", "MySQL", "Headless CMS"],
    benefits: ["More qualified leads", "Faster load times", "Easier content updates", "Stronger brand"],
    faqs: [{ q: "Will we be able to update the website ourselves?", a: "Yes. Every site comes with an admin panel and training." }],
  },
  {
    slug: "mobile-application-development",
    title: "Mobile Application Development",
    icon: "Smartphone",
    tagline: "Apps your customers and staff actually use.",
    excerpt: "Cross-platform and native mobile apps for iOS and Android.",
    overview: "We build mobile apps for customers, field staff and internal teams, connected to your existing systems.",
    challenges: ["Separate iOS and Android costs", "Poor offline experience", "Complex backend integration", "App store release hurdles"],
    solution: "We use cross-platform frameworks where they fit, native where needed, and handle APIs, push notifications and store releases.",
    features: [
      { title: "Cross-platform", description: "One codebase for iOS and Android with native performance." },
      { title: "Offline-first", description: "Local storage and sync for field use." },
      { title: "Push notifications", description: "Targeted, timely engagement." },
      { title: "Store publishing", description: "Release management for App Store and Google Play." },
    ],
    technologies: ["React Native", "Flutter", "Kotlin", "Swift", "Firebase Cloud Messaging"],
    benefits: ["Direct customer channel", "Mobile workforce productivity", "Lower build cost", "Faster updates"],
    faqs: [{ q: "Native or cross-platform?", a: "We recommend based on performance, device features and budget — most business apps suit cross-platform." }],
  },
  {
    slug: "digital-marketing-business-growth",
    title: "Digital Marketing & Business Growth",
    icon: "TrendingUp",
    tagline: "Turn attention into customers, and customers into sales.",
    excerpt: "Full-funnel digital marketing: SEO, social media, paid ads, content, email and WhatsApp, and conversion optimisation, all focused on sales.",
    overview:
      "We build a complete growth engine for your business. First we help customers find you (search, social and ads). Then we turn visitors into leads (offers, landing pages and conversion optimisation). Finally we turn leads into repeat sales (follow-up automation, retargeting and CRM). Every step is tracked, so you can see exactly what brings in revenue.",
    challenges: [
      "Low organic traffic",
      "Social media that gets likes but no sales",
      "Ad spend with unclear returns",
      "Leads that never get followed up",
      "No conversion tracking",
      "Inconsistent brand presence",
    ],
    solution:
      "We start with your offer and your ideal customer and set up proper tracking. Then we run a full-funnel plan: attract, convert, nurture and retain. We test continuously, report honestly and put more budget behind whatever produces sales.",
    features: [
      { title: "Sales funnel strategy", description: "Map the journey from first view to purchase and repeat order, and fix where customers drop off." },
      { title: "Search engine optimisation", description: "Technical SEO, keyword strategy, on-page optimisation and local SEO with Google Business Profile." },
      { title: "Social media marketing", description: "Content calendars, reels and short video, and community management on Facebook, Instagram, LinkedIn and TikTok." },
      { title: "Paid advertising", description: "Meta (Facebook and Instagram), Google Search and YouTube ads with precise targeting and A/B-tested creatives." },
      { title: "Retargeting", description: "Win back visitors who showed interest but didn't buy, using pixel-based custom audiences." },
      { title: "Landing pages & conversion optimisation", description: "Clear offers, fast landing pages and A/B tests that turn more visitors into enquiries and orders." },
      { title: "Content marketing", description: "Articles, case studies and videos that answer buyers' questions and build trust." },
      { title: "Email, SMS & WhatsApp marketing", description: "Automated follow-up sequences, offers, broadcasts and abandoned-cart reminders." },
      { title: "Lead management & CRM", description: "Capture, qualify and follow up every lead so no enquiry is lost." },
      { title: "Marketing automation & chatbots", description: "Messenger and WhatsApp auto-replies, chatbots and AI-assisted content that respond instantly." },
      { title: "Brand & creative", description: "Consistent brand voice, visuals and ad creative that stand out in the feed." },
      { title: "Reputation & reviews", description: "Encourage and manage customer reviews that build trust before people buy." },
      { title: "Influencer & partnership marketing", description: "Reach new audiences through the right creators and partner businesses." },
      { title: "Analytics & reporting", description: "GA4, Meta Pixel and Conversions API, and dashboards that connect spend to leads and revenue." },
    ],
    technologies: [
      "Google Analytics 4",
      "Google Tag Manager",
      "Search Console",
      "Google Business Profile",
      "Google Ads",
      "Meta Ads Manager",
      "Meta Pixel & Conversions API",
      "Meta Business Suite",
      "WhatsApp Business",
      "Looker Studio",
      "Mailchimp",
    ],
    benefits: ["More qualified leads", "Higher conversion rate", "Lower cost per sale", "Measurable ROI", "Stronger brand", "More repeat customers"],
    faqs: [
      { q: "Do you guarantee rankings?", a: "No ethical agency can guarantee rankings. We commit to best practice and transparent reporting." },
      { q: "How soon will we see results?", a: "Paid ads can bring enquiries within days. SEO and content usually take three to six months to build momentum, so we often run both together." },
      { q: "Can you work with a small budget?", a: "Yes. We start with the channels most likely to produce sales for your budget, measure the results and scale what works." },
      { q: "Which platforms do you use?", a: "Facebook, Instagram, Google Search, YouTube, LinkedIn, TikTok, email and WhatsApp. We choose them based on where your customers actually are." },
    ],
  },
  {
    slug: "it-consulting-digital-transformation",
    title: "IT Consulting & Digital Transformation",
    icon: "Compass",
    tagline: "A clear technology roadmap for your business.",
    excerpt: "Strategy, architecture reviews and transformation roadmaps aligned with business goals.",
    overview: "We help leadership teams decide what to build, buy, modernise or retire — and plan the path to get there.",
    challenges: ["Unclear technology priorities", "Legacy systems slowing growth", "Vendor lock-in", "Security and compliance uncertainty"],
    solution: "We assess your current state, define a target architecture and prioritised roadmap, and can support delivery end-to-end.",
    features: [
      { title: "Technology assessment", description: "Systems, processes, risks and costs." },
      { title: "Architecture design", description: "Target architecture and integration strategy." },
      { title: "Roadmap", description: "Phased, budgeted plan with quick wins." },
      { title: "Vendor selection", description: "Independent evaluation of products and partners." },
    ],
    technologies: ["Enterprise architecture", "Cloud strategy", "Security frameworks", "Process mapping"],
    benefits: ["Confident decisions", "Lower risk", "Aligned teams", "Faster transformation"],
    faqs: [{ q: "Can you work with our in-house IT team?", a: "Yes. We frequently partner with internal teams and transfer knowledge as we go." }],
  },
];

export const processSteps = defaultProcess;

export type SeedSolution = {
  slug: string;
  title: string;
  icon: string;
  excerpt: string;
  overview: string;
  modules: Item[];
  benefits: string[];
  featured?: boolean;
};

const customizationText =
  "Every deployment is configured around your workflows, approval chains, reports and integrations. We start from proven modules and engineer the differences that make your business unique — so you never have to bend your operations to fit the software.";

export const solutionCustomization = customizationText;

export const solutions: SeedSolution[] = [
  {
    slug: "enterprise-resource-planning",
    title: "Enterprise Resource Planning (ERP)",
    icon: "Boxes",
    excerpt: "Unify finance, inventory, purchasing, sales and HR in one configurable platform.",
    overview: "A modular ERP that connects every department and gives leadership a real-time view of the business.",
    modules: [
      { title: "Accounting", description: "General ledger, AR/AP, bank reconciliation and financial statements." },
      { title: "Inventory", description: "Multi-location stock, batches, valuation and transfers." },
      { title: "Procurement", description: "Requisitions, purchase orders and supplier management." },
      { title: "Sales", description: "Quotations, orders, invoicing and collections." },
    ],
    benefits: ["Single source of truth", "Real-time reporting", "Less manual reconciliation"],
    featured: true,
  },
  {
    slug: "customer-relationship-management",
    title: "Customer Relationship Management (CRM)",
    icon: "Users",
    excerpt: "Manage leads, deals, customers and support from one timeline.",
    overview: "A CRM tailored to your sales motion with automation and integrations to your channels.",
    modules: [
      { title: "Lead management", description: "Capture, score and assign leads automatically." },
      { title: "Pipelines", description: "Custom stages, forecasting and win/loss tracking." },
      { title: "Customer 360", description: "Communication history, documents and tickets." },
      { title: "Campaigns", description: "Segmented email/SMS campaigns with tracking." },
    ],
    benefits: ["Higher conversion", "Better follow-up", "Clear forecasting"],
    featured: true,
  },
  {
    slug: "point-of-sale",
    title: "Point of Sale (POS)",
    icon: "ScanBarcode",
    excerpt: "Fast, reliable checkout with inventory sync and multi-branch reporting.",
    overview: "Retail and restaurant POS with offline support, hardware integration and central control.",
    modules: [
      { title: "Checkout", description: "Barcode, discounts, split payments and receipts." },
      { title: "Inventory sync", description: "Real-time stock across branches." },
      { title: "Loyalty", description: "Points, vouchers and customer profiles." },
      { title: "Reports", description: "Sales, product and staff performance." },
    ],
    benefits: ["Faster checkout", "Accurate stock", "Better purchasing"],
    featured: true,
  },
  {
    slug: "hospital-healthcare-management",
    title: "Hospital & Healthcare Management",
    icon: "HeartPulse",
    excerpt: "Patient records, appointments, billing, pharmacy and lab in one secure system.",
    overview: "A healthcare management platform designed around clinical and administrative workflows with strict access control.",
    modules: [
      { title: "Patient records", description: "Registration, history and secure medical records." },
      { title: "Appointments", description: "Doctor schedules, queues and reminders." },
      { title: "Billing", description: "Services, packages, insurance and payments." },
      { title: "Pharmacy & lab", description: "Prescriptions, stock, tests and results." },
    ],
    benefits: ["Shorter waiting times", "Accurate billing", "Secure patient data"],
  },
  {
    slug: "education-management",
    title: "Education Management Systems",
    icon: "GraduationCap",
    excerpt: "Admissions, attendance, exams, fees and parent communication.",
    overview: "A school/college management system connecting administrators, teachers, students and parents.",
    modules: [
      { title: "Admissions", description: "Online applications and enrolment." },
      { title: "Academics", description: "Classes, timetables, attendance and exams." },
      { title: "Fees", description: "Invoices, online payments and dues tracking." },
      { title: "Portals", description: "Student and parent portals with notifications." },
    ],
    benefits: ["Less paperwork", "Transparent communication", "Faster fee collection"],
  },
  {
    slug: "hotel-hospitality-management",
    title: "Hotel & Hospitality Management",
    icon: "Hotel",
    excerpt: "Reservations, front office, housekeeping, billing and analytics for hotels and resorts.",
    overview:
      "A cloud property management system for hotels covering the full guest journey — from booking to check-out — with real-time availability and management analytics.",
    modules: [
      { title: "Reservations", description: "Room inventory, rates and real-time availability." },
      { title: "Front office", description: "Check-in, check-out, guest profiles and folios." },
      { title: "Housekeeping", description: "Room status, task assignment and maintenance." },
      { title: "Analytics", description: "Occupancy, revenue and operational dashboards." },
    ],
    benefits: ["Fewer booking errors", "Faster front-desk operations", "Data-driven revenue decisions"],
    featured: true,
  },
  {
    slug: "retail-ecommerce-management",
    title: "Retail & E-commerce Management",
    icon: "ShoppingBag",
    excerpt: "Online store, POS and inventory working as one.",
    overview: "Unified commerce: storefront, orders, inventory, payments and delivery integrated with your physical stores.",
    modules: [
      { title: "Storefront", description: "Fast, SEO-friendly online shop." },
      { title: "Order management", description: "Orders, returns and fulfilment." },
      { title: "Omnichannel inventory", description: "Stock shared across online and offline." },
      { title: "Payments & delivery", description: "Gateway and courier integrations." },
    ],
    benefits: ["More sales channels", "Accurate stock", "Better customer experience"],
  },
  {
    slug: "real-estate-management",
    title: "Real Estate Management",
    icon: "Building2",
    excerpt: "Property listings, tenants, leases, rent collection and maintenance.",
    overview: "Manage portfolios, tenants and transactions for developers, agencies and property managers.",
    modules: [
      { title: "Listings", description: "Projects, units and availability." },
      { title: "Sales & leasing", description: "Bookings, installments and contracts." },
      { title: "Tenants", description: "Rent invoicing, collection and communication." },
      { title: "Maintenance", description: "Requests, vendors and work orders." },
    ],
    benefits: ["Faster collections", "Clear portfolio view", "Better tenant service"],
  },
  {
    slug: "inventory-supply-chain",
    title: "Inventory & Supply Chain Management",
    icon: "Truck",
    excerpt: "Warehouses, procurement, logistics and demand planning.",
    overview: "End-to-end visibility from supplier to customer with automation and forecasting.",
    modules: [
      { title: "Warehousing", description: "Bins, batches, serials and stock counts." },
      { title: "Procurement", description: "Supplier management and purchase automation." },
      { title: "Logistics", description: "Shipments, routes and delivery tracking." },
      { title: "Planning", description: "Reorder points and demand forecasting." },
    ],
    benefits: ["Lower carrying cost", "Fewer stock-outs", "Faster fulfilment"],
  },
  {
    slug: "hr-payroll-management",
    title: "HR & Payroll Management",
    icon: "IdCard",
    excerpt: "Employees, attendance, leave, payroll and performance.",
    overview: "A complete HR platform from hiring to payroll with self-service for employees.",
    modules: [
      { title: "Employee records", description: "Profiles, documents and org structure." },
      { title: "Attendance & leave", description: "Device integration, shifts and approvals." },
      { title: "Payroll", description: "Salary rules, deductions, payslips and bank files." },
      { title: "Performance", description: "Goals, reviews and appraisals." },
    ],
    benefits: ["Accurate payroll", "Less admin work", "Employee self-service"],
  },
  {
    slug: "business-intelligence-analytics",
    title: "Business Intelligence & Analytics",
    icon: "BarChart3",
    excerpt: "Dashboards and data pipelines that turn data into decisions.",
    overview: "Consolidate data from your systems into a reliable warehouse with dashboards for every team.",
    modules: [
      { title: "Data integration", description: "Pipelines from ERP, CRM, POS and spreadsheets." },
      { title: "Data warehouse", description: "Clean, modelled, query-ready data." },
      { title: "Dashboards", description: "KPIs for leadership and operations." },
      { title: "Alerts", description: "Notifications when metrics move." },
    ],
    benefits: ["Faster decisions", "One version of the truth", "Self-service reporting"],
  },
  {
    slug: "ai-powered-business-solutions",
    title: "AI-powered Business Solutions",
    icon: "Sparkles",
    excerpt: "Assistants, document AI and predictive analytics embedded in your operations.",
    overview: "Bring AI into everyday workflows with secure, evaluated features built on your own data.",
    modules: [
      { title: "AI assistants", description: "Answer staff and customer questions from your knowledge base." },
      { title: "Document AI", description: "Extract and validate data from documents." },
      { title: "Predictions", description: "Demand, churn and risk forecasting." },
      { title: "Automation", description: "AI-assisted triage, routing and drafting." },
    ],
    benefits: ["Productivity gains", "Faster service", "Smarter decisions"],
    featured: true,
  },
  {
    slug: "custom-enterprise-solutions",
    title: "Custom Enterprise Solutions",
    icon: "Puzzle",
    excerpt: "Anything your business needs, engineered from the ground up.",
    overview: "When no product fits, we design and build enterprise systems specific to your organisation.",
    modules: [
      { title: "Discovery", description: "Deep analysis of processes and requirements." },
      { title: "Architecture", description: "Scalable, secure system design." },
      { title: "Delivery", description: "Iterative development with your stakeholders." },
      { title: "Operations", description: "Hosting, monitoring and support." },
    ],
    benefits: ["Perfect fit", "Competitive advantage", "Full ownership"],
  },
];

export const industries: { slug: string; title: string; icon: string; excerpt: string; challenges: string[]; approach: Item[] }[] = [
  {
    slug: "healthcare",
    title: "Healthcare",
    icon: "HeartPulse",
    excerpt: "Secure systems for hospitals, clinics, diagnostics and pharmacies.",
    challenges: ["Protecting sensitive patient data", "Long patient waiting times", "Fragmented billing and records"],
    approach: [
      { title: "Integrated HMS", description: "Patients, appointments, billing, pharmacy and lab connected." },
      { title: "Access control", description: "Role-based access and audit trails for every record." },
    ],
  },
  {
    slug: "education",
    title: "Education",
    icon: "GraduationCap",
    excerpt: "Digital campuses for schools, colleges and training centres.",
    challenges: ["Manual admissions and attendance", "Fee collection delays", "Parent communication gaps"],
    approach: [
      { title: "Education ERP", description: "Admissions to results in one system." },
      { title: "Portals & apps", description: "Student and parent self-service." },
    ],
  },
  {
    slug: "banking-financial-services",
    title: "Banking & Financial Services",
    icon: "Landmark",
    excerpt: "Secure, compliant platforms for financial institutions and fintechs.",
    challenges: ["Strict security and compliance", "Legacy core systems", "Fraud and risk monitoring"],
    approach: [
      { title: "Secure engineering", description: "Hardened architectures and audit-ready logging." },
      { title: "Automation & AI", description: "Document processing and risk scoring." },
    ],
  },
  {
    slug: "retail-ecommerce",
    title: "Retail & E-commerce",
    icon: "ShoppingBag",
    excerpt: "Unified commerce across stores, online and marketplaces.",
    challenges: ["Stock mismatches", "Disconnected channels", "Thin margins"],
    approach: [
      { title: "POS + inventory", description: "Real-time stock across all channels." },
      { title: "E-commerce", description: "Fast storefronts integrated with operations." },
    ],
  },
  {
    slug: "hospitality",
    title: "Hospitality",
    icon: "Hotel",
    excerpt: "Property management, reservations and guest experience technology.",
    challenges: ["Overbookings and manual reservations", "Slow check-in/out", "Limited revenue insight"],
    approach: [
      { title: "Hotel ERP / PMS", description: "Reservations, front office and analytics in one platform." },
      { title: "Automation", description: "Notifications, reports and routine tasks automated." },
    ],
  },
  {
    slug: "real-estate",
    title: "Real Estate",
    icon: "Building2",
    excerpt: "Systems for developers, agencies and property managers.",
    challenges: ["Tracking installments and leases", "Disorganised listings", "Maintenance backlog"],
    approach: [
      { title: "Property platform", description: "Listings, sales, leasing and maintenance together." },
      { title: "Customer portals", description: "Self-service for buyers and tenants." },
    ],
  },
  {
    slug: "manufacturing",
    title: "Manufacturing",
    icon: "Factory",
    excerpt: "Production planning, quality and supply chain visibility.",
    challenges: ["Production planning complexity", "Raw material shortages", "Quality tracking"],
    approach: [
      { title: "Manufacturing ERP", description: "BOMs, work orders and costing." },
      { title: "Shop-floor data", description: "Real-time production and quality dashboards." },
    ],
  },
  {
    slug: "logistics",
    title: "Logistics",
    icon: "Truck",
    excerpt: "Fleet, warehouse and delivery management.",
    challenges: ["Route inefficiency", "Shipment visibility", "Manual dispatch"],
    approach: [
      { title: "Logistics platform", description: "Orders, dispatch, tracking and proof of delivery." },
      { title: "Optimisation", description: "Route and load planning." },
    ],
  },
  {
    slug: "corporate-enterprise",
    title: "Corporate & Enterprise",
    icon: "Briefcase",
    excerpt: "Digital transformation for established organisations.",
    challenges: ["Legacy systems", "Siloed departments", "Security and governance"],
    approach: [
      { title: "Transformation roadmap", description: "Prioritised modernisation plans." },
      { title: "Integration", description: "Connecting systems into one platform." },
    ],
  },
  {
    slug: "startups-smes",
    title: "Startups & SMEs",
    icon: "Rocket",
    excerpt: "From MVP to scale — technology that grows with you.",
    challenges: ["Limited budget", "Speed to market", "Scaling after product-market fit"],
    approach: [
      { title: "MVP development", description: "Launch quickly with a solid foundation." },
      { title: "Fractional CTO", description: "Technical leadership when you need it." },
    ],
  },
];

export const projectCategories = [
  { slug: "software-development", name: "Software Development" },
  { slug: "ai-automation", name: "AI & Automation" },
  { slug: "cloud-devops", name: "Cloud & DevOps" },
  { slug: "erp-crm", name: "ERP & CRM" },
  { slug: "pos-systems", name: "POS Systems" },
  { slug: "web-applications", name: "Web Applications" },
  { slug: "mobile-applications", name: "Mobile Applications" },
  { slug: "infrastructure", name: "Infrastructure" },
];

export const blogCategories = [
  { slug: "artificial-intelligence", name: "Artificial Intelligence" },
  { slug: "software-engineering", name: "Software Engineering" },
  { slug: "cloud-devops", name: "Cloud & DevOps" },
  { slug: "business-automation", name: "Business Automation" },
  { slug: "company-news", name: "Company News" },
];

/** Axios Station's own Hotel ERP — a real product, described only from what is publicly visible. */
export const hotelErpProject = {
  slug: "axios-station-hotel-erp",
  title: "Axios Station Hotel ERP — Smart Hotel Management",
  summary:
    "An all-in-one, cloud-based hotel management platform built by Axios Station that brings reservations, front-office operations and management analytics into a single secure system.",
  description:
    "<p>Axios Station Hotel ERP is our in-house property management platform for hotels and resorts. It replaces manual registers and disconnected spreadsheets with one system where reservations, front-desk work and reporting share the same live data.</p>" +
    "<h3>Core modules</h3><ul>" +
    "<li><strong>Reservations</strong> — manage bookings and room availability in real time.</li>" +
    "<li><strong>Front Office</strong> — streamline guest interactions, check-in/check-out and front-desk operations.</li>" +
    "<li><strong>Analytics Dashboard</strong> — data-driven decisions with operational and revenue insights.</li>" +
    "<li><strong>Security &amp; Reliability</strong> — role-based accounts (e.g. administrator and reception) protecting hotel data.</li>" +
    "</ul><h3>Platform</h3><ul>" +
    "<li>Cloud based — access hotel data anytime, anywhere.</li>" +
    "<li>Multi-device — works on desktop, tablet and mobile.</li>" +
    "<li>Single sign-on ready — Google and Microsoft sign-in options.</li>" +
    "</ul>",
  challenges:
    "Hotels commonly run reservations, front desk and reporting in separate tools or on paper, which leads to double bookings, slow check-ins and little visibility into occupancy and revenue.",
  solutions:
    "We engineered a unified, web-based hotel ERP: a real-time reservation engine, a front-office workspace for reception staff, and a management dashboard — with role-based access so each team sees exactly what they need. Routine work such as availability updates and reporting is automated by the system instead of being done by hand.",
  results:
    "The platform is live and in operation. Hotel-specific outcome metrics will be published here once verified with the property.",
  technologies: ["Next.js", "React", "TypeScript", "Role-based access control", "Cloud hosting"],
};

/**
 * Client deployment: Hotel Sea Paradise, Cox's Bazar. Only facts confirmed by
 * Axios Station are stated; metrics are added once verified with the client.
 */
export const seaParadiseProject = {
  slug: "hotel-sea-paradise-employee-management",
  title: "Hotel Sea Paradise — Employee Management with Fingerprint Attendance",
  clientName: "Hotel Sea Paradise, Cox's Bazar",
  summary:
    "Axios Station's Employee Management Software runs in daily operation at Hotel Sea Paradise in Cox's Bazar, integrated with ZKTeco fingerprint attendance terminals and backed by our ongoing support.",
  description:
    "<p>Hotel Sea Paradise in Cox's Bazar uses Axios Station's Employee Management Software to manage its staff. We integrated the hotel's ZKTeco fingerprint attendance terminals with the software, so attendance comes straight from biometric punches instead of manual registers.</p>" +
    "<h3>What we delivered</h3><ul>" +
    "<li><strong>Employee Management Software</strong> — a central system for the hotel's staff information and day-to-day HR work.</li>" +
    "<li><strong>ZKTeco fingerprint attendance integration</strong> — punches recorded on the fingerprint terminals are brought into the software as attendance records.</li>" +
    "<li><strong>Deployment &amp; ongoing support</strong> — Axios Station installed the system on site and continues to support the hotel's team.</li>" +
    "</ul>",
  challenges:
    "Hotels run around the clock with staff across many departments and shifts. Recording attendance by hand is slow, error-prone and hard to verify, and attendance data kept apart from staff records makes reporting difficult.",
  solutions:
    "We deployed our Employee Management Software for the hotel and connected it to ZKTeco fingerprint terminals, so each employee's attendance is captured biometrically and stored alongside their records. Axios Station provides continuing support to keep the system and devices running smoothly.",
  results:
    "The system is live and in daily use at Hotel Sea Paradise, with ongoing support from Axios Station. Measured outcomes will be published here once verified with the hotel.",
  technologies: ["Employee Management Software", "ZKTeco fingerprint terminals", "Biometric attendance integration", "On-site deployment & support"],
  coverAlt: "Illustration of an employee management attendance dashboard with fingerprint punches synced from biometric terminals",
  gallery: [
    {
      url: "/images/portfolio/zkteco-fingerprint-attendance-flow.webp",
      alt: "Illustration of the integration flow from a ZKTeco fingerprint terminal to the Employee Management Software",
      caption: "How fingerprint punches flow into the Employee Management Software (illustration).",
    },
  ],
};

/** Team as provided by Axios Station. Photos, phones and social links are added in Admin → Team. */
export const teamMembers: {
  slug: string;
  name: string;
  position: string;
  department: string;
  experience?: string;
  bio: string;
  skills: string[];
  email?: string;
}[] = [
  {
    slug: "md-tariquzzaman-tanib",
    name: "Md. Tariquzzaman Tanib",
    position: "Chief Executive Officer (CEO)",
    department: "Leadership",
    experience: "16+ years",
    bio: "Tariquzzaman leads Axios Station. He brings 16 years of professional experience with Oracle systems, AWS cloud infrastructure deployment, Oracle Solaris, KVM virtualisation and enterprise cloud systems, and currently also works at Express System Limited.",
    skills: ["Oracle Systems", "AWS Cloud Infrastructure", "Oracle Solaris", "KVM Virtualisation", "Cloud Architecture", "Enterprise Systems"],
  },
  {
    slug: "md-sabbir-ahmed",
    name: "Md. Sabbir Ahmed",
    position: "Chief Technology Officer (CTO)",
    department: "Leadership",
    experience: "4+ years",
    bio: "Sabbir leads technology at Axios Station. A software and app developer with more than 4 years of experience, he plans and builds software products with a strong focus on security in the cloud. He currently also works at BJIT.",
    skills: ["Software Development", "App Development", "Project Planning", "Cloud Security"],
  },
  {
    slug: "muhammad-tahamid-zoayed",
    name: "Muhammad Tahamid Zoayed",
    position: "AI Engineer & Business Analyst",
    department: "AI Engineering",
    bio: "Tahamid connects business needs with AI. He analyses requirements and workflows, then designs AI-powered solutions that fit the way each business actually works.",
    skills: ["AI Engineering", "Business Analysis", "Requirements Analysis", "Process Automation"],
  },
  {
    slug: "md-al-amin-shakil",
    name: "Md. Al Amin Shakil",
    position: "IT & System Security Engineer",
    department: "Security Engineering",
    bio: "Al Amin keeps the systems behind our projects secure and reliable, from servers and networks to access control and hardening. He currently also works at ULKASEMI.",
    skills: ["System Security", "IT Infrastructure", "Network Security", "Server Hardening", "Access Control"],
    email: "mdalaminshakil31@gmail.com",
  },
  {
    slug: "amit-mojumdar",
    name: "Amit Mojumdar",
    position: "QA Engineer",
    department: "Quality Assurance",
    bio: "Amit makes sure what we ship works. He plans and runs testing so every release is reliable, and currently also works at a renowned Australian company.",
    skills: ["Software Testing", "Quality Assurance", "Test Planning", "Bug Tracking"],
  },
  {
    slug: "golam-rabbani",
    name: "Golam Rabbani",
    position: "Digital Marketing Specialist",
    department: "Digital Marketing",
    bio: "Rabbani turns a business's online presence into sales. He plans full-funnel campaigns across social media, search and paid ads, builds offers and landing pages that convert, and follows up with retargeting and email or WhatsApp campaigns. Every step is measured, so marketing spend is tied to real customers.",
    skills: [
      "Sales Funnel Strategy",
      "Meta (Facebook & Instagram) Ads",
      "Google Ads",
      "SEO & Local SEO",
      "Social Media Marketing",
      "Content Marketing",
      "Conversion Optimisation",
      "Email & WhatsApp Marketing",
      "Analytics & Reporting",
    ],
  },
];

export const milestones = [
  { title: "2024 — Axios Station founded", description: "Started with a mission to engineer intelligent, reliable software that adapts to each business." },
  {
    title: "Live at Hotel Sea Paradise, Cox's Bazar",
    description: "Deployed our Employee Management Software with ZKTeco fingerprint attendance integration, and continue to support the hotel's team.",
  },
  { title: "Axios Station Hotel ERP", description: "Built our cloud-based hotel management platform for reservations, front office and analytics." },
  { title: "2026 — Two years of building", description: "Growing our services across software, AI, cloud and automation." },
];

export const homepageSections: {
  type: string;
  title?: string;
  subtitle?: string;
  description?: string;
  ctaLabel?: string;
  ctaHref?: string;
  cta2Label?: string;
  cta2Href?: string;
  data?: Record<string, unknown>;
}[] = [
  {
    type: "hero",
    title: "Build Your Dream Here.",
    subtitle: "Transforming Business Ideas Into Intelligent Digital Solutions.",
    description:
      "From custom software development and AI integration to cloud infrastructure and intelligent business automation, Axios Station empowers businesses with technology that drives measurable growth.",
    ctaLabel: "Book a Free Consultation",
    ctaHref: "/contact",
    cta2Label: "Explore Our Solutions",
    cta2Href: "/solutions",
    data: { list: ["AI Intelligence", "Cloud Infrastructure", "Connected Systems", "Automation Workflows", "Business Analytics"] },
  },
  {
    type: "intro",
    subtitle: "Who we are",
    title: "Technology engineered around your business",
    description:
      "We believe every business deserves technology that works for its unique needs. Our mission is to engineer intelligent, scalable and reliable solutions that simplify operations, accelerate growth and create lasting business value.",
    data: {
      list: ["Custom-built, never one-size-fits-all", "AI-first engineering mindset", "Secure, scalable architecture", "Long-term partnership and support"],
      stats: [
        { label: "Founded", value: "2024" },
        { label: "Years building", value: "2+" },
      ],
    },
  },
  {
    type: "showcase",
    subtitle: "In live operation",
    title: "Running every day at Hotel Sea Paradise, Cox's Bazar",
    description:
      "Our Employee Management Software manages the hotel's staff, with attendance captured by ZKTeco fingerprint terminals. Axios Station deployed it and keeps supporting it.",
    ctaLabel: "Read the case study",
    ctaHref: "/portfolio/hotel-sea-paradise-employee-management",
    cta2Label: "Start your project",
    cta2Href: "/contact",
    data: {
      list: [
        "Employee Management Software in daily use",
        "ZKTeco fingerprint attendance, integrated end to end",
        "On-site deployment and ongoing support",
      ],
    },
  },
  { type: "services", subtitle: "What we do", title: "Core services", description: "End-to-end engineering across software, AI, cloud and infrastructure.", ctaLabel: "All services", ctaHref: "/services", data: { limit: 6 } },
  {
    type: "capabilities",
    subtitle: "Capabilities",
    title: "Technology capabilities",
    description: "Deep expertise across the modern technology stack.",
    data: {
      items: [
        { title: "Artificial Intelligence", description: "LLM integration, retrieval-augmented assistants, document AI and predictive models." },
        { title: "Cloud & Infrastructure", description: "Cloud architecture, Linux servers, networks, load balancing and high availability." },
        { title: "Software Engineering", description: "Web, mobile and enterprise platforms built with modern, maintainable stacks." },
        { title: "Automation", description: "Workflow automation, integrations and event-driven systems." },
        { title: "Data & Analytics", description: "Pipelines, warehouses and dashboards for decision-making." },
        { title: "Security", description: "Secure-by-design development, hardening and access control." },
      ],
    },
  },
  {
    type: "solutions",
    subtitle: "Business solutions",
    title: "We don't force your business to adapt to software.",
    description: "We engineer software that adapts to your business.",
    ctaLabel: "Explore solutions",
    ctaHref: "/solutions",
    data: { limit: 6 },
  },
  { type: "industries", subtitle: "Industries", title: "Industries we serve", description: "Domain-aware solutions for the sectors we know.", ctaLabel: "All industries", ctaHref: "/industries" },
  { type: "projects", subtitle: "Portfolio", title: "Featured projects", description: "A selection of platforms we have engineered.", ctaLabel: "View portfolio", ctaHref: "/portfolio", data: { limit: 3 } },
  {
    type: "why",
    subtitle: "Why Axios Station",
    title: "Why choose Axios Station",
    data: {
      items: [
        { title: "Business-first engineering", description: "We start from your goals and workflows, not from a product we want to sell." },
        { title: "End-to-end delivery", description: "Strategy, design, development, infrastructure and support under one roof." },
        { title: "Security by default", description: "Access control, audit trails and hardened infrastructure in every project." },
        { title: "Transparent process", description: "Regular demos, clear communication and no surprises." },
        { title: "Built to scale", description: "Architectures that grow with your users, data and team." },
        { title: "Long-term partnership", description: "We stay with you after launch to support and evolve your systems." },
      ],
    },
  },
  { type: "process", subtitle: "How we work", title: "Our development process", data: { items: defaultProcess } },
  { type: "team", subtitle: "Our people", title: "Team expertise", description: "Cloud, software, AI, security, QA and marketing specialists who care about outcomes.", ctaLabel: "Meet the team", ctaHref: "/team", data: { limit: 4 } },
  { type: "testimonials", subtitle: "Testimonials", title: "What our clients say", data: { limit: 6 } },
  {
    type: "techstack",
    subtitle: "Technology stack",
    title: "Tools we build with",
    data: {
      items: [
        { title: "Frontend", description: "React, Next.js, TypeScript, Tailwind CSS, React Native, Flutter" },
        { title: "Backend", description: "Node.js, Python, Laravel, REST & GraphQL APIs" },
        { title: "Data", description: "MySQL, PostgreSQL, Redis, Elasticsearch" },
        { title: "AI", description: "OpenAI, Anthropic Claude, LangChain, vector databases" },
        { title: "Cloud & DevOps", description: "AWS, Azure, Google Cloud, Linux, Nginx, PM2, Terraform, GitHub Actions" },
        { title: "Networking", description: "MikroTik, Cisco, Ubiquiti, WireGuard, HAProxy" },
      ],
    },
  },
  { type: "blog", subtitle: "Insights", title: "Blog & insights", ctaLabel: "Read the blog", ctaHref: "/blog", data: { limit: 3 } },
  {
    type: "cta",
    title: "Whatever your business needs, Axios Station engineers the technology to make it happen.",
    description: "Tell us about your idea or challenge. We'll respond with practical next steps — no obligation.",
    ctaLabel: "Book a Free Consultation",
    ctaHref: "/contact",
    cta2Label: "View our work",
    cta2Href: "/portfolio",
  },
  { type: "newsletter", title: "Insights in your inbox", description: "Occasional articles on AI, software engineering and automation. No spam — unsubscribe anytime." },
];

export const headerNav: { label: string; href: string; children?: { label: string; href: string }[] }[] = [
  { label: "Services", href: "/services" },
  { label: "Solutions", href: "/solutions" },
  { label: "Industries", href: "/industries" },
  { label: "Portfolio", href: "/portfolio" },
  {
    label: "Company",
    href: "/about",
    children: [
      { label: "About Us", href: "/about" },
      { label: "Our Team", href: "/team" },
      { label: "Blog", href: "/blog" },
    ],
  },
  { label: "Contact", href: "/contact" },
];

export const footerNavs: { key: string; name: string; items: { label: string; href: string }[] }[] = [
  {
    key: "footer-company",
    name: "Company",
    items: [
      { label: "About Us", href: "/about" },
      { label: "Our Team", href: "/team" },
      { label: "Portfolio", href: "/portfolio" },
      { label: "Blog", href: "/blog" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    key: "footer-services",
    name: "Services",
    items: [
      { label: "Custom Software", href: "/services/custom-software-development" },
      { label: "AI Integration", href: "/services/ai-integration-development" },
      { label: "Cloud & Deployment", href: "/services/cloud-computing-deployment" },
      { label: "ERP Development", href: "/services/erp-implementation-development" },
      { label: "Web & Mobile", href: "/services/website-web-application-development" },
    ],
  },
  {
    key: "footer-solutions",
    name: "Solutions",
    items: [
      { label: "ERP", href: "/solutions/enterprise-resource-planning" },
      { label: "CRM", href: "/solutions/customer-relationship-management" },
      { label: "POS", href: "/solutions/point-of-sale" },
      { label: "Hotel Management", href: "/solutions/hotel-hospitality-management" },
      { label: "AI Solutions", href: "/solutions/ai-powered-business-solutions" },
    ],
  },
  {
    key: "footer-legal",
    name: "Legal",
    items: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
    ],
  },
];

export const aboutPage = {
  sections: [
    {
      type: "intro",
      subtitle: "About Axios Station",
      title: "Engineering technology that works for your business",
      description:
        "We believe every business deserves technology that works for its unique needs. Our mission is to engineer intelligent, scalable and reliable solutions that simplify operations, accelerate growth and create lasting business value.",
    },
    {
      type: "mission",
      title: "Our mission",
      description: "To engineer intelligent, scalable and reliable solutions that simplify operations, accelerate growth and create lasting business value.",
    },
    {
      type: "vision",
      title: "Our vision",
      description: "To be the technology partner businesses trust to turn ambitious ideas into intelligent, dependable digital products.",
    },
    {
      type: "values",
      title: "Core values",
      data: {
        items: [
          { title: "Integrity", description: "Honest advice, transparent pricing and clear communication." },
          { title: "Craftsmanship", description: "Clean code, thoughtful design and attention to detail." },
          { title: "Ownership", description: "We treat your outcomes as our responsibility." },
          { title: "Continuous learning", description: "We adopt new technology when it creates real value." },
        ],
      },
    },
    {
      type: "philosophy",
      title: "Our philosophy",
      description: "We don't force your business to adapt to software. We engineer software that adapts to your business.",
    },
    {
      type: "milestones",
      title: "Milestones",
      description: "Our journey so far.",
      data: { items: milestones },
    },
  ],
};
