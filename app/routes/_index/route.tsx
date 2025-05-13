import styles from "./styles.module.css";

export default function App() {
  return (
    <div className={styles.index}>
      <div className={styles.content}>
        <h1 className={styles.heading}>Boxy Portál</h1>
        <p className={styles.subtext}>Kattints az alábbi hivatkozásra, ha meg szeretnéd nyitni a Boxy Portált.</p>
        <a
          href="https://portal.boxygroup.hu/"
          className={styles.link}
          target="_blank"
        >
          Ugrás a Boxy Portálra
        </a>

      </div>
    </div>
  );
}
