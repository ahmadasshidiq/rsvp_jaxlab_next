"use client";

import type { MemberType } from "./MemberCard";

interface SuccessMessageProps {
  nama: string;
  memberType: MemberType;
  registrationId: number;
  onClose: () => void;
}

export default function SuccessMessage({
  nama,
  memberType,
  registrationId,
  onClose,
}: SuccessMessageProps) {
  const isVIP = memberType === "VIP";

  return (
    <div className="success-overlay" role="dialog" aria-modal="true" aria-label="Pendaftaran berhasil">
      <div className="success-card">
        <div className="success-icon">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <h2 className="success-title">Pendaftaran Berhasil!</h2>
        <p className="success-subtitle">
          Terima kasih, <strong>{nama}</strong>!
          <br />
          RSVP kamu telah tercatat. Kami akan menghubungi kamu melalui email
          dengan detail selanjutnya.
        </p>

        <div className="success-info">
          <div className="success-info-row">
            <span className="success-info-label">Nama</span>
            <span className="success-info-value">{nama}</span>
          </div>
          <div className="success-info-row">
            <span className="success-info-label">Kategori</span>
            <span className={`success-info-value ${memberType.toLowerCase()}`}>
              {isVIP ? "⭐ " : "🎫 "}
              {memberType}
            </span>
          </div>
          <div className="success-info-row">
            <span className="success-info-label">ID Pendaftaran</span>
            <span className="success-info-value" style={{ fontFamily: "monospace", fontSize: 13 }}>
              #{String(registrationId).padStart(6, "0")}
            </span>
          </div>
        </div>

        <div
          style={{
            padding: "14px 18px",
            borderRadius: 10,
            background: isVIP
              ? "rgba(245,158,11,0.06)"
              : "rgba(26,77,46,0.04)",
            border: `1px solid ${isVIP ? "rgba(245,158,11,0.15)" : "rgba(26,77,46,0.12)"}`,
            fontSize: 13,
            color: "var(--text-secondary)",
            textAlign: "left",
            marginBottom: 24,
            lineHeight: 1.7,
          }}
        >
          <strong style={{ color: isVIP ? "#b8860b" : "var(--primary-green)" }}>
            {isVIP ? "⭐ Benefit VIP kamu:" : "🎫 Benefit Reguler kamu:"}
          </strong>
          <br />
          {isVIP ? (
            <>
              ✓ Tiket acara (akses eksklusif)
              <br />✓ 1 set FF 72 (edisi terbatas)
            </>
          ) : (
            <>
              ✓ Tiket acara
              <br />✓ 1 pcs produk JaxLab
            </>
          )}
        </div>

        <button
          id="btn-back-home"
          className="success-back-btn"
          onClick={onClose}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Kembali ke Halaman Utama
        </button>
      </div>
    </div>
  );
}
