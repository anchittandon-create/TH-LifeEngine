import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.container}>
      <section className={styles.card}>
        <h1 className={styles.title}>TH+ LifeEngine</h1>
        <p className={styles.description}>
          Personalized, evidence-aligned plans with Gemini.
        </p>
        <div className={styles.actions}>
          <a className="btn" href="/lifeengine/create">
            Create Plan
          </a>
          <a className="btn ghost" href="/lifeengine/profiles">
            Manage Profiles
          </a>
        </div>
      </section>
    </div>
  );
}
