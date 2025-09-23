"use client";

import type { PremiumContentItem } from "@/lib/premium";

import styles from "./PremiumExclusiveContentPanel.module.css";

interface PremiumExclusiveContentPanelProps {
  items: PremiumContentItem[];
}

const formatAvailability = (item: PremiumContentItem): string => {
  return item.availability === "available" ? "Available now" : "Coming soon";
};

export function PremiumExclusiveContentPanel({ items }: PremiumExclusiveContentPanelProps) {
  if (!items.length) {
    return (
      <div className={styles.empty}>
        <p>Upgrade to unlock premium reports, vault lounges, and co-hosted activations.</p>
      </div>
    );
  }

  return (
    <section className={styles.container} aria-labelledby="premium-exclusive-content-title">
      <h3 id="premium-exclusive-content-title">Exclusive content</h3>
      <ul className={styles.list}>
        {items.map((item) => (
          <li key={item.id}>
            <div className={styles.header}>
              <span className={styles.tag}>{item.tag}</span>
              <span className={styles.availability} data-state={item.availability}>
                {formatAvailability(item)}
              </span>
            </div>
            <strong>{item.title}</strong>
            <p>{item.description}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
