import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import { Shield } from "lucide-react";
const policyStyles = `
  .policy-page {
    min-height: 100vh;
    background: var(--clr-bg-base);
    position: relative;
    overflow-x: hidden;
  }

  .policy-container {
    max-width: 820px;
    margin: 0 auto;
    padding: 3rem 2rem 4rem;
    position: relative;
    z-index: 1;
  }

  .policy-header {
    text-align: center;
    margin-bottom: 3rem;
    padding-bottom: 2rem;
    border-bottom: 1px solid var(--clr-glass-border);
  }

  .policy-header h1 {
    font-size: 2.2rem;
    font-weight: 800;
    margin: 1rem 0 0.5rem;
    background: linear-gradient(135deg, var(--clr-primary), #d946ef);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .policy-header .updated {
    font-size: 0.9rem;
    color: var(--clr-text-muted);
  }

  .policy-intro {
    font-size: 1rem;
    line-height: 1.7;
    color: var(--clr-text-main);
    margin-bottom: 2rem;
  }

  .policy-section {
    margin-bottom: 2.5rem;
  }

  .policy-section h2 {
    font-size: 1.35rem;
    font-weight: 700;
    color: var(--clr-text-main);
    margin-bottom: 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid var(--clr-glass-border);
  }

  .policy-section h3 {
    font-size: 1.05rem;
    font-weight: 600;
    color: var(--clr-text-main);
    margin: 1.25rem 0 0.5rem;
  }

  .policy-section p {
    font-size: 0.95rem;
    line-height: 1.7;
    color: var(--clr-text-main);
    margin-bottom: 0.75rem;
  }

  .policy-section ul {
    margin: 0.5rem 0 1rem 1.5rem;
    color: var(--clr-text-main);
  }

  .policy-section ul li {
    font-size: 0.95rem;
    line-height: 1.7;
    margin-bottom: 0.35rem;
  }

  .policy-section strong {
    color: var(--clr-text-main);
    font-weight: 600;
  }

  .policy-contact {
    background: var(--clr-glass-bg);
    border: 1px solid var(--clr-glass-border);
    border-radius: var(--border-radius-md);
    padding: 1.5rem;
    margin-top: 0.5rem;
  }

  .policy-contact p {
    margin-bottom: 0.35rem;
  }

  .policy-copyright {
    text-align: center;
    margin-top: 3rem;
    padding-top: 2rem;
    border-top: 1px solid var(--clr-glass-border);
    font-size: 0.9rem;
    color: var(--clr-text-muted);
  }

  .policy-footer {
    text-align: center;
    padding: 2rem;
    margin-top: 1rem;
    border-top: 1px solid var(--clr-glass-border);
    position: relative;
    z-index: 1;
  }

  .policy-footer-links {
    display: flex;
    justify-content: center;
    gap: 2rem;
    margin-bottom: 0.75rem;
    flex-wrap: wrap;
  }

  .policy-footer-links a {
    color: var(--clr-primary);
    font-size: 0.9rem;
    font-weight: 500;
    text-decoration: none;
    transition: opacity 0.2s ease;
  }

  .policy-footer-links a:hover {
    opacity: 0.8;
  }

  .policy-footer p {
    font-size: 0.8rem;
    color: var(--clr-text-muted);
  }

  @media (max-width: 767px) {
    .policy-container {
      padding: 2rem 1.25rem 3rem;
    }

    .policy-header h1 {
      font-size: 1.75rem;
    }

    .policy-section h2 {
      font-size: 1.2rem;
    }
  }
`;
export default function PrivacyPolicyPage() {
    return (_jsxs("div", { className: "policy-page", children: [_jsx("style", { children: policyStyles }), _jsxs("div", { className: "bg-mesh", children: [_jsx("div", { className: "blob-1" }), _jsx("div", { className: "blob-2" })] }), _jsxs("div", { className: "policy-container", children: [_jsxs("div", { className: "policy-header", children: [_jsx("div", { style: {
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    width: "60px",
                                    height: "60px",
                                    borderRadius: "16px",
                                    background: "var(--clr-accent-gradient)",
                                    color: "white",
                                }, children: _jsx(Shield, { size: 32 }) }), _jsx("h1", { children: "Privacy Policy" }), _jsx("p", { className: "updated", children: "Last Updated: September 11, 2026" })] }), _jsxs("div", { className: "policy-intro", children: [_jsx("p", { children: "A1 Fitness (\"A1 Fitness\", \"we\", \"us\", or \"our\") respects your privacy and is committed to protecting the personal information of our members, trainers, administrators, and website users." }), _jsx("p", { children: "This Privacy Policy explains what information we collect, how we use and protect it, how we communicate with you, including through WhatsApp where applicable, and what choices you have regarding your information when you use the A1 Fitness website, web application, mobile application, and related services (collectively, the \"Services\")." }), _jsx("p", { children: "By accessing or using the Services, you acknowledge that you have read and understood this Privacy Policy." })] }), _jsxs("div", { className: "policy-section", children: [_jsx("h2", { children: "1. About A1 Fitness" }), _jsx("p", { children: "A1 Fitness provides gym and fitness management services, including membership management, attendance management, trainer management, membership plans, payment records, and related communication services." }), _jsx("p", { children: "The Services may be used by:" }), _jsxs("ul", { children: [_jsx("li", { children: "Gym members" }), _jsx("li", { children: "Trainers" }), _jsx("li", { children: "Branch administrators" }), _jsx("li", { children: "Super administrators" }), _jsx("li", { children: "Authorized staff" })] }), _jsx("p", { children: "The Services are intended to be used for legitimate gym and fitness management purposes." })] }), _jsxs("div", { className: "policy-section", children: [_jsx("h2", { children: "2. Information We Collect" }), _jsx("p", { children: "Depending on how you use the Services, we may collect the following categories of information." }), _jsx("h3", { children: "2.1 Account and Identity Information" }), _jsx("p", { children: "When an account is created or managed, we may collect:" }), _jsxs("ul", { children: [_jsx("li", { children: "Name" }), _jsx("li", { children: "Username" }), _jsx("li", { children: "Email address" }), _jsx("li", { children: "Phone number" }), _jsx("li", { children: "Password or authentication credentials" }), _jsx("li", { children: "User role" }), _jsx("li", { children: "Gym or branch information" }), _jsx("li", { children: "Account status" })] }), _jsx("p", { children: "Passwords are stored using appropriate security mechanisms and are not intended to be stored in plain text." }), _jsx("h3", { children: "2.2 Membership Information" }), _jsx("p", { children: "For gym members, we may collect information related to membership, including:" }), _jsxs("ul", { children: [_jsx("li", { children: "Membership plan" }), _jsx("li", { children: "Membership start date" }), _jsx("li", { children: "Membership expiry date" }), _jsx("li", { children: "Membership status" }), _jsx("li", { children: "Assigned branch" }), _jsx("li", { children: "Membership history" }), _jsx("li", { children: "Account status" }), _jsx("li", { children: "Other information required to administer the membership" })] }), _jsx("h3", { children: "2.3 Attendance Information" }), _jsx("p", { children: "To operate gym attendance functionality, we may collect:" }), _jsxs("ul", { children: [_jsx("li", { children: "Attendance date" }), _jsx("li", { children: "Attendance time" }), _jsx("li", { children: "Member identifier" }), _jsx("li", { children: "Branch information" }), _jsx("li", { children: "Attendance status" }), _jsx("li", { children: "Attendance method or source, where applicable" })] }), _jsx("p", { children: "If A1 Fitness is integrated with an attendance or biometric device, the system may receive an identifier or attendance event generated by that device." }), _jsx("p", { children: "A1 Fitness should only process biometric information where such processing is necessary for the relevant service and permitted by applicable law and the gym's operational arrangements." }), _jsx("h3", { children: "2.4 Payment and Billing Information" }), _jsx("p", { children: "We may maintain records related to membership payments, including:" }), _jsxs("ul", { children: [_jsx("li", { children: "Payment status" }), _jsx("li", { children: "Payment amount" }), _jsx("li", { children: "Payment date" }), _jsx("li", { children: "Membership or plan associated with the payment" }), _jsx("li", { children: "Payment method" }), _jsx("li", { children: "Transaction or reference information" })] }), _jsx("p", { children: "Unless specifically stated otherwise, A1 Fitness does not intend to store complete payment-card information such as full credit/debit card numbers, CVV numbers, or card PINs." }), _jsx("p", { children: "Where third-party payment providers are used, payment information may be processed directly by those providers according to their own privacy policies and terms." }), _jsx("h3", { children: "2.5 Trainer and Staff Information" }), _jsx("p", { children: "For trainers and authorized staff, we may collect information such as:" }), _jsxs("ul", { children: [_jsx("li", { children: "Name" }), _jsx("li", { children: "Contact information" }), _jsx("li", { children: "Account credentials" }), _jsx("li", { children: "Assigned branch" }), _jsx("li", { children: "Role" }), _jsx("li", { children: "Members or activities assigned to the trainer" }), _jsx("li", { children: "Account status" })] }), _jsx("h3", { children: "2.6 Communication Information" }), _jsx("p", { children: "If you communicate with A1 Fitness, we may receive and retain information contained in those communications, such as:" }), _jsxs("ul", { children: [_jsx("li", { children: "Messages" }), _jsx("li", { children: "Contact details" }), _jsx("li", { children: "Support requests" }), _jsx("li", { children: "Communication history" }), _jsx("li", { children: "Information necessary to respond to your request" })] })] }), _jsxs("div", { className: "policy-section", children: [_jsx("h2", { children: "3. WhatsApp and Meta Services" }), _jsx("p", { children: "A1 Fitness may use Meta technologies and WhatsApp Business services to send authorized communications to members." }), _jsx("p", { children: "These communications may include:" }), _jsxs("ul", { children: [_jsx("li", { children: "Membership expiry reminders" }), _jsx("li", { children: "Payment reminders" }), _jsx("li", { children: "Membership-related notifications" }), _jsx("li", { children: "Other service-related communications authorized by the gym" })] }), _jsx("p", { children: "Where WhatsApp messaging is enabled, A1 Fitness may process information necessary to deliver the message, such as:" }), _jsxs("ul", { children: [_jsx("li", { children: "Member name" }), _jsx("li", { children: "Phone number" }), _jsx("li", { children: "Membership status" }), _jsx("li", { children: "Membership expiry information" }), _jsx("li", { children: "Payment-related status" }), _jsx("li", { children: "Message delivery information" })] }), _jsx("p", { children: "WhatsApp and Meta may independently process information according to their own terms and privacy policies." }), _jsx("p", { children: "A1 Fitness does not sell member personal information to Meta or use WhatsApp messaging to sell personal information." }), _jsx("p", { children: "Where required, A1 Fitness will obtain appropriate consent or rely on another lawful basis before sending applicable communications." }), _jsx("p", { children: "Users may contact the gym to request information about or, where legally applicable, opt out of non-essential communications." })] }), _jsxs("div", { className: "policy-section", children: [_jsx("h2", { children: "4. How We Use Personal Information" }), _jsx("p", { children: "We may use collected information for the following purposes:" }), _jsxs("ul", { children: [_jsx("li", { children: "Creating and managing user accounts" }), _jsx("li", { children: "Managing gym memberships" }), _jsx("li", { children: "Managing membership plans" }), _jsx("li", { children: "Recording attendance" }), _jsx("li", { children: "Managing trainers and staff" }), _jsx("li", { children: "Maintaining payment and billing records" }), _jsx("li", { children: "Sending membership and payment reminders" }), _jsx("li", { children: "Providing customer support" }), _jsx("li", { children: "Communicating important service information" }), _jsx("li", { children: "Managing gym branches" }), _jsx("li", { children: "Preventing unauthorized access or misuse" }), _jsx("li", { children: "Maintaining and improving the Services" }), _jsx("li", { children: "Troubleshooting technical problems" }), _jsx("li", { children: "Maintaining security and system integrity" }), _jsx("li", { children: "Complying with legal and regulatory obligations" }), _jsx("li", { children: "Protecting the rights, property, and safety of A1 Fitness, its users, and others" })] }), _jsx("p", { children: "We do not use personal information for purposes unrelated to the operation of the Services unless permitted by law or otherwise disclosed to the user." })] }), _jsxs("div", { className: "policy-section", children: [_jsx("h2", { children: "5. Legal Basis for Processing" }), _jsx("p", { children: "Where applicable, A1 Fitness may process personal information based on one or more of the following:" }), _jsxs("ul", { children: [_jsx("li", { children: "Performance of a membership or service agreement" }), _jsx("li", { children: "User consent" }), _jsx("li", { children: "Legitimate business purposes" }), _jsx("li", { children: "Compliance with legal obligations" }), _jsx("li", { children: "Protection of users, staff, and the Services" }), _jsx("li", { children: "Other lawful grounds available under applicable law" })] }), _jsx("p", { children: "The appropriate legal basis may depend on the type of information and the purpose for which it is processed." })] }), _jsxs("div", { className: "policy-section", children: [_jsx("h2", { children: "6. Information Sharing and Disclosure" }), _jsx("p", { children: "A1 Fitness does not sell or rent personal information to third parties." }), _jsx("p", { children: "We may share or provide access to personal information where reasonably necessary with:" }), _jsx("h3", { children: "Service Providers" }), _jsx("p", { children: "We may use trusted third-party providers for services such as:" }), _jsxs("ul", { children: [_jsx("li", { children: "Cloud hosting" }), _jsx("li", { children: "Database infrastructure" }), _jsx("li", { children: "Authentication" }), _jsx("li", { children: "Application hosting" }), _jsx("li", { children: "Messaging" }), _jsx("li", { children: "WhatsApp/Meta services" }), _jsx("li", { children: "Payment processing" }), _jsx("li", { children: "Technical monitoring" }), _jsx("li", { children: "Security and maintenance" })] }), _jsx("p", { children: "These providers may process information on our behalf and are expected to maintain appropriate safeguards." }), _jsx("h3", { children: "Gym Administrators and Authorized Staff" }), _jsx("p", { children: "Information may be accessible to authorized A1 Fitness administrators, branch administrators, trainers, or other personnel where necessary for their assigned responsibilities." }), _jsx("p", { children: "Access may be restricted according to the user's role and branch permissions." }), _jsx("h3", { children: "Legal Requirements" }), _jsx("p", { children: "We may disclose information where reasonably necessary to:" }), _jsxs("ul", { children: [_jsx("li", { children: "Comply with applicable law" }), _jsx("li", { children: "Respond to lawful requests" }), _jsx("li", { children: "Protect the rights or safety of A1 Fitness or others" }), _jsx("li", { children: "Investigate fraud, abuse, or security incidents" }), _jsx("li", { children: "Enforce our agreements or policies" })] })] }), _jsxs("div", { className: "policy-section", children: [_jsx("h2", { children: "7. Role-Based Access" }), _jsx("p", { children: "A1 Fitness uses role-based access controls to help restrict information to authorized users. Depending on the account role, users may have different levels of access." }), _jsx("p", { children: "For example:" }), _jsxs("ul", { children: [_jsxs("li", { children: [_jsx("strong", { children: "Super Administrators" }), " may have broader management access across authorized gym branches."] }), _jsxs("li", { children: [_jsx("strong", { children: "Branch Administrators" }), " may have access to information relating to their assigned branch."] }), _jsxs("li", { children: [_jsx("strong", { children: "Trainers" }), " may have access to information required for their assigned responsibilities."] }), _jsxs("li", { children: [_jsx("strong", { children: "Members" }), " may have access to their own account and membership information."] })] }), _jsx("p", { children: "Access permissions may be changed when necessary to maintain security and operational requirements." })] }), _jsxs("div", { className: "policy-section", children: [_jsx("h2", { children: "8. Data Security" }), _jsx("p", { children: "We take reasonable technical and organizational measures to protect personal information against unauthorized access, alteration, disclosure, loss, or destruction." }), _jsx("p", { children: "Security measures may include:" }), _jsxs("ul", { children: [_jsx("li", { children: "Authentication controls" }), _jsx("li", { children: "Password protection" }), _jsx("li", { children: "Role-based authorization" }), _jsx("li", { children: "Secure API communication where supported" }), _jsx("li", { children: "Access restrictions" }), _jsx("li", { children: "Server and database security controls" }), _jsx("li", { children: "Monitoring and maintenance" }), _jsx("li", { children: "Protection against unauthorized application access" })] }), _jsx("p", { children: "However, no website, application, database, or transmission over the Internet can be guaranteed to be completely secure. Therefore, while we take reasonable precautions, we cannot guarantee absolute security of information." })] }), _jsxs("div", { className: "policy-section", children: [_jsx("h2", { children: "9. Data Retention" }), _jsx("p", { children: "We retain personal information only for as long as reasonably necessary for the purposes described in this Privacy Policy, including:" }), _jsxs("ul", { children: [_jsx("li", { children: "Providing gym services" }), _jsx("li", { children: "Maintaining membership records" }), _jsx("li", { children: "Maintaining payment records" }), _jsx("li", { children: "Maintaining attendance records" }), _jsx("li", { children: "Meeting legal, accounting, or regulatory requirements" }), _jsx("li", { children: "Resolving disputes" }), _jsx("li", { children: "Preventing fraud or abuse" }), _jsx("li", { children: "Maintaining legitimate business records" })] }), _jsx("p", { children: "The retention period may vary depending on the type of information and applicable legal requirements." }), _jsx("p", { children: "When information is no longer reasonably required, it may be deleted, anonymized, or securely disposed of, subject to applicable law and legitimate record-keeping requirements." })] }), _jsxs("div", { className: "policy-section", children: [_jsx("h2", { children: "10. Data Deletion" }), _jsx("p", { children: "You may contact A1 Fitness to request deletion of personal information associated with your account, where applicable." }), _jsx("p", { children: "To request deletion, contact us using the contact information provided in Section 18 of this Privacy Policy." }), _jsx("p", { children: "When a deletion request is received, we may need to verify the request and account ownership before taking action." }), _jsx("p", { children: "Certain information may need to be retained where required by law, for legitimate business records, security purposes, dispute resolution, or other lawful purposes." }), _jsx("p", { children: "Deleting an account may also affect your ability to use certain A1 Fitness Services." })] }), _jsxs("div", { className: "policy-section", children: [_jsx("h2", { children: "11. Your Privacy Rights" }), _jsx("p", { children: "Depending on applicable law, you may have rights regarding your personal information, including the right to:" }), _jsxs("ul", { children: [_jsx("li", { children: "Request access to personal information we hold about you" }), _jsx("li", { children: "Request correction of inaccurate information" }), _jsx("li", { children: "Request deletion of information where legally applicable" }), _jsx("li", { children: "Request restriction of certain processing" }), _jsx("li", { children: "Object to certain processing" }), _jsx("li", { children: "Withdraw consent where processing is based on consent" }), _jsx("li", { children: "Request information about how your data is processed" }), _jsx("li", { children: "Request information about certain third-party disclosures" })] }), _jsx("p", { children: "These rights may be subject to legal limitations and exceptions. To exercise an applicable right, contact A1 Fitness using the contact details provided below." })] }), _jsxs("div", { className: "policy-section", children: [_jsx("h2", { children: "12. Cookies and Similar Technologies" }), _jsx("p", { children: "The A1 Fitness website or application may use cookies, local storage, session technologies, or similar technologies where necessary to:" }), _jsxs("ul", { children: [_jsx("li", { children: "Maintain authentication sessions" }), _jsx("li", { children: "Remember user preferences" }), _jsx("li", { children: "Maintain application functionality" }), _jsx("li", { children: "Improve security" }), _jsx("li", { children: "Understand application usage" }), _jsx("li", { children: "Diagnose technical problems" })] }), _jsx("p", { children: "Some technologies may be necessary for the Services to function correctly. You may be able to control certain cookies through your browser settings. Disabling required technologies may affect the functionality of the Services." })] }), _jsxs("div", { className: "policy-section", children: [_jsx("h2", { children: "13. Children's Privacy" }), _jsx("p", { children: "The Services are primarily intended for use by gym members and authorized personnel. A1 Fitness does not knowingly collect personal information from children in violation of applicable law." }), _jsx("p", { children: "Where membership or services involve a minor, the gym should ensure that any required parental or guardian authorization is obtained in accordance with applicable law." }), _jsx("p", { children: "If you believe that information belonging to a child has been collected improperly, please contact us so that we can review the matter." })] }), _jsxs("div", { className: "policy-section", children: [_jsx("h2", { children: "14. Third-Party Services and Links" }), _jsx("p", { children: "The Services may integrate with or link to third-party services, including Meta, WhatsApp, hosting providers, payment providers, or other external services. Those third parties may have their own privacy policies and terms." }), _jsx("p", { children: "A1 Fitness is not responsible for the privacy practices of independent third-party services. We recommend reviewing the privacy policies of any third-party service before providing information directly to that service." })] }), _jsxs("div", { className: "policy-section", children: [_jsx("h2", { children: "15. International Data Processing" }), _jsx("p", { children: "Depending on the infrastructure and third-party services used by A1 Fitness, personal information may be processed or stored in countries other than the country where the user resides." }), _jsx("p", { children: "Where applicable, we will take reasonable steps to ensure that such processing is carried out in accordance with applicable data protection requirements." })] }), _jsxs("div", { className: "policy-section", children: [_jsx("h2", { children: "16. Changes to This Privacy Policy" }), _jsx("p", { children: "We may update this Privacy Policy from time to time to reflect:" }), _jsxs("ul", { children: [_jsx("li", { children: "Changes to the Services" }), _jsx("li", { children: "Changes to our data practices" }), _jsx("li", { children: "Changes to third-party integrations" }), _jsx("li", { children: "Changes in legal or regulatory requirements" }), _jsx("li", { children: "Security or operational improvements" })] }), _jsx("p", { children: "When we make changes, we will update the \"Last Updated\" date at the beginning of this Privacy Policy. We encourage users to periodically review this page for the latest information." })] }), _jsxs("div", { className: "policy-section", children: [_jsx("h2", { children: "17. Meta Platform and WhatsApp Integration" }), _jsx("p", { children: "Where A1 Fitness uses Meta platform technologies, including WhatsApp Business Platform services, the integration may involve processing information required to authenticate the application, send messages, receive delivery information, or otherwise provide the requested communication functionality." }), _jsx("p", { children: "A1 Fitness uses Meta-related services only for legitimate business and service purposes associated with the A1 Fitness platform. Information processed through Meta services may also be subject to Meta's applicable terms and privacy policies." }), _jsx("p", { children: "A1 Fitness does not sell personal information obtained through Meta platform integrations. If a user has questions regarding information processed through a Meta integration, they may contact A1 Fitness using the contact details below." })] }), _jsxs("div", { className: "policy-section", children: [_jsx("h2", { children: "18. Contact Us" }), _jsx("p", { children: "If you have questions, concerns, requests, or complaints regarding this Privacy Policy or the handling of your personal information, please contact A1 Fitness." }), _jsxs("div", { className: "policy-contact", children: [_jsx("p", { children: _jsx("strong", { children: "A1 Fitness" }) }), _jsxs("p", { children: [_jsx("strong", { children: "Legal/Business Name:" }), " [Insert Legal Business Name]"] }), _jsxs("p", { children: [_jsx("strong", { children: "Address:" }), " [Insert Business Address]"] }), _jsxs("p", { children: [_jsx("strong", { children: "Email:" }), " [Insert Privacy/Support Email]"] }), _jsxs("p", { children: [_jsx("strong", { children: "Phone:" }), " [Insert Business Phone Number]"] }), _jsxs("p", { children: [_jsx("strong", { children: "Website:" }), " [Insert Website URL]"] })] }), _jsx("p", { style: { marginTop: "1rem" }, children: "For privacy-related requests, please include enough information for us to understand and verify your request." })] }), _jsxs("div", { className: "policy-section", children: [_jsx("h2", { children: "19. Consent and Acknowledgement" }), _jsx("p", { children: "By using the A1 Fitness Services, you acknowledge that you have had an opportunity to review this Privacy Policy. Where applicable, A1 Fitness will obtain consent or rely on another lawful basis before processing personal information for purposes that require it." })] }), _jsx("div", { className: "policy-copyright", children: "\u00A9 2026 A1 Fitness. All rights reserved." })] }), _jsxs("footer", { className: "policy-footer", children: [_jsxs("div", { className: "policy-footer-links", children: [_jsx(Link, { to: "/privacy-policy", children: "Privacy Policy" }), _jsx(Link, { to: "/login", children: "Login" })] }), _jsxs("p", { children: ["\u00A9 ", new Date().getFullYear(), " A1 Fitness. All rights reserved."] })] })] }));
}
