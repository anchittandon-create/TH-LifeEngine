import Link from 'next/link';
import { Button } from '../../components/ui/Button';
import styles from './page.module.css';

export default function Home() {
  return (
    <div className={styles.container}>
      {/* Hero Section */}
      <section className={`card ${styles.hero}`}>
        <div className={styles.logo}>
          ⚡
        </div>
        <h1 className={styles.heroTitle}>
          TH+ LifeEngine
        </h1>
        <p className={styles.heroSubtitle}>
          Personalized, evidence-aligned health plans powered by Gemini AI.
          Transform your wellness journey with intelligent recommendations tailored to your unique needs.
        </p>
        <div className={styles.heroActions}>
          <Link href="/lifeengine/create">
            <Button>
              <svg className={styles.icon} viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 4v16m8-8H4"/>
              </svg>
              Create Your Plan
            </Button>
          </Link>
          <Link href="/lifeengine/profiles">
            <Button variant="ghost">
              <svg className={styles.icon} viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
              </svg>
              Manage Profiles
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section className={styles.features}>
        <h2 className={styles.featuresTitle}>
          Why Choose LifeEngine?
        </h2>
        <div className={styles.featuresGrid}>
          <div className={`card ${styles.featureCard}`}>
            <div className={`${styles.featureIcon} ${styles.ai}`}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
              </svg>
            </div>
            <h3 className={styles.featureTitle}>
              AI-Powered Insights
            </h3>
            <p className={styles.featureText}>
              Advanced Gemini AI analyzes your health data to create personalized, evidence-based recommendations.
            </p>
          </div>

          <div className={`card ${styles.featureCard}`}>
            <div className={`${styles.featureIcon} ${styles.evidence}`}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <h3 className={styles.featureTitle}>
              Evidence-Based Plans
            </h3>
            <p className={styles.featureText}>
              Every recommendation is backed by scientific research and tailored to your specific health goals.
            </p>
          </div>

          <div className={`card ${styles.featureCard}`}>
            <div className={`${styles.featureIcon} ${styles.holistic}`}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m-6-2v2m0-6V4"/>
              </svg>
            </div>
            <h3 className={styles.featureTitle}>
              Holistic Approach
            </h3>
            <p className={styles.featureText}>
              Comprehensive plans covering nutrition, exercise, sleep, and mental wellness for complete health optimization.
            </p>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className={`card ${styles.ctaSection}`}>
        <h2 className={styles.ctaTitle}>
          Ready to Transform Your Health?
        </h2>
        <p className={styles.ctaText}>
          Get started in minutes with our intelligent health assessment and receive your personalized plan.
        </p>
        <Link href="/lifeengine/create">
          <Button size="md">
            Start Your Journey
            <svg className={styles.iconRight} viewBox="0 0 24 24" fill="currentColor">
              <path d="M13 7l5 5m0 0l-5 5m5-5H6"/>
            </svg>
          </Button>
        </Link>
      </section>
    </div>
  );
}
