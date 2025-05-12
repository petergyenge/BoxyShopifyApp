import styles from "./styles.module.css";

export default function App() {

  return (
    <div className={styles.index}>
      <div className={styles.content}>
        <h1 className={styles.heading}>Lépj be a Boxy Portál felületére</h1>
        <a
          href="https://b2bp-test.apps.boxygroup.hu/"
          className={styles.button}
        >
          Belépés a Boxy Portálra
        </a>
      </div>
    </div>
  );
}
