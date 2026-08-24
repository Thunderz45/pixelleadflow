"use client";

import React from "react";

export default function PrivacyPolicyPage() {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header Panel */}
      <header className="mb-6">
        <h2 className="font-headline-lg text-3xl font-extrabold text-on-surface mb-2">Privacy Policy</h2>
        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-on-surface-variant/80 bg-surface-container/40 border border-outline-variant/30 px-3 py-1.5 rounded-full w-fit">
          <span>Effective Date: June 28, 2026</span>
          <span className="w-1.5 h-1.5 rounded-full bg-outline-variant"></span>
          <span>Last Updated: June 28, 2026</span>
        </div>
      </header>

      {/* Content Container */}
      <div className="bg-white border border-outline-variant rounded-xl p-6 md:p-8 shadow-sm space-y-8">
        
        {/* Intro */}
        <div className="prose prose-slate max-w-none">
          <p className="text-body-md text-sm leading-relaxed text-on-surface-variant">
            Welcome to <strong>Pixel Lead Flow</strong>, a product developed and operated by <strong>Pixel Studio X</strong>.
          </p>
          <p className="text-body-md text-sm leading-relaxed text-on-surface-variant mt-3">
            This Privacy Policy explains how we collect, use, store, and protect your information when you use the Pixel Lead Flow Web Dashboard, Chrome Extension, and related services. By using our services, you agree to the practices described in this Privacy Policy.
          </p>
        </div>

        <hr className="border-outline-variant/60" />

        {/* Sections */}
        <div className="space-y-6">
          <section className="space-y-2">
            <h3 className="font-headline-sm text-lg font-bold text-on-surface">1. Who We Are</h3>
            <div className="text-body-md text-sm leading-relaxed text-on-surface-variant space-y-1 pl-4 border-l-2 border-primary/20">
              <p><strong>Product:</strong> Pixel Lead Flow</p>
              <p><strong>Platform:</strong> Pixel Studio X</p>
              <p className="mt-2">
                Pixel Lead Flow is a web-based dashboard and Chrome Extension designed to help users manage business lead research and workflow efficiently through a secure, authenticated platform.
              </p>
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="font-headline-sm text-lg font-bold text-on-surface">2. Information We Collect</h3>
            <p className="text-body-md text-sm leading-relaxed text-on-surface-variant">
              We collect only the information necessary to provide and improve our services.
            </p>
            
            <div className="space-y-4 pl-4 border-l-2 border-primary/20 mt-2">
              <div>
                <h4 className="font-bold text-sm text-on-surface mb-1">Account Information</h4>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  When you create an account or sign in, we may collect: Name (if provided), Email address, Authentication information, and User account identifier. This information is used solely for authentication, account management, and providing access to the Service.
                </p>
              </div>
              
              <div>
                <h4 className="font-bold text-sm text-on-surface mb-1">User Data</h4>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Information that you choose to create or save while using the Service, including: Saved leads, Notes, Tags, Categories, User preferences, Export history.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-sm text-on-surface mb-1">Technical Information</h4>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  To maintain the reliability and security of the Service, we may collect limited technical information, including: Browser type, Operating system, Device type, Extension version, Error logs, and Diagnostic information. This information is used only for security, troubleshooting, and service improvement.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="font-headline-sm text-lg font-bold text-on-surface">3. How We Use Your Information</h3>
            <p className="text-body-md text-sm leading-relaxed text-on-surface-variant">
              Your information is used to:
            </p>
            <ul className="list-disc pl-6 text-xs text-on-surface-variant space-y-1">
              <li>Authenticate your account</li>
              <li>Provide access to the dashboard and Chrome Extension</li>
              <li>Synchronize your data securely</li>
              <li>Save your work and preferences</li>
              <li>Improve product performance</li>
              <li>Detect and prevent abuse or unauthorized access</li>
              <li>Respond to customer support requests</li>
              <li>Maintain the security and reliability of the Service</li>
            </ul>
            <p className="text-xs font-semibold text-primary mt-2">
              We do not use your personal information for advertising purposes.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-headline-sm text-lg font-bold text-on-surface">4. Chrome Extension Permissions</h3>
            <p className="text-body-md text-sm leading-relaxed text-on-surface-variant">
              The Pixel Lead Flow Chrome Extension requests only the permissions required for its intended functionality. These permissions are used to:
            </p>
            <ul className="list-disc pl-6 text-xs text-on-surface-variant space-y-1">
              <li>Authenticate your account</li>
              <li>Connect securely with the Pixel Lead Flow dashboard</li>
              <li>Process user-initiated actions</li>
              <li>Synchronize information between the dashboard and extension</li>
              <li>Maintain normal application functionality</li>
            </ul>
            <p className="text-xs text-on-surface-variant mt-2">
              The Extension does not request permissions unrelated to its intended purpose.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-headline-sm text-lg font-bold text-on-surface">5. Data Sharing</h3>
            <p className="text-body-md text-sm leading-relaxed text-on-surface-variant">
              We respect your privacy. We do not sell, rent, or trade your personal information.
            </p>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Your information may only be shared:
            </p>
            <ul className="list-disc pl-6 text-xs text-on-surface-variant space-y-1">
              <li>When required by applicable law.</li>
              <li>To protect our legal rights or prevent fraud.</li>
              <li>With trusted service providers who help operate our platform under appropriate confidentiality obligations.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="font-headline-sm text-lg font-bold text-on-surface">6. Data Security</h3>
            <p className="text-body-md text-sm leading-relaxed text-on-surface-variant">
              We use industry-standard security measures to help protect your information, including:
            </p>
            <ul className="list-disc pl-6 text-xs text-on-surface-variant space-y-1">
              <li>Secure HTTPS encryption</li>
              <li>Authentication controls</li>
              <li>Access restrictions</li>
              <li>Secure server infrastructure</li>
            </ul>
            <p className="text-xs text-on-surface-variant mt-2 italic">
              Although we strive to protect your information, no method of electronic transmission or storage can be guaranteed to be completely secure.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-headline-sm text-lg font-bold text-on-surface">7. Cookies and Local Storage</h3>
            <p className="text-body-md text-sm leading-relaxed text-on-surface-variant">
              Pixel Lead Flow may use cookies, browser storage, and local storage to: Keep you signed in, Store user preferences, Maintain your session, and Improve the user experience.
            </p>
            <p className="text-xs text-on-surface-variant">
              These technologies are used only to support the functionality of our services.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-headline-sm text-lg font-bold text-on-surface">8. Data Retention</h3>
            <p className="text-body-md text-sm leading-relaxed text-on-surface-variant">
              We retain your information only for as long as necessary to: Provide our services, Maintain your account, Comply with legal obligations, Resolve disputes, and Enforce our policies.
            </p>
            <p className="text-xs text-on-surface-variant">
              When information is no longer required, it will be securely deleted or anonymized where appropriate.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-headline-sm text-lg font-bold text-on-surface">9. Third-Party Services</h3>
            <p className="text-body-md text-sm leading-relaxed text-on-surface-variant">
              Our platform may use trusted third-party providers to support services such as: Cloud hosting, Authentication, Database infrastructure, Email delivery, and Performance monitoring.
            </p>
            <p className="text-xs text-on-surface-variant">
              These providers receive only the information necessary to perform services on our behalf.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-headline-sm text-lg font-bold text-on-surface">10. Your Rights</h3>
            <p className="text-body-md text-sm leading-relaxed text-on-surface-variant">
              Depending on applicable laws, you may have the right to: Access your personal information, Correct inaccurate information, Request deletion of your account, Request deletion of your stored data, and Contact us regarding privacy concerns.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-headline-sm text-lg font-bold text-on-surface">11. Children's Privacy</h3>
            <p className="text-body-md text-sm leading-relaxed text-on-surface-variant">
              Pixel Lead Flow is not intended for children under the age of 13. We do not knowingly collect personal information from children.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-headline-sm text-lg font-bold text-on-surface">12. Changes to This Privacy Policy</h3>
            <p className="text-body-md text-sm leading-relaxed text-on-surface-variant">
              We may update this Privacy Policy from time to time. Any changes will be posted on this page together with an updated "Last Updated" date.
            </p>
            <p className="text-xs text-on-surface-variant">
              Your continued use of the Service after any updates constitutes acceptance of the revised Privacy Policy.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-headline-sm text-lg font-bold text-on-surface">13. Contact Us</h3>
            <p className="text-body-md text-sm leading-relaxed text-on-surface-variant">
              If you have any questions regarding this Privacy Policy, please contact us:
            </p>
            <div className="text-body-md text-sm leading-relaxed text-on-surface-variant space-y-1 pl-4 border-l-2 border-primary/20">
              <p><strong>Platform:</strong> Pixel Studio X</p>
              <p><strong>Product:</strong> Pixel Lead Flow</p>
              <p><strong>Website:</strong> <a href="https://leadflow.pixelstudiox.in" target="_blank" rel="noreferrer" className="text-primary hover:underline">https://leadflow.pixelstudiox.in</a></p>
              <p><strong>Email:</strong> <a href="mailto:support@pixelstudiox.in" className="text-primary hover:underline">support@pixelstudiox.in</a></p>
            </div>
          </section>
        </div>

      </div>
    </div>
  );
}
