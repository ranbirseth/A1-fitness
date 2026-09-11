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
  return (
    <div className="policy-page">
      <style>{policyStyles}</style>

      <div className="bg-mesh">
        <div className="blob-1"></div>
        <div className="blob-2"></div>
      </div>

      <div className="policy-container">
        <div className="policy-header">
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "60px",
            height: "60px",
            borderRadius: "16px",
            background: "var(--clr-accent-gradient)",
            color: "white",
          }}>
            <Shield size={32} />
          </div>
          <h1>Privacy Policy</h1>
          <p className="updated">Last Updated: September 11, 2026</p>
        </div>

        <div className="policy-intro">
          <p>
            A1 Fitness ("A1 Fitness", "we", "us", or "our") respects your privacy and is committed to
            protecting the personal information of our members, trainers, administrators, and website users.
          </p>
          <p>
            This Privacy Policy explains what information we collect, how we use and protect it, how we
            communicate with you, including through WhatsApp where applicable, and what choices you have
            regarding your information when you use the A1 Fitness website, web application, mobile
            application, and related services (collectively, the "Services").
          </p>
          <p>
            By accessing or using the Services, you acknowledge that you have read and understood this
            Privacy Policy.
          </p>
        </div>

        {/* Section 1 */}
        <div className="policy-section">
          <h2>1. About A1 Fitness</h2>
          <p>
            A1 Fitness provides gym and fitness management services, including membership management,
            attendance management, trainer management, membership plans, payment records, and related
            communication services.
          </p>
          <p>The Services may be used by:</p>
          <ul>
            <li>Gym members</li>
            <li>Trainers</li>
            <li>Branch administrators</li>
            <li>Super administrators</li>
            <li>Authorized staff</li>
          </ul>
          <p>The Services are intended to be used for legitimate gym and fitness management purposes.</p>
        </div>

        {/* Section 2 */}
        <div className="policy-section">
          <h2>2. Information We Collect</h2>
          <p>
            Depending on how you use the Services, we may collect the following categories of information.
          </p>

          <h3>2.1 Account and Identity Information</h3>
          <p>When an account is created or managed, we may collect:</p>
          <ul>
            <li>Name</li>
            <li>Username</li>
            <li>Email address</li>
            <li>Phone number</li>
            <li>Password or authentication credentials</li>
            <li>User role</li>
            <li>Gym or branch information</li>
            <li>Account status</li>
          </ul>
          <p>
            Passwords are stored using appropriate security mechanisms and are not intended to be stored
            in plain text.
          </p>

          <h3>2.2 Membership Information</h3>
          <p>For gym members, we may collect information related to membership, including:</p>
          <ul>
            <li>Membership plan</li>
            <li>Membership start date</li>
            <li>Membership expiry date</li>
            <li>Membership status</li>
            <li>Assigned branch</li>
            <li>Membership history</li>
            <li>Account status</li>
            <li>Other information required to administer the membership</li>
          </ul>

          <h3>2.3 Attendance Information</h3>
          <p>To operate gym attendance functionality, we may collect:</p>
          <ul>
            <li>Attendance date</li>
            <li>Attendance time</li>
            <li>Member identifier</li>
            <li>Branch information</li>
            <li>Attendance status</li>
            <li>Attendance method or source, where applicable</li>
          </ul>
          <p>
            If A1 Fitness is integrated with an attendance or biometric device, the system may receive an
            identifier or attendance event generated by that device.
          </p>
          <p>
            A1 Fitness should only process biometric information where such processing is necessary for
            the relevant service and permitted by applicable law and the gym's operational arrangements.
          </p>

          <h3>2.4 Payment and Billing Information</h3>
          <p>We may maintain records related to membership payments, including:</p>
          <ul>
            <li>Payment status</li>
            <li>Payment amount</li>
            <li>Payment date</li>
            <li>Membership or plan associated with the payment</li>
            <li>Payment method</li>
            <li>Transaction or reference information</li>
          </ul>
          <p>
            Unless specifically stated otherwise, A1 Fitness does not intend to store complete
            payment-card information such as full credit/debit card numbers, CVV numbers, or card PINs.
          </p>
          <p>
            Where third-party payment providers are used, payment information may be processed directly
            by those providers according to their own privacy policies and terms.
          </p>

          <h3>2.5 Trainer and Staff Information</h3>
          <p>For trainers and authorized staff, we may collect information such as:</p>
          <ul>
            <li>Name</li>
            <li>Contact information</li>
            <li>Account credentials</li>
            <li>Assigned branch</li>
            <li>Role</li>
            <li>Members or activities assigned to the trainer</li>
            <li>Account status</li>
          </ul>

          <h3>2.6 Communication Information</h3>
          <p>
            If you communicate with A1 Fitness, we may receive and retain information contained in
            those communications, such as:
          </p>
          <ul>
            <li>Messages</li>
            <li>Contact details</li>
            <li>Support requests</li>
            <li>Communication history</li>
            <li>Information necessary to respond to your request</li>
          </ul>
        </div>

        {/* Section 3 */}
        <div className="policy-section">
          <h2>3. WhatsApp and Meta Services</h2>
          <p>
            A1 Fitness may use Meta technologies and WhatsApp Business services to send authorized
            communications to members.
          </p>
          <p>These communications may include:</p>
          <ul>
            <li>Membership expiry reminders</li>
            <li>Payment reminders</li>
            <li>Membership-related notifications</li>
            <li>Other service-related communications authorized by the gym</li>
          </ul>
          <p>
            Where WhatsApp messaging is enabled, A1 Fitness may process information necessary to
            deliver the message, such as:
          </p>
          <ul>
            <li>Member name</li>
            <li>Phone number</li>
            <li>Membership status</li>
            <li>Membership expiry information</li>
            <li>Payment-related status</li>
            <li>Message delivery information</li>
          </ul>
          <p>
            WhatsApp and Meta may independently process information according to their own terms and
            privacy policies.
          </p>
          <p>
            A1 Fitness does not sell member personal information to Meta or use WhatsApp messaging to
            sell personal information.
          </p>
          <p>
            Where required, A1 Fitness will obtain appropriate consent or rely on another lawful basis
            before sending applicable communications.
          </p>
          <p>
            Users may contact the gym to request information about or, where legally applicable, opt
            out of non-essential communications.
          </p>
        </div>

        {/* Section 4 */}
        <div className="policy-section">
          <h2>4. How We Use Personal Information</h2>
          <p>We may use collected information for the following purposes:</p>
          <ul>
            <li>Creating and managing user accounts</li>
            <li>Managing gym memberships</li>
            <li>Managing membership plans</li>
            <li>Recording attendance</li>
            <li>Managing trainers and staff</li>
            <li>Maintaining payment and billing records</li>
            <li>Sending membership and payment reminders</li>
            <li>Providing customer support</li>
            <li>Communicating important service information</li>
            <li>Managing gym branches</li>
            <li>Preventing unauthorized access or misuse</li>
            <li>Maintaining and improving the Services</li>
            <li>Troubleshooting technical problems</li>
            <li>Maintaining security and system integrity</li>
            <li>Complying with legal and regulatory obligations</li>
            <li>
              Protecting the rights, property, and safety of A1 Fitness, its users, and others
            </li>
          </ul>
          <p>
            We do not use personal information for purposes unrelated to the operation of the Services
            unless permitted by law or otherwise disclosed to the user.
          </p>
        </div>

        {/* Section 5 */}
        <div className="policy-section">
          <h2>5. Legal Basis for Processing</h2>
          <p>
            Where applicable, A1 Fitness may process personal information based on one or more of the
            following:
          </p>
          <ul>
            <li>Performance of a membership or service agreement</li>
            <li>User consent</li>
            <li>Legitimate business purposes</li>
            <li>Compliance with legal obligations</li>
            <li>Protection of users, staff, and the Services</li>
            <li>Other lawful grounds available under applicable law</li>
          </ul>
          <p>
            The appropriate legal basis may depend on the type of information and the purpose for
            which it is processed.
          </p>
        </div>

        {/* Section 6 */}
        <div className="policy-section">
          <h2>6. Information Sharing and Disclosure</h2>
          <p>
            A1 Fitness does not sell or rent personal information to third parties.
          </p>
          <p>
            We may share or provide access to personal information where reasonably necessary with:
          </p>

          <h3>Service Providers</h3>
          <p>We may use trusted third-party providers for services such as:</p>
          <ul>
            <li>Cloud hosting</li>
            <li>Database infrastructure</li>
            <li>Authentication</li>
            <li>Application hosting</li>
            <li>Messaging</li>
            <li>WhatsApp/Meta services</li>
            <li>Payment processing</li>
            <li>Technical monitoring</li>
            <li>Security and maintenance</li>
          </ul>
          <p>
            These providers may process information on our behalf and are expected to maintain
            appropriate safeguards.
          </p>

          <h3>Gym Administrators and Authorized Staff</h3>
          <p>
            Information may be accessible to authorized A1 Fitness administrators, branch
            administrators, trainers, or other personnel where necessary for their assigned
            responsibilities.
          </p>
          <p>
            Access may be restricted according to the user's role and branch permissions.
          </p>

          <h3>Legal Requirements</h3>
          <p>We may disclose information where reasonably necessary to:</p>
          <ul>
            <li>Comply with applicable law</li>
            <li>Respond to lawful requests</li>
            <li>Protect the rights or safety of A1 Fitness or others</li>
            <li>Investigate fraud, abuse, or security incidents</li>
            <li>Enforce our agreements or policies</li>
          </ul>
        </div>

        {/* Section 7 */}
        <div className="policy-section">
          <h2>7. Role-Based Access</h2>
          <p>
            A1 Fitness uses role-based access controls to help restrict information to authorized
            users. Depending on the account role, users may have different levels of access.
          </p>
          <p>For example:</p>
          <ul>
            <li>
              <strong>Super Administrators</strong> may have broader management access across
              authorized gym branches.
            </li>
            <li>
              <strong>Branch Administrators</strong> may have access to information relating to
              their assigned branch.
            </li>
            <li>
              <strong>Trainers</strong> may have access to information required for their assigned
              responsibilities.
            </li>
            <li>
              <strong>Members</strong> may have access to their own account and membership
              information.
            </li>
          </ul>
          <p>
            Access permissions may be changed when necessary to maintain security and operational
            requirements.
          </p>
        </div>

        {/* Section 8 */}
        <div className="policy-section">
          <h2>8. Data Security</h2>
          <p>
            We take reasonable technical and organizational measures to protect personal information
            against unauthorized access, alteration, disclosure, loss, or destruction.
          </p>
          <p>Security measures may include:</p>
          <ul>
            <li>Authentication controls</li>
            <li>Password protection</li>
            <li>Role-based authorization</li>
            <li>Secure API communication where supported</li>
            <li>Access restrictions</li>
            <li>Server and database security controls</li>
            <li>Monitoring and maintenance</li>
            <li>Protection against unauthorized application access</li>
          </ul>
          <p>
            However, no website, application, database, or transmission over the Internet can be
            guaranteed to be completely secure. Therefore, while we take reasonable precautions, we
            cannot guarantee absolute security of information.
          </p>
        </div>

        {/* Section 9 */}
        <div className="policy-section">
          <h2>9. Data Retention</h2>
          <p>
            We retain personal information only for as long as reasonably necessary for the purposes
            described in this Privacy Policy, including:
          </p>
          <ul>
            <li>Providing gym services</li>
            <li>Maintaining membership records</li>
            <li>Maintaining payment records</li>
            <li>Maintaining attendance records</li>
            <li>Meeting legal, accounting, or regulatory requirements</li>
            <li>Resolving disputes</li>
            <li>Preventing fraud or abuse</li>
            <li>Maintaining legitimate business records</li>
          </ul>
          <p>
            The retention period may vary depending on the type of information and applicable legal
            requirements.
          </p>
          <p>
            When information is no longer reasonably required, it may be deleted, anonymized, or
            securely disposed of, subject to applicable law and legitimate record-keeping requirements.
          </p>
        </div>

        {/* Section 10 */}
        <div className="policy-section">
          <h2>10. Data Deletion</h2>
          <p>
            You may contact A1 Fitness to request deletion of personal information associated with
            your account, where applicable.
          </p>
          <p>
            To request deletion, contact us using the contact information provided in Section 18 of
            this Privacy Policy.
          </p>
          <p>
            When a deletion request is received, we may need to verify the request and account
            ownership before taking action.
          </p>
          <p>
            Certain information may need to be retained where required by law, for legitimate business
            records, security purposes, dispute resolution, or other lawful purposes.
          </p>
          <p>
            Deleting an account may also affect your ability to use certain A1 Fitness Services.
          </p>
        </div>

        {/* Section 11 */}
        <div className="policy-section">
          <h2>11. Your Privacy Rights</h2>
          <p>
            Depending on applicable law, you may have rights regarding your personal information,
            including the right to:
          </p>
          <ul>
            <li>Request access to personal information we hold about you</li>
            <li>Request correction of inaccurate information</li>
            <li>Request deletion of information where legally applicable</li>
            <li>Request restriction of certain processing</li>
            <li>Object to certain processing</li>
            <li>Withdraw consent where processing is based on consent</li>
            <li>Request information about how your data is processed</li>
            <li>Request information about certain third-party disclosures</li>
          </ul>
          <p>
            These rights may be subject to legal limitations and exceptions. To exercise an applicable
            right, contact A1 Fitness using the contact details provided below.
          </p>
        </div>

        {/* Section 12 */}
        <div className="policy-section">
          <h2>12. Cookies and Similar Technologies</h2>
          <p>
            The A1 Fitness website or application may use cookies, local storage, session
            technologies, or similar technologies where necessary to:
          </p>
          <ul>
            <li>Maintain authentication sessions</li>
            <li>Remember user preferences</li>
            <li>Maintain application functionality</li>
            <li>Improve security</li>
            <li>Understand application usage</li>
            <li>Diagnose technical problems</li>
          </ul>
          <p>
            Some technologies may be necessary for the Services to function correctly. You may be able
            to control certain cookies through your browser settings. Disabling required technologies
            may affect the functionality of the Services.
          </p>
        </div>

        {/* Section 13 */}
        <div className="policy-section">
          <h2>13. Children's Privacy</h2>
          <p>
            The Services are primarily intended for use by gym members and authorized personnel. A1
            Fitness does not knowingly collect personal information from children in violation of
            applicable law.
          </p>
          <p>
            Where membership or services involve a minor, the gym should ensure that any required
            parental or guardian authorization is obtained in accordance with applicable law.
          </p>
          <p>
            If you believe that information belonging to a child has been collected improperly, please
            contact us so that we can review the matter.
          </p>
        </div>

        {/* Section 14 */}
        <div className="policy-section">
          <h2>14. Third-Party Services and Links</h2>
          <p>
            The Services may integrate with or link to third-party services, including Meta, WhatsApp,
            hosting providers, payment providers, or other external services. Those third parties may
            have their own privacy policies and terms.
          </p>
          <p>
            A1 Fitness is not responsible for the privacy practices of independent third-party
            services. We recommend reviewing the privacy policies of any third-party service before
            providing information directly to that service.
          </p>
        </div>

        {/* Section 15 */}
        <div className="policy-section">
          <h2>15. International Data Processing</h2>
          <p>
            Depending on the infrastructure and third-party services used by A1 Fitness, personal
            information may be processed or stored in countries other than the country where the user
            resides.
          </p>
          <p>
            Where applicable, we will take reasonable steps to ensure that such processing is carried
            out in accordance with applicable data protection requirements.
          </p>
        </div>

        {/* Section 16 */}
        <div className="policy-section">
          <h2>16. Changes to This Privacy Policy</h2>
          <p>We may update this Privacy Policy from time to time to reflect:</p>
          <ul>
            <li>Changes to the Services</li>
            <li>Changes to our data practices</li>
            <li>Changes to third-party integrations</li>
            <li>Changes in legal or regulatory requirements</li>
            <li>Security or operational improvements</li>
          </ul>
          <p>
            When we make changes, we will update the "Last Updated" date at the beginning of this
            Privacy Policy. We encourage users to periodically review this page for the latest
            information.
          </p>
        </div>

        {/* Section 17 */}
        <div className="policy-section">
          <h2>17. Meta Platform and WhatsApp Integration</h2>
          <p>
            Where A1 Fitness uses Meta platform technologies, including WhatsApp Business Platform
            services, the integration may involve processing information required to authenticate the
            application, send messages, receive delivery information, or otherwise provide the
            requested communication functionality.
          </p>
          <p>
            A1 Fitness uses Meta-related services only for legitimate business and service purposes
            associated with the A1 Fitness platform. Information processed through Meta services may
            also be subject to Meta's applicable terms and privacy policies.
          </p>
          <p>
            A1 Fitness does not sell personal information obtained through Meta platform integrations.
            If a user has questions regarding information processed through a Meta integration, they
            may contact A1 Fitness using the contact details below.
          </p>
        </div>

        {/* Section 18 */}
        <div className="policy-section">
          <h2>18. Contact Us</h2>
          <p>
            If you have questions, concerns, requests, or complaints regarding this Privacy Policy or
            the handling of your personal information, please contact A1 Fitness.
          </p>
          <div className="policy-contact">
            <p><strong>A1 Fitness</strong></p>
            <p><strong>Legal/Business Name:</strong> [Insert Legal Business Name]</p>
            <p><strong>Address:</strong> [Insert Business Address]</p>
            <p><strong>Email:</strong> [Insert Privacy/Support Email]</p>
            <p><strong>Phone:</strong> [Insert Business Phone Number]</p>
            <p><strong>Website:</strong> [Insert Website URL]</p>
          </div>
          <p style={{ marginTop: "1rem" }}>
            For privacy-related requests, please include enough information for us to understand and
            verify your request.
          </p>
        </div>

        {/* Section 19 */}
        <div className="policy-section">
          <h2>19. Consent and Acknowledgement</h2>
          <p>
            By using the A1 Fitness Services, you acknowledge that you have had an opportunity to
            review this Privacy Policy. Where applicable, A1 Fitness will obtain consent or rely on
            another lawful basis before processing personal information for purposes that require it.
          </p>
        </div>

        <div className="policy-copyright">
          &copy; 2026 A1 Fitness. All rights reserved.
        </div>
      </div>

      {/* Minimal Footer */}
      <footer className="policy-footer">
        <div className="policy-footer-links">
          <Link to="/privacy-policy">Privacy Policy</Link>
          <Link to="/login">Login</Link>
        </div>
        <p>&copy; {new Date().getFullYear()} A1 Fitness. All rights reserved.</p>
      </footer>
    </div>
  );
}
