"use client";

import { useEffect, useMemo, useState } from "react";

const EVENT_DATE = new Date("2026-06-10T19:00:00+07:00");

function getCountdown() {
  const diff = Math.max(EVENT_DATE.getTime() - Date.now(), 0);

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

export default function HeroBanner() {
  const [countdown, setCountdown] = useState(getCountdown);

  const countdownItems = useMemo(
    () => [
      { label: "Hari", value: countdown.days },
      { label: "Jam", value: countdown.hours },
      { label: "Menit", value: countdown.minutes },
      { label: "Detik", value: countdown.seconds },
    ],
    [countdown],
  );

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCountdown(getCountdown());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const scrollToForm = () => {
    document.getElementById("pilih-member")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="event-poster" aria-label="Poster event RSVP JaxLab">
      <div className="event-poster-media">
        <img
          src="/JarolivaOrganic_1.png"
          alt="Poster acara Jaroliva Organic"
          className="event-poster-image"
        />
        <div className="event-poster-shade" />
      </div>

      <div className="event-poster-content">
        <p className="event-poster-kicker">RSVP Event</p>
        <h1 className="event-poster-title"><img src="/jaxlab-white.png" alt="Logo JaxLab" className="event-poster-logo"/></h1>
        <p className="event-poster-subtitle">Jaroliva Organic Gathering</p>
        <p className="event-poster-date">10 Juni 2026 | 19.00 WIB</p>

        <div className="event-countdown" aria-label="Hitung mundur menuju event">
          {countdownItems.map((item) => (
            <div className="event-countdown-item" key={item.label}>
              <strong>{String(item.value).padStart(2, "0")}</strong>
              <p className="event-poster-date" style={{fontSize: "12px"}}>{item.label}</p>
            </div>
          ))}
        </div>

        <button type="button" className="event-poster-cta" onClick={scrollToForm}>
          Mulai RSVP
        </button>
      </div>
    </section>
  );
}
