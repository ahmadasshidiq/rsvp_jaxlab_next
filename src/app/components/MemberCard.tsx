"use client";

export type MemberType = "VIP" | "Reguler";

const CARD_PRICES: Record<MemberType, number> = {
  VIP: process.env.RSVP_VIP_PRICE ? Number(process.env.RSVP_VIP_PRICE) : 1927000,
  Reguler: process.env.RSVP_REGULER_PRICE ? Number(process.env.RSVP_REGULER_PRICE) :   50000,
};

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

interface MemberCardProps {
  type: MemberType;
  selected: boolean;
  onSelect: (type: MemberType) => void;
}

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const TicketIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 9a3 3 0 010-6h20a3 3 0 010 6" />
    <path d="M2 15a3 3 0 000 6h20a3 3 0 000-6" />
    <path d="M6 9v6M18 9v6" />
  </svg>
);

const BoxIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
);

const StarIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="0">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const vipBenefits = [
  { icon: <TicketIcon />, text: "VIP Table Seating" },
  { icon: <BoxIcon />, text: "Fat Fasting Full Set (Retail Value Rp 1.927.000)" },
  { icon: <TicketIcon />, text: "Blood Sugar Test" },
  { icon: <TicketIcon />, text: "Coffee Break & Refreshment" },
  { icon: <TicketIcon />, text: "Join WhatsApp Community Jaxlab" },
  { icon: <TicketIcon />, text: "Free Webinar Class bersama Dr. Razin" },
  { icon: <StarIcon />, text: "Priority Q&A Session" },
  { icon: <StarIcon />, text: "Networking Session" },
];

const regulerBenefits = [
  { icon: <TicketIcon />, text: "Theater Seating" },
  { icon: <BoxIcon />, text: "PR Package Olive Oil 30 ML" },
  { icon: <TicketIcon />, text: "Join WhatsApp Community Jaxlab" },
  { icon: <TicketIcon />, text: "Free Webinar Class bersama Dr. Razin" },
  { icon: <TicketIcon />, text: "Wellness Education Session" },
  { icon: <TicketIcon />, text: "Event Access" },
];

export default function MemberCard({ type, selected, onSelect }: MemberCardProps) {
  const isVIP = type === "VIP";
  const benefits = isVIP ? vipBenefits : regulerBenefits;

  return (
    <div
      className={`member-card ${type.toLowerCase()} ${selected ? "selected" : ""}`}
      onClick={() => onSelect(type)}
      role="button"
      aria-pressed={selected}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(type);
        }
      }}
      id={`member-card-${type.toLowerCase()}`}
    >
      <div className="selected-check-ring">
        <CheckIcon />
      </div>

      <div className="member-card-badge">
        {isVIP && <StarIcon />}
        {type}
      </div>

      <div className="member-card-title">{isVIP ? "VIP Member" : "Reguler"}</div>
      <div className="member-card-subtitle">
        {isVIP
          ? "Pengalaman eksklusif & privilege khusus"
          : "Nikmati acara dengan benefit standar"}
      </div>

      <div className="member-card-price">
        <span className="member-card-price-label">Booking</span>
        <span className="member-card-price-value">{formatRupiah(CARD_PRICES[type])}</span>
      </div>

      <div className="member-card-divider" />

      <div className="member-benefits-label">Yang kamu dapat:</div>
      <ul className="member-benefits">
        {benefits.map((benefit, idx) => (
          <li key={idx} className="member-benefit-item">
            <span className="benefit-icon">{benefit.icon}</span>
            <span>{benefit.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
