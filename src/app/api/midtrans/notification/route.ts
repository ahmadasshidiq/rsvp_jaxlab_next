import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import QRCode from 'qrcode';
import pool from '../../../../../lib/db';
import { createTransporter } from '../../../../../lib/mailer';

function verifyMidtransSignature(params: {
  orderId: string;
  statusCode: string;
  grossAmount: string;
  signatureKey: string;
  serverKey: string;
}) {
  const raw = `${params.orderId}${params.statusCode}${params.grossAmount}${params.serverKey}`;
  const expected = createHash('sha512').update(raw).digest('hex');
  return expected === params.signatureKey;
}

function mapMidtransStatus(transactionStatus: string, fraudStatus?: string) {
  if (transactionStatus === 'capture') return fraudStatus === 'challenge' ? 'challenge' : 'paid';
  if (transactionStatus === 'settlement') return 'paid';
  if (transactionStatus === 'pending') return 'pending';
  if (transactionStatus === 'deny') return 'denied';
  if (transactionStatus === 'cancel') return 'cancelled';
  if (transactionStatus === 'expire') return 'expired';
  if (transactionStatus === 'failure') return 'failed';
  return 'pending';
}

function formatRupiah(amount: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
}

function buildSuccessEmail(params: {
  nama: string;
  memberType: string;
  jumlahPax: number;
  orderId: string;
  qrData: string;
  communityLink: string;
  grossAmount?: string | number | null;
}) {
  const grossAmount = typeof params.grossAmount === 'number' ? params.grossAmount : Number(params.grossAmount ?? 0);
  const amountText = grossAmount ? formatRupiah(grossAmount) : '-';

  return `
    <div style="margin:0;padding:0;background:#f4f7f6;font-family:Arial,Helvetica,sans-serif">
      <div style="max-width:640px;margin:0 auto;padding:24px">
        <div style="background:#163524;color:#fff;border-radius:16px 16px 0 0;padding:24px 28px">
          <div style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;opacity:.85">JaxLab RSVP</div>
          <h1 style="margin:10px 0 0;font-size:28px;line-height:1.2">Pembayaran RSVP Berhasil</h1>
        </div>
        <div style="background:#fff;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 16px 16px;padding:28px">
          <p style="margin:0 0 16px;font-size:15px;color:#111827">Halo <strong>${params.nama}</strong>, pembayaran RSVP kamu sudah kami terima.</p>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:20px 0 24px">
            <div style="padding:12px 14px;border:1px solid #e5e7eb;border-radius:12px">
              <div style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:.08em">Kategori</div>
              <div style="font-size:15px;font-weight:700;margin-top:4px">${params.memberType}</div>
            </div>
            <div style="padding:12px 14px;border:1px solid #e5e7eb;border-radius:12px">
              <div style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:.08em">Jumlah Pax</div>
              <div style="font-size:15px;font-weight:700;margin-top:4px">${params.jumlahPax}</div>
            </div>
            <div style="padding:12px 14px;border:1px solid #e5e7eb;border-radius:12px">
              <div style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:.08em">Order ID</div>
              <div style="font-size:13px;font-weight:700;margin-top:4px;word-break:break-word">${params.orderId}</div>
            </div>
            <div style="padding:12px 14px;border:1px solid #e5e7eb;border-radius:12px">
              <div style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:.08em">Total Bayar</div>
              <div style="font-size:15px;font-weight:700;margin-top:4px">${amountText}</div>
            </div>
          </div>
          <div style="text-align:center;padding:20px;border:1px dashed #cbd5e1;border-radius:16px;background:#f8fafc">
            <div style="font-size:12px;color:#6b7280;margin-bottom:12px;text-transform:uppercase;letter-spacing:.08em">QR / Barcode Check-in</div>
            <img src="${params.qrData}" alt="QR RSVP" style="width:240px;height:240px;max-width:100%;display:inline-block" />
            <div style="font-size:12px;color:#6b7280;margin-top:10px">Tunjukkan QR ini saat registrasi di venue</div>
          </div>
          <div style="margin-top:22px">
            <a href="${params.communityLink}" style="display:inline-block;background:#163524;color:#fff;text-decoration:none;padding:12px 18px;border-radius:999px;font-weight:700">Gabung WhatsApp Community</a>
          </div>
          <p style="margin:18px 0 0;font-size:13px;color:#6b7280;line-height:1.6">Kalau ada pertanyaan, simpan email ini sebagai bukti pembayaran dan tunjukkan QR saat check-in.</p>
        </div>
      </div>
    </div>
  `;
}

async function ensureTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS rsvp_payment_intents (
      id SERIAL PRIMARY KEY,
      order_id TEXT UNIQUE NOT NULL,
      member_type TEXT NOT NULL,
      nama TEXT NOT NULL,
      instansi TEXT NOT NULL,
      email TEXT NOT NULL,
      nomor_telepon TEXT NOT NULL,
      jumlah_pax INTEGER NOT NULL,
      gross_amount INTEGER NOT NULL,
      payment_status TEXT NOT NULL DEFAULT 'pending',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await pool.query(`ALTER TABLE rsvp_registrations ADD COLUMN IF NOT EXISTS order_id TEXT`);
  await pool.query(`ALTER TABLE rsvp_registrations ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending'`);
  await pool.query(`ALTER TABLE rsvp_registrations ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ`);
  await pool.query(`ALTER TABLE rsvp_registrations ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMPTZ`);
}

export async function POST(request: NextRequest) {
  try {
    const serverKey = process.env.MIDTRANS_SERVER_KEY ?? '';
    if (!serverKey) {
      return NextResponse.json({ error: 'MIDTRANS_SERVER_KEY belum di-set' }, { status: 500 });
    }

    const payload = await request.json();
    const orderId = String(payload?.order_id ?? '');
    const statusCode = String(payload?.status_code ?? '');
    const grossAmount = String(payload?.gross_amount ?? '');
    const signatureKey = String(payload?.signature_key ?? '');
    const transactionStatus = String(payload?.transaction_status ?? '').toLowerCase();
    const fraudStatus = payload?.fraud_status ? String(payload.fraud_status).toLowerCase() : undefined;

    if (!orderId || !statusCode || !grossAmount || !signatureKey || !transactionStatus) {
      return NextResponse.json({ error: 'invalid notification payload' }, { status: 400 });
    }

    if (!verifyMidtransSignature({ orderId, statusCode, grossAmount, signatureKey, serverKey })) {
      return NextResponse.json({ error: 'invalid signature' }, { status: 401 });
    }

    await ensureTables();

    const nextStatus = mapMidtransStatus(transactionStatus, fraudStatus);
    await pool.query(
      `UPDATE rsvp_payment_intents
       SET payment_status = $1, updated_at = NOW()
       WHERE order_id = $2`,
      [nextStatus, orderId]
    );

    if (nextStatus !== 'paid') {
      return NextResponse.json({ ok: true, paymentStatus: nextStatus });
    }

    const intentResult = await pool.query(
      `SELECT order_id as "orderId", member_type as "memberType", nama, instansi, email, nomor_telepon as "nomorTelepon", jumlah_pax as "jumlahPax", gross_amount as "grossAmount"
       FROM rsvp_payment_intents
       WHERE order_id = $1
       LIMIT 1`,
      [orderId]
    );

    const intent = intentResult.rows[0];
    if (!intent) {
      return NextResponse.json({ error: 'payment intent not found' }, { status: 404 });
    }

    await pool.query(
      `INSERT INTO rsvp_registrations
        (member_type, nama, instansi, email, nomor_telepon, jumlah_pax, order_id, payment_status, paid_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'paid', NOW())
       ON CONFLICT (order_id) DO UPDATE SET
         member_type = EXCLUDED.member_type,
         nama = EXCLUDED.nama,
         instansi = EXCLUDED.instansi,
         email = EXCLUDED.email,
         nomor_telepon = EXCLUDED.nomor_telepon,
         jumlah_pax = EXCLUDED.jumlah_pax,
         payment_status = 'paid',
         paid_at = COALESCE(rsvp_registrations.paid_at, NOW())`,
      [intent.memberType, intent.nama, intent.instansi, intent.email, intent.nomorTelepon, intent.jumlahPax, orderId]
    );

    const registrationResult = await pool.query(
      `SELECT nama, email, member_type as "memberType", jumlah_pax as "jumlahPax", order_id as "orderId", email_sent_at as "emailSentAt"
       FROM rsvp_registrations
       WHERE order_id = $1
       LIMIT 1`,
      [orderId]
    );
    const registration = registrationResult.rows[0];

    if (registration && !registration.emailSentAt) {
      const qrData = await QRCode.toDataURL(orderId, { errorCorrectionLevel: 'M' });
      const communityLink = process.env.WHATSAPP_COMMUNITY_LINK || 'https://chat.whatsapp.com/EoG7bCqdQoU2InrXHORFze';
      const transporter = createTransporter();
      const from = process.env.SMTP_FROM ?? process.env.SMTP_USER ?? '';

      await transporter.sendMail({
        from,
        to: registration.email,
        subject: 'Pembayaran RSVP Berhasil',
        html: buildSuccessEmail({
          nama: registration.nama,
          memberType: registration.memberType,
          jumlahPax: registration.jumlahPax,
          orderId: registration.orderId,
          qrData,
          communityLink,
          grossAmount: intent.grossAmount,
        }),
      });

      await pool.query(`UPDATE rsvp_registrations SET email_sent_at = NOW() WHERE order_id = $1`, [orderId]);
    }

    return NextResponse.json({ ok: true, paymentStatus: nextStatus });
  } catch (error) {
    console.error('Midtrans Notification Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
