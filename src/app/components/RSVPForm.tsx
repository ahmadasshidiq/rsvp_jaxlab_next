"use client";

import { useState } from "react";
import type { MemberType } from "./MemberCard";

interface FormData {
  nama: string;
  instansi: string;
  email: string;
  nomorTelepon: string;
  jumlahPax: number;
}

interface FormErrors {
  nama?: string;
  instansi?: string;
  email?: string;
  nomorTelepon?: string;
  jumlahPax?: string;
}

interface RSVPFormProps {
  memberType: MemberType;
  onChangeMember: () => void;
}

export default function RSVPForm({ memberType, onChangeMember }: RSVPFormProps) {
  const [formData, setFormData] = useState<FormData>({
    nama: "",
    instansi: "",
    email: "",
    nomorTelepon: "",
    jumlahPax: 1,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.nama.trim() || formData.nama.trim().length < 2) {
      newErrors.nama = "Nama harus diisi minimal 2 karakter";
    }

    if (!formData.instansi.trim() || formData.instansi.trim().length < 2) {
      newErrors.instansi = "Instansi harus diisi";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email || !emailRegex.test(formData.email)) {
      newErrors.email = "Format email tidak valid";
    }

    const phone = formData.nomorTelepon.replace(/\D/g, "");
    if (!phone || phone.length < 8 || phone.length > 15) {
      newErrors.nomorTelepon = "Nomor telepon tidak valid (8-15 digit)";
    }

    if (formData.jumlahPax < 1 || formData.jumlahPax > 10) {
      newErrors.jumlahPax = "Jumlah pax harus antara 1-10";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: keyof FormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    if (serverError) setServerError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setServerError("");

    try {
      const response = await fetch("/api/rsvp/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberType,
          nama: formData.nama,
          instansi: formData.instansi,
          email: formData.email,
          nomorTelepon: formData.nomorTelepon,
          jumlahPax: formData.jumlahPax,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setServerError(result.error || "Terjadi kesalahan. Silakan coba lagi.");
        return;
      }

      if (result.data && result.data.redirectUrl) {
        window.location.href = result.data.redirectUrl;
        return;
      }

      setServerError("Link pembayaran Midtrans tidak tersedia.");
    } catch {
      setServerError("Koneksi gagal. Pastikan Anda terhubung ke internet.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="form-card" id="form-rsvp">
          {/* Top accent line already in CSS */}

          {/* Selected member badge */}
          <div className={`form-selected-badge ${memberType.toLowerCase()}`}>
            <span>{memberType === "VIP" ? "⭐" : "🎫"}</span>
            Paket {memberType} dipilih
              <button
              onClick={onChangeMember}
              style={{
                border: "none",
                cursor: "pointer",
                color: "inherit",
                fontSize: 12,
                marginLeft: 8,
                padding: "2px 8px",
                borderRadius: 4,
                backgroundColor: "rgba(255,255,255,0.08)",
                fontFamily: "inherit",
              }}
            >
              Ubah
            </button>
          </div>

          <h2 className="form-title">Form Pendaftaran RSVP</h2>
          <p className="form-subtitle">
            Isi data diri Anda dengan benar untuk mengamankan tempat.
          </p>

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-grid">
              {/* Nama */}
              <div className="form-group full-width">
                <label htmlFor="field-nama" className="form-label">
                  Nama Lengkap <span>*</span>
                </label>
                <input
                  id="field-nama"
                  type="text"
                  className={`form-input ${errors.nama ? "error" : ""}`}
                  placeholder="Masukkan nama lengkap Anda"
                  value={formData.nama}
                  onChange={(e) => handleChange("nama", e.target.value)}
                  autoComplete="name"
                />
                {errors.nama && (
                  <span className="form-error">⚠ {errors.nama}</span>
                )}
              </div>

              {/* Instansi */}
              <div className="form-group full-width">
                <label htmlFor="field-instansi" className="form-label">
                  Instansi / Perusahaan <span>*</span>
                </label>
                <input
                  id="field-instansi"
                  type="text"
                  className={`form-input ${errors.instansi ? "error" : ""}`}
                  placeholder="Nama perusahaan, universitas, atau komunitas"
                  value={formData.instansi}
                  onChange={(e) => handleChange("instansi", e.target.value)}
                  autoComplete="organization"
                />
                {errors.instansi && (
                  <span className="form-error">⚠ {errors.instansi}</span>
                )}
              </div>

              {/* Email */}
              <div className="form-group">
                <label htmlFor="field-email" className="form-label">
                  Email <span>*</span>
                </label>
                <input
                  id="field-email"
                  type="email"
                  className={`form-input ${errors.email ? "error" : ""}`}
                  placeholder="nama@email.com"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  autoComplete="email"
                />
                {errors.email && (
                  <span className="form-error">⚠ {errors.email}</span>
                )}
              </div>

              {/* Nomor Telepon */}
              <div className="form-group">
                <label htmlFor="field-telepon" className="form-label">
                  Nomor Telepon <span>*</span>
                </label>
                <input
                  id="field-telepon"
                  type="tel"
                  className={`form-input ${errors.nomorTelepon ? "error" : ""}`}
                  placeholder="08xxxxxxxxxx"
                  value={formData.nomorTelepon}
                  onChange={(e) => handleChange("nomorTelepon", e.target.value)}
                  autoComplete="tel"
                />
                {errors.nomorTelepon && (
                  <span className="form-error">⚠ {errors.nomorTelepon}</span>
                )}
              </div>

              {/* Jumlah Pax */}
              <div className="form-group full-width">
                <label htmlFor="field-pax" className="form-label">
                  Jumlah Pax <span>*</span>
                </label>
                <div className="pax-input-wrapper">
                  <button
                    type="button"
                    className="pax-btn"
                    onClick={() =>
                      handleChange("jumlahPax", Math.max(1, formData.jumlahPax - 1))
                    }
                    disabled={formData.jumlahPax <= 1}
                    aria-label="Kurangi pax"
                  >
                    −
                  </button>
                  <input
                    id="field-pax"
                    type="number"
                    className="pax-input"
                    min={1}
                    max={10}
                    value={formData.jumlahPax}
                    onChange={(e) =>
                      handleChange(
                        "jumlahPax",
                        Math.min(10, Math.max(1, parseInt(e.target.value) || 1))
                      )
                    }
                    readOnly
                  />
                  <button
                    type="button"
                    className="pax-btn"
                    onClick={() =>
                      handleChange("jumlahPax", Math.min(10, formData.jumlahPax + 1))
                    }
                    disabled={formData.jumlahPax >= 10}
                    aria-label="Tambah pax"
                  >
                    +
                  </button>
                </div>
                <span
                  style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}
                >
                  Maksimal 10 orang per pendaftaran
                </span>
                {errors.jumlahPax && (
                  <span className="form-error">⚠ {errors.jumlahPax}</span>
                )}
              </div>
            </div>

            {/* Server error */}
            {serverError && (
              <div
                style={{
                  marginTop: 16,
                  padding: "12px 16px",
                  borderRadius: 8,
                  background: "rgba(239,68,68,0.1)",
                  border: "1px solid rgba(239,68,68,0.25)",
                  color: "#f87171",
                  fontSize: 14,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                ⚠ {serverError}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              id="btn-submit-rsvp"
              className="form-submit-btn"
              disabled={isSubmitting}
              style={{ marginTop: 24 }}
            >
              {isSubmitting ? (
                <span className="form-loading">
                  <span className="spinner" />
                  Mendaftarkan...
                </span>
              ) : (
                "Konfirmasi RSVP Saya"
              )}
            </button>

            <p className="form-note">
              *Setelah pembayaran berhasil, cek email untuk QR/barcode dan detail masuk acara.
              Pastikan email yang diisi aktif dan bisa diakses.
            </p>
          </form>
    </div>
  );
}
