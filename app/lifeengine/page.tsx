import Link from "next/link";
import styles from "./Home.module.css";

const highlights = [
  {
    title: "Verbal RAG",
    text: "Embedded safety and diet rules keep every Gemini plan grounded in TH+ guidance.",
  },
  {
    title: "Profile Smart",
    text: "Gender, age, region, and medical flags personalise every recommendation.",
  },
  {
    title: "On-Page Plans",
    text: "Create a plan and see the structured JSON output instantly—export when ready.",
  },
  {
    title: "Offline Friendly",
    text: "Profiles live in localStorage, while the server mirrors them for live sessions.",
  },
];

export default function LifeengineHome() {
  return (
    <div>
      <section className={styles.hero}>
        <h1 className={styles.heroTitle}>
          TH+ LifeEngine — Verbal Edition
        </h1>
        <p className={styles.heroText}>
          A streamlined wellness director that blends conversational rule tables with
          Gemini 1.5 Flash. Build, review, and refine personalised plans without any
          external databases or vector stores.
        </p>
        <div className={styles.ctaRow}>
          <Link href="/lifeengine/create" className={styles.primary}>
            Launch Plan Wizard
          </Link>
          <Link href="/lifeengine/dashboard" className={styles.secondary}>
            View Dashboard
          </Link>
        </div>
      </section>

      <section className={styles.grid}>
        {highlights.map((item) => (
          <article key={item.title} className={styles.card}>
            <h2 className={styles.cardTitle}>{item.title}</h2>
            <p className={styles.cardText}>{item.text}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
