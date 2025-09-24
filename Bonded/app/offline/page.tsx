import Link from "next/link";

import styles from "./page.module.css";

export const metadata = {
  title: "Offline • Bonded",
};

export default function OfflinePage() {
  return (
    <main className={styles.container}>
      <div className={styles.card}>
        <h1>Looks like you&apos;re offline</h1>
        <p>
          Bonded keeps a lightweight cache of your queue so you can still review matches and notes
          without a connection. We&apos;ll sync everything the moment you come back online.
        </p>
        <div className={styles.actions}>
          <Link href="/">Return to matchmaking</Link>
          <a href="https://status.base.org" target="_blank" rel="noreferrer">
            Check network status
          </a>
        </div>
      </div>
    </main>
  );
}
