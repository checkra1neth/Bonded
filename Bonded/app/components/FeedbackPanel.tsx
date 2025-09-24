"use client";

import React, { useEffect, useMemo, useState, type FormEvent } from "react";

import { useAnalytics } from "../hooks/useAnalytics";
import type { FeedbackInsights } from "../hooks/useLaunchMetrics";

import styles from "./FeedbackPanel.module.css";

type FeedbackSentiment = "positive" | "neutral" | "negative";

interface FeedbackPanelProps {
  stats: FeedbackInsights;
  onSubmitSuccess: (sentiment: FeedbackSentiment) => void;
}

interface FormState {
  name: string;
  contact: string;
  topic: string;
  sentiment: FeedbackSentiment;
  message: string;
}

const initialFormState: FormState = {
  name: "",
  contact: "",
  topic: "onboarding",
  sentiment: "positive",
  message: "",
};

export function FeedbackPanel({ stats, onSubmitSuccess }: FeedbackPanelProps) {
  const { trackEvent } = useAnalytics();
  const [form, setForm] = useState<FormState>(() => ({ ...initialFormState }));
  const [isSubmitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [lastSubmittedSentiment, setLastSubmittedSentiment] = useState<FeedbackSentiment | null>(null);

  useEffect(() => {
    trackEvent({
      name: "feedback.panel_viewed",
      category: "feedback",
      properties: { topic: initialFormState.topic },
    });
  }, [trackEvent]);

  const npsCopy = useMemo(() => {
    if (stats.npsScore >= 50) {
      return "Promoters are rallying behind the launch.";
    }
    if (stats.npsScore >= 10) {
      return "Solid sentiment with room to delight power users.";
    }
    return "Address detractor themes before scaling acquisition.";
  }, [stats.npsScore]);

  const handleChange = (field: keyof FormState) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const value = event.target.value;
    setForm((current) => ({ ...current, [field]: value }));
  };

  useEffect(() => {
    if (status === "success" && lastSubmittedSentiment) {
      onSubmitSuccess(lastSubmittedSentiment);
      setLastSubmittedSentiment(null);
    }
  }, [lastSubmittedSentiment, onSubmitSuccess, status]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (form.message.trim().length < 8) {
      setStatus("error");
      setStatusMessage("Share a bit more detail so the team can act quickly.");
      return;
    }

    setSubmitting(true);
    setStatus("idle");
    setStatusMessage(null);

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name || undefined,
          contact: form.contact || undefined,
          topic: form.topic,
          sentiment: form.sentiment,
          message: form.message.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to submit feedback (${response.status})`);
      }

      trackEvent({
        name: "feedback.submitted",
        category: "feedback",
        properties: { sentiment: form.sentiment, topic: form.topic },
      });

      setStatus("success");
      setStatusMessage("Feedback queued for launch triage. Thank you!");
      setForm(() => ({ ...initialFormState }));
      setLastSubmittedSentiment(form.sentiment);
    } catch (error) {
      trackEvent({
        name: "feedback.submit_failed",
        category: "feedback",
        properties: {
          sentiment: form.sentiment,
          message: error instanceof Error ? error.message : "unknown",
        },
      });
      setStatus("error");
      setStatusMessage("Something went wrong. Try again or ping the concierge channel.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className={styles.panel} aria-labelledby="feedback-heading">
      <header className={styles.header}>
        <div>
          <h3 id="feedback-heading">Launch feedback loop</h3>
          <p>{npsCopy}</p>
        </div>
        <div className={styles.stats}>
          <div>
            <strong>{stats.npsScore}</strong>
            <span>NPS</span>
          </div>
          <div>
            <strong>{stats.promoters}</strong>
            <span>Promoters</span>
          </div>
          <div>
            <strong>{stats.opportunities}</strong>
            <span>Opportunities</span>
          </div>
          <div>
            <strong>{stats.total}</strong>
            <span>Total notes</span>
          </div>
        </div>
      </header>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.row}>
          <label>
            Focus area
            <select value={form.topic} onChange={handleChange("topic")}>
              <option value="onboarding">Onboarding</option>
              <option value="matching">Matching</option>
              <option value="premium">Premium</option>
              <option value="support">Support</option>
              <option value="bug">Bug / Incident</option>
            </select>
          </label>

          <label>
            Sentiment
            <select value={form.sentiment} onChange={handleChange("sentiment")}> 
              <option value="positive">Positive</option>
              <option value="neutral">Neutral</option>
              <option value="negative">Needs attention</option>
            </select>
          </label>
        </div>

        <div className={styles.row}>
          <label>
            Name or team
            <input value={form.name} onChange={handleChange("name")} placeholder="Optional" />
          </label>
          <label>
            Contact
            <input
              value={form.contact}
              onChange={handleChange("contact")}
              placeholder="Warpcast, email, or Discord"
            />
          </label>
        </div>

        <label className={styles.messageLabel}>
          What should we know before launch?
          <textarea
            value={form.message}
            onChange={handleChange("message")}
            placeholder="Share context, impact, and any links for the ops team."
            rows={4}
          />
        </label>

        {statusMessage ? (
          <div className={`${styles.status} ${status === "success" ? styles.success : styles.error}`}>
            {statusMessage}
          </div>
        ) : null}

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Submitting…" : "Send feedback"}
        </button>
      </form>
    </section>
  );
}
