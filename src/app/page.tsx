"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import HeroBanner from "./components/HeroBanner";
import MemberCard, { type MemberType } from "./components/MemberCard";
import RSVPForm from "./components/RSVPForm";

export default function Home() {
  const [selectedMember, setSelectedMember] = useState<MemberType | null>(null);
  const formSectionRef = useRef<HTMLElement>(null);
  const [paymentNotice, setPaymentNotice] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get("payment");
    const orderId = params.get("order_id");
    if (!payment || !orderId) return;

    let active = true;
    fetch(`/api/rsvp/status?order_id=${encodeURIComponent(orderId)}`)
      .then((res) => res.json().then((data) => ({ res, data })))
      .then(({ res, data }) => {
        if (!active) return;
        if (res.ok) {
          if (data.paymentStatus === "paid") {
            setPaymentNotice(`Pembayaran ${orderId} sudah berhasil.`);
          } else if (data.paymentStatus === "pending") {
            setPaymentNotice(`Pembayaran ${orderId} masih menunggu konfirmasi.`);
          } else {
            setPaymentNotice(`Status pembayaran ${orderId}: ${data.paymentStatus}.`);
          }
        } else {
          setPaymentNotice(data.error || "Gagal mengecek status pembayaran.");
        }
      })
      .catch(() => {
        if (active) setPaymentNotice("Gagal mengecek status pembayaran.");
      });

    return () => {
      active = false;
    };
  }, []);

  const handleMemberSelect = (type: MemberType) => {
    setSelectedMember(type);
    setTimeout(() => {
      formSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 200);
  };

  const handleReset = () => {
    setSelectedMember(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <HeroBanner />

      {paymentNotice && (
        <section className="payment-status-banner">
          <div className="container">
            <div className="payment-status-box">{paymentNotice}</div>
          </div>
        </section>
      )}

      <section className="why-section" id="why-attend">
        <div className="why-container">
          <div className="why-content">
            <div className="why-kicker">
              <span aria-hidden="true" />
              <p>Grand Launching FF72 Indonesia</p>
            </div>

            <h2>Mengapa Harus Hadir di Event Ini?</h2>

            {/* <p className="why-lead">
              Dapatkan wawasan, inspirasi, dan pengalaman eksklusif untuk
              mendukung perjalanan hidup sehat yang lebih terarah,
              berkelanjutan, dan terasa nyata.
            </p> */}

            <div className="why-list">
              <div className="why-item">
                <h3>Edukasi Langsung dari Ahlinya</h3>
                <p>
                  Dapatkan insight seputar kesehatan metabolik, pola hidup sehat, 
                  dan konsep Fat Fasting 72 langsung bersama Dr. Razin.
                </p>
              </div>

              <div className="why-item">
                <h3>Pelajari Strategi Hidup Sehat yang Berkelanjutan</h3>
                <p>
                  Temukan cara membangun kebiasaan sehat alami melalui nutrisi yang tepat, 
                  gaya hidup seimbang, dan pendekatan wellness modern.
                </p>
              </div>

              <div className="why-item">
                <h3>Bergabung dengan Wellness Community</h3>
                <p>
                  Terhubung dengan individu yang memiliki tujuan hidup sehat yang sama, 
                  saling berbagi pengalaman, dan bertumbuh bersama dalam komunitas positif.
                </p>
              </div>

              <div className="why-item">
                <h3>Kenali Gerakan Transformasi Kesehatan JaxLab</h3>
                <p>
                  Pelajari bagaimana JaxLab dan Fat Fasting 72 membantu masyarakat Indonesia 
                  membangun kesehatan yang lebih baik melalui perubahan gaya hidup yang berkelanjutan.
                </p>
              </div>
            </div>
          </div>

          <div className="why-media" aria-label="Speaker highlight">
            <div className="why-portrait-stage">
              <img
                src="/dokter-razin.png"
                alt="Dr. Mohd Razin bin Jaafar"
                className="why-portrait"
              />
            </div>

            <div className="why-speaker-card">
              <p className="why-speaker-label">Featured Speaker</p>
              <h3>Dr. Mohd Razin bin Jaafar</h3>
              <p>MD. RMP. (Founder of Greenzone Malaysia & Fat Fasting protocol)</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section member-section" id="pilih-member" ref={formSectionRef}>
        <div className="container member-section-container">
          <div className="section-header">
            {/* <span className="section-label">Langkah 1</span> */}
            <h2 className="section-title">Pilih Kategori Member</h2>
            <p className="section-description">
              Pilih paket yang sesuai dengan kebutuhanmu
            </p>
          </div>

          <div className={`member-rsvp-layout ${selectedMember ? "with-form" : ""}`}>
            <div className="member-grid">
              {(!selectedMember || selectedMember === "VIP") && (
                <MemberCard
                  type="VIP"
                  selected={selectedMember === "VIP"}
                  onSelect={handleMemberSelect}
                />
              )}
              {(!selectedMember || selectedMember === "Reguler") && (
                <MemberCard
                  type="Reguler"
                  selected={selectedMember === "Reguler"}
                  onSelect={handleMemberSelect}
                />
              )}
            </div>

            {selectedMember && (
              <div className="member-form-panel">
                <RSVPForm
                  memberType={selectedMember}
                  onChangeMember={() => {
                    setSelectedMember(null);
                    document.getElementById("pilih-member")?.scrollIntoView({ behavior: "smooth" });
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </section>

      <footer className="footer" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
        <p>
          &copy; 2026 <Link href="https://jaxlabofficial.id"><strong>JaxLab</strong></Link>. All rights reserved.
        </p>
      </footer>
    </>
  );
}
