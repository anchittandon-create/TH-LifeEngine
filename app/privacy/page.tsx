export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <div className="max-w-4xl mx-auto p-6 py-12 space-y-8">
        <h1 className="text-4xl font-bold text-gray-900">TH_LifeEngine Privacy Policy</h1>
        <p className="text-sm text-gray-600">
          <strong>Effective Date:</strong> November 1, 2025
        </p>

        <div className="bg-white rounded-2xl p-8 shadow-lg space-y-6">
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">Who We Are</h2>
            <p className="text-gray-700">
              TH_LifeEngine processes personal data for wellness plan generation via Custom GPT
              integration and APIs. Our service helps users create personalized yoga, diet, and
              holistic wellness plans.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">What We Collect</h2>
            <p className="text-gray-700 mb-2">We collect the following information:</p>
            <ul className="list-disc ml-6 text-gray-700 space-y-1">
              <li>
                <strong>Profile Data:</strong> Name, age, gender, location, goals, plan preferences
              </li>
              <li>
                <strong>Health Data:</strong> Activity level, sleep hours, stress level, chronic
                conditions, diet type
              </li>
              <li>
                <strong>Generated Plans:</strong> Personalized wellness plans created by our AI
              </li>
              <li>
                <strong>Technical Logs:</strong> Timestamps, IP addresses (for security), user
                agents
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">How We Use Data</h2>
            <ul className="list-disc ml-6 text-gray-700 space-y-1">
              <li>Generate personalized wellness plans tailored to your profile</li>
              <li>Store plans for review, analytics, and support purposes</li>
              <li>Maintain service reliability, security, and prevent abuse</li>
              <li>Improve our AI models and recommendation algorithms</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">
              What the Custom GPT Sends
            </h2>
            <p className="text-gray-700">
              When using our Custom GPT integration, the GPT may call <code>GET /api/v1/profiles/&#123;id&#125;</code>{" "}
              to fetch profile data and <code>POST /api/v1/plans</code> to store generated plans.
              No payment card data is collected.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">Legal Basis</h2>
            <p className="text-gray-700">
              We process your data based on your consent and/or our legitimate interests in
              delivering and improving the service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">Data Sharing</h2>
            <p className="text-gray-700">
              We do <strong>not sell</strong> your personal data. We may share limited data with:
            </p>
            <ul className="list-disc ml-6 text-gray-700 space-y-1">
              <li>
                Infrastructure providers (hosting, cloud services) under strict protection
                obligations
              </li>
              <li>Security and fraud prevention services</li>
              <li>Legal authorities when required by law</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">Security</h2>
            <p className="text-gray-700">
              We implement industry-standard security measures including:
            </p>
            <ul className="list-disc ml-6 text-gray-700 space-y-1">
              <li>Encryption in transit (HTTPS/TLS)</li>
              <li>Access controls and authentication</li>
              <li>Audit logging and monitoring</li>
              <li>Regular security reviews</li>
            </ul>
            <p className="text-gray-700 mt-2 text-sm italic">
              Note: No system is 100% secure. We cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">Data Retention</h2>
            <p className="text-gray-700">
              We retain your data for up to <strong>24 months</strong> unless you request deletion
              earlier. Technical logs may be retained longer for security purposes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">
              International Data Transfers
            </h2>
            <p className="text-gray-700">
              Your data may be processed in countries outside your residence. We ensure appropriate
              safeguards consistent with applicable law.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">Your Rights</h2>
            <p className="text-gray-700 mb-2">You have the right to:</p>
            <ul className="list-disc ml-6 text-gray-700 space-y-1">
              <li>
                <strong>Access:</strong> Request a copy of your personal data
              </li>
              <li>
                <strong>Correction:</strong> Update or correct inaccurate data
              </li>
              <li>
                <strong>Deletion:</strong> Request deletion of your data ("right to be forgotten")
              </li>
              <li>
                <strong>Portability:</strong> Receive your data in a machine-readable format
              </li>
              <li>
                <strong>Restriction/Objection:</strong> Limit or object to data processing
              </li>
              <li>
                <strong>Withdraw Consent:</strong> Withdraw consent where applicable
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">Children's Privacy</h2>
            <p className="text-gray-700">
              Our service is not intended for individuals under 13 years old. If you believe we have
              collected data from a child, please contact us immediately for removal.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">Policy Changes</h2>
            <p className="text-gray-700">
              We may update this policy from time to time. Changes will be posted with an updated
              effective date. Continued use of the service after changes constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">Contact Information</h2>
            <div className="bg-purple-50 rounded-xl p-4">
              <p className="text-gray-700">
                <strong>Data Controller:</strong> TH_LifeEngine
              </p>
              <p className="text-gray-700">
                <strong>Email:</strong>{" "}
                <a
                  href="mailto:privacy@lifeengine.example.com"
                  className="text-purple-600 hover:underline"
                >
                  privacy@lifeengine.example.com
                </a>
              </p>
              <p className="text-sm text-gray-600 mt-2">
                For data subject access requests, privacy questions, or to exercise your rights,
                please contact us at the email above.
              </p>
            </div>
          </section>
        </div>

        <div className="text-center text-sm text-gray-500">
          <p>Last updated: November 1, 2025</p>
        </div>
      </div>
    </main>
  );
}
