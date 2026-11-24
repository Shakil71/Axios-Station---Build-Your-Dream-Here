/**
 * Search-focused titles and descriptions for the most important English pages,
 * seeded once into SEO Management (Admin → SEO) and freely editable there.
 * Titles stay under ~60 characters and descriptions under ~160 so Google shows
 * them in full. Non-home titles get " | Axios Station" appended automatically.
 * Keywords target real searches (Bangladesh, Cox's Bazar, ERP, hotel software…)
 * without claims the company cannot back up.
 */
export const seoDefaults: { path: string; metaTitle: string; metaDescription: string; keywords: string }[] = [
  {
    path: "/",
    metaTitle: "Axios Station | Software, AI & Cloud Company in Bangladesh",
    metaDescription:
      "Custom software, ERP, hotel and HR systems, AI integration, cloud and digital marketing for businesses in Bangladesh and abroad. Book a free consultation.",
    keywords: "software company in Bangladesh, IT company Bangladesh, custom software development, ERP software Bangladesh, AI integration, cloud services, Cox's Bazar",
  },
  {
    path: "/about",
    metaTitle: "About Us – Technology Partner Since 2024",
    metaDescription:
      "Axios Station is a Bangladeshi technology company building intelligent, scalable and reliable software, cloud and automation solutions since 2024.",
    keywords: "about Axios Station, Bangladeshi software company, technology partner",
  },
  {
    path: "/services",
    metaTitle: "Software & IT Services in Bangladesh",
    metaDescription:
      "Custom software, AI, automation, cloud, DevOps, networks, ERP, CRM, POS, web and mobile apps, IT support and digital marketing — one technology partner.",
    keywords: "IT services Bangladesh, software development services, web development Bangladesh, mobile app development, IT support",
  },
  {
    path: "/solutions",
    metaTitle: "ERP, CRM, POS, Hotel & HR Software Solutions",
    metaDescription:
      "Business software customised to your workflows: ERP, CRM, POS, hotel management, hospital, school, real estate, inventory, HR & payroll and AI solutions.",
    keywords: "ERP software, CRM software, POS software, hotel management software, HR payroll software, school management software",
  },
  {
    path: "/industries",
    metaTitle: "Technology Solutions by Industry",
    metaDescription:
      "Software and IT solutions for hospitality, healthcare, education, finance, retail, real estate, manufacturing, logistics, enterprises and SMEs.",
    keywords: "industry software solutions, hospitality technology, healthcare software, education software",
  },
  {
    path: "/portfolio",
    metaTitle: "Portfolio & Case Studies",
    metaDescription:
      "Software, hotel, HR and cloud projects engineered by Axios Station — including employee management with ZKTeco fingerprint attendance at Hotel Sea Paradise.",
    keywords: "software portfolio, case studies, hotel software case study, ZKTeco integration",
  },
  {
    path: "/team",
    metaTitle: "Meet Our Software & Cloud Experts",
    metaDescription:
      "Meet the Axios Station team: cloud and Oracle systems leadership, software development, AI, IT security, quality assurance and digital marketing.",
    keywords: "Axios Station team, software engineers Bangladesh, cloud experts",
  },
  {
    path: "/blog",
    metaTitle: "Blog: Software, AI, Cloud & Marketing",
    metaDescription:
      "Practical guides on attendance integration, hotel software, AI for SMEs, cloud hosting in Bangladesh, sales funnels and server security.",
    keywords: "software blog Bangladesh, AI guide, cloud hosting Bangladesh, digital marketing tips",
  },
  {
    path: "/contact",
    metaTitle: "Contact Us – Book a Free Consultation",
    metaDescription:
      "Tell us about your project. Axios Station will review it and reply with practical next steps, timeline and options — no obligation.",
    keywords: "contact Axios Station, free IT consultation, software quote Bangladesh",
  },
  {
    path: "/solutions/hotel-hospitality-management",
    metaTitle: "Hotel Management Software in Bangladesh",
    metaDescription:
      "Reservations, front desk, housekeeping, billing, staff attendance and analytics for hotels and resorts — customised and supported by Axios Station.",
    keywords: "hotel management software Bangladesh, hotel PMS, hotel ERP, resort software Cox's Bazar, property management system",
  },
  {
    path: "/solutions/hr-payroll-management",
    metaTitle: "HR & Payroll Software with Attendance",
    metaDescription:
      "Employees, shifts, attendance, leave and payroll in one system, with ZKTeco fingerprint attendance integration. Built and supported in Bangladesh.",
    keywords: "HR software Bangladesh, payroll software, attendance software, ZKTeco integration, employee management software",
  },
  {
    path: "/solutions/enterprise-resource-planning",
    metaTitle: "ERP Software for Businesses in Bangladesh",
    metaDescription:
      "A modular ERP connecting accounts, inventory, purchasing, sales and HR, customised to your workflows, with real-time reports for management.",
    keywords: "ERP software Bangladesh, ERP system, accounting inventory software, custom ERP",
  },
  {
    path: "/solutions/point-of-sale",
    metaTitle: "POS Software for Shops & Restaurants",
    metaDescription:
      "Fast checkout, inventory sync, multi-branch reports and offline support for shops, supermarkets and restaurants — customised POS by Axios Station.",
    keywords: "POS software Bangladesh, restaurant POS, retail POS, inventory POS system",
  },
  {
    path: "/services/custom-software-development",
    metaTitle: "Custom Software Development in Bangladesh",
    metaDescription:
      "Bespoke business software built around your workflows: internal tools, portals, data platforms and line-of-business systems, maintained long term.",
    keywords: "custom software development Bangladesh, software development company, bespoke software",
  },
  {
    path: "/services/website-web-application-development",
    metaTitle: "Website & Web App Development in Bangladesh",
    metaDescription:
      "Fast, secure, search-friendly websites, portals and web apps with an easy admin panel. Designed, built and maintained by Axios Station.",
    keywords: "website development Bangladesh, web application development, web design company Bangladesh",
  },
  {
    path: "/services/mobile-application-development",
    metaTitle: "Mobile App Development in Bangladesh",
    metaDescription:
      "Cross-platform and native mobile apps for customers, field staff and internal teams, connected to your existing systems.",
    keywords: "mobile app development Bangladesh, Android app development, iOS app development, Flutter app",
  },
  {
    path: "/services/digital-marketing-business-growth",
    metaTitle: "Digital Marketing in Bangladesh – SEO & Ads",
    metaDescription:
      "Full-funnel digital marketing focused on sales: SEO, Facebook and Google ads, landing pages, WhatsApp follow-up and clear reporting.",
    keywords: "digital marketing Bangladesh, Facebook ads Bangladesh, SEO services Bangladesh, sales funnel, WhatsApp marketing",
  },
  {
    path: "/services/ai-integration-development",
    metaTitle: "AI Integration & Development Services",
    metaDescription:
      "Practical AI for your business: assistants grounded in your own data, document AI, classification and forecasting — secure, evaluated and cost-controlled.",
    keywords: "AI integration Bangladesh, AI development, chatbot development, document AI",
  },
  {
    path: "/portfolio/hotel-sea-paradise-employee-management",
    metaTitle: "Hotel Sea Paradise – Attendance Case Study",
    metaDescription:
      "How Axios Station's Employee Management Software runs at Hotel Sea Paradise, Cox's Bazar, with ZKTeco fingerprint attendance integration and ongoing support.",
    keywords: "Hotel Sea Paradise, Cox's Bazar hotel software, ZKTeco attendance integration, employee management software",
  },
];
