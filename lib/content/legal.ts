/**
 * Starter legal texts for /privacy and /terms. They describe what this
 * website actually does (see services/leads.ts, components/layout/analytics.tsx).
 * Seeded once, only while the original placeholder is still in place, and
 * fully editable in Admin → Pages. Have them reviewed by a lawyer before relying on them.
 */

export const LEGAL_UPDATED = "24 November 2026";

export const LEGAL_PLACEHOLDERS = {
  privacy: "<p>This privacy policy will be published by Axios Station. Please contact us with any privacy questions.</p>",
  terms: "<p>These terms of service will be published by Axios Station. Please contact us with any questions.</p>",
};

export const privacyPolicyHtml = `
<p><em>Last updated: ${LEGAL_UPDATED}</em></p>
<p>Axios Station ("we", "us") builds software, cloud and automation solutions for businesses. This policy explains what personal information we collect through this website, why we collect it, and the choices you have. We collect as little as we need, and we never sell personal information.</p>

<h2>1. Information we collect</h2>
<h3>When you contact us</h3>
<p>When you send an inquiry through our contact form we collect the details you provide: your name, email address, and optionally your phone number, company, the service you are interested in, your budget range, your message and how you prefer to be contacted. We also record the time you accepted this policy.</p>
<p>To protect the form from spam and abuse we store a one-way hash of your IP address (not the address itself) and your browser's user-agent string.</p>
<h3>When you subscribe to our newsletter</h3>
<p>We collect your email address, where on the site you subscribed and the time you gave consent. Every newsletter contains a link to unsubscribe instantly.</p>
<h3>When you browse the website</h3>
<ul>
<li><strong>Anonymous page statistics.</strong> We may record which page was viewed and the referring page. This uses no cookies and contains no personal information.</li>
<li><strong>Google Analytics (optional).</strong> If enabled, Google Analytics loads only after you click "Accept" on the cookie banner, with IP anonymisation turned on. If you decline, it is not loaded. You can change your choice at any time with the "Cookie settings" link in the footer.</li>
<li><strong>Preferences on your device.</strong> We store your light/dark theme choice and your cookie choice in your browser's local storage. They never leave your device.</li>
</ul>

<h2>2. How we use your information</h2>
<ul>
<li>To reply to your inquiry, prepare proposals and deliver the services you ask for.</li>
<li>To send the newsletter you subscribed to.</li>
<li>To keep the website secure and prevent spam, fraud and abuse.</li>
<li>To understand, in aggregate, which content is useful so we can improve the website.</li>
</ul>
<p>We use your information only for these purposes. We do not use it for automated decisions that have legal or similarly significant effects on you.</p>

<h2>3. Sharing</h2>
<p>We do not sell or rent personal information. We share it only with:</p>
<ul>
<li>service providers that host our website and database or deliver our email, acting on our instructions;</li>
<li>Google, only if you accepted analytics cookies;</li>
<li>authorities, when the law requires it.</li>
</ul>

<h2>4. How long we keep it</h2>
<p>We keep inquiries for as long as needed to respond to you and manage any resulting business relationship, and then delete or anonymise them. Newsletter addresses are kept until you unsubscribe. Anonymous page statistics contain no personal information.</p>

<h2>5. Security</h2>
<p>Access to our admin system is restricted by role, protected by strong passwords and login rate limits, and every action is logged. Data is sent over encrypted HTTPS connections. No system is perfectly secure, but we work to protect your information and will act promptly if an incident occurs.</p>

<h2>6. Your rights</h2>
<p>You can ask us to:</p>
<ul>
<li>tell you what personal information we hold about you;</li>
<li>correct or delete it;</li>
<li>stop contacting you.</li>
</ul>
<p>You can withdraw newsletter or analytics consent at any time. To make a request, contact us through our <a href="/contact">contact page</a>. We will respond within a reasonable time.</p>

<h2>7. Children</h2>
<p>This website is intended for businesses and is not directed at children. We do not knowingly collect information from children.</p>

<h2>8. Client systems</h2>
<p>When we build or support software for a client (for example HR, attendance or hotel systems), the client decides how its data is used. We process that data only under the client's instructions and our agreement with them. This policy covers our website only.</p>

<h2>9. Changes to this policy</h2>
<p>We may update this policy as our website or the law changes. The date at the top shows when it was last revised.</p>

<h2>10. Contact</h2>
<p>For any privacy question, please reach us through our <a href="/contact">contact page</a>.</p>
`.trim();

export const termsHtml = `
<p><em>Last updated: ${LEGAL_UPDATED}</em></p>
<p>These terms apply to your use of the Axios Station website. By using the website you agree to them. If you do not agree, please do not use the website.</p>

<h2>1. About us and our services</h2>
<p>Axios Station provides software development, cloud, IT support, security, automation and digital marketing services. The information on this website is general in nature. Any project we take on is governed by a separate written proposal, quotation or agreement. If that document conflicts with these terms, the document prevails.</p>

<h2>2. Using the website</h2>
<p>You agree not to:</p>
<ul>
<li>use the website unlawfully, or in a way that harms the website, us or other people;</li>
<li>attempt unauthorised access to any part of the website or its systems;</li>
<li>send spam, malware or misleading information through our forms;</li>
<li>copy or scrape the website's content in bulk.</li>
</ul>

<h2>3. Intellectual property</h2>
<p>The website's content, design, logo, illustrations and code belong to Axios Station or its licensors and are protected by law. You may view and share pages for personal or internal business reference. Do not reproduce or reuse them commercially without our written permission. Ownership of software we build for clients is set out in each client agreement.</p>

<h2>4. Case studies and illustrations</h2>
<p>Case studies describe real work we have done and are published with our clients' knowledge. Some images are illustrations or concept artwork and are labelled as such. They are not screenshots of client systems. Projects marked "Demo" are demonstration builds.</p>

<h2>5. Proposals, pricing and payment</h2>
<p>Prices, timelines and scope are confirmed only in a written proposal or agreement. Unless that agreement says otherwise, estimates on the website or in early conversations are not binding offers. Payment terms are those in the relevant agreement or invoice.</p>

<h2>6. Confidentiality</h2>
<p>We treat information you share about your business as confidential and use it only to evaluate and deliver your project. If you need a formal non-disclosure agreement, ask us before sharing sensitive material.</p>

<h2>7. Third-party links and services</h2>
<p>The website may link to third-party websites and services, such as social networks or WhatsApp. We are not responsible for their content or practices.</p>

<h2>8. Disclaimer</h2>
<p>We work to keep the website accurate and available, but it is provided "as is". We do not guarantee that it will always be error-free or uninterrupted. Nothing on the website is professional advice for your specific situation.</p>

<h2>9. Limitation of liability</h2>
<p>To the extent the law allows, Axios Station is not liable for indirect or consequential loss arising from use of the website. Our liability for services we deliver is set out in the relevant client agreement.</p>

<h2>10. Governing law</h2>
<p>These terms are governed by the laws of Bangladesh, and the courts of Bangladesh have jurisdiction over any dispute about them.</p>

<h2>11. Changes</h2>
<p>We may update these terms from time to time. The date at the top shows the latest version. Continued use of the website means you accept the updated terms.</p>

<h2>12. Contact</h2>
<p>Questions about these terms? Reach us through our <a href="/contact">contact page</a>.</p>
`.trim();
