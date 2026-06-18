import { NextRequest, NextResponse } from 'next/server';
import pool from '../../../../../lib/db';
import moment from 'moment-timezone';

interface RSVPData {
  memberType: 'VIP' | 'Reguler';
  nama: string;
  instansi: string;
  email: string;
  nomorTelepon: string;
  jumlahPax: number;
}

const SNAP_PATH = '/snap/v1/transactions';

function getSnapUrl() {
  if (process.env.MIDTRANS_SNAP_URL) return process.env.MIDTRANS_SNAP_URL;

  const baseUrl =
    process.env.MIDTRANS_IS_PRODUCTION === 'true'
      ? process.env.MIDTRANS_URL_PRODUCTION
      : process.env.MIDTRANS_URL_SANDBOX;

  if (!baseUrl) {
    throw new Error(
      'Midtrans URL belum di-set. Isi MIDTRANS_URL_SANDBOX atau MIDTRANS_URL_PRODUCTION di .env'
    );
  }

  return `${baseUrl.replace(/\/$/, '')}${SNAP_PATH}`;
}

function splitName(fullName: string) {
  const cleaned = fullName.trim();
  if (!cleaned) return { first_name: 'Customer', last_name: '' };
  const [first, ...rest] = cleaned.split(/\s+/);
  return { first_name: first, last_name: rest.join(' ') };
}

function getItemPrice(memberType: RSVPData['memberType']) {
  const vipPrice = Number(process.env.RSVP_VIP_PRICE ?? 0);
  const regulerPrice = Number(process.env.RSVP_REGULER_PRICE ?? 0);
  const price = memberType === 'VIP' ? vipPrice : regulerPrice;
  if (!price || Number.isNaN(price)) {
    throw new Error('Harga RSVP belum di-set. Isi RSVP_VIP_PRICE dan RSVP_REGULER_PRICE di .env');
  }
  return price;
}

async function ensurePaymentTables() {
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
}

export async function POST(request: NextRequest) {
  try {
    const body: RSVPData = await request.json();
    const { memberType, nama, instansi, email, nomorTelepon, jumlahPax } = body;

    if (!memberType || !['VIP', 'Reguler'].includes(memberType)) {
      return NextResponse.json({ error: 'Tipe member tidak valid' }, { status: 400 });
    }
    if (!nama || nama.trim().length < 2) {
      return NextResponse.json({ error: 'Nama harus diisi minimal 2 karakter' }, { status: 400 });
    }
    if (!instansi || instansi.trim().length < 2) {
      return NextResponse.json({ error: 'Instansi harus diisi' }, { status: 400 });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return NextResponse.json({ error: 'Format email tidak valid' }, { status: 400 });
    }
    if (!nomorTelepon || nomorTelepon.trim().length < 8) {
      return NextResponse.json({ error: 'Nomor telepon tidak valid' }, { status: 400 });
    }
    if (!jumlahPax || jumlahPax < 1 || jumlahPax > 10) {
      return NextResponse.json({ error: 'Jumlah pax harus antara 1-10' }, { status: 400 });
    }

    await ensurePaymentTables();

    const ticketPrice = getItemPrice(memberType);
    const grossAmount = ticketPrice * jumlahPax;
    const orderId = `RSVP-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const pendingNama = nama.trim();
    const pendingInstansi = instansi.trim();
    const pendingEmail = email.toLowerCase().trim();
    const pendingPhone = nomorTelepon.trim();

    await pool.query(
      `INSERT INTO rsvp_payment_intents
        (order_id, member_type, nama, instansi, email, nomor_telepon, jumlah_pax, gross_amount)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (order_id) DO UPDATE SET
         member_type = EXCLUDED.member_type,
         nama = EXCLUDED.nama,
         instansi = EXCLUDED.instansi,
         email = EXCLUDED.email,
         nomor_telepon = EXCLUDED.nomor_telepon,
         jumlah_pax = EXCLUDED.jumlah_pax,
         gross_amount = EXCLUDED.gross_amount,
         payment_status = 'pending',
         updated_at = NOW()`,
      [orderId, memberType, pendingNama, pendingInstansi, pendingEmail, pendingPhone, jumlahPax, grossAmount]
    );

    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    if (!serverKey) {
      return NextResponse.json({ error: 'MIDTRANS_SERVER_KEY belum di-set' }, { status: 500 });
    }

    const auth = Buffer.from(`${serverKey}:`).toString('base64');
    const appBaseUrl = (process.env.PUBLIC_BASE_URL ?? `${request.nextUrl.protocol}//${request.nextUrl.host}`).replace(/\/$/, '');
    const notificationUrl = process.env.MIDTRANS_NOTIFICATION_URL ?? `${appBaseUrl}/api/midtrans/notification`;
    const customerName = splitName(pendingNama);
    const start_time = moment().tz('Asia/Jakarta').format('YYYY-MM-DD HH:mm:ss ZZ');

    const snapRes = await fetch(getSnapUrl(), {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transaction_details: {
          order_id: orderId,
          gross_amount: grossAmount,
        },
        credit_card: { secure: true },
        callbacks: {
          finish: `${appBaseUrl}/?payment=success&order_id=${encodeURIComponent(orderId)}`,
          error: `${appBaseUrl}/?payment=failed&order_id=${encodeURIComponent(orderId)}`,
          pending: `${appBaseUrl}/?payment=pending&order_id=${encodeURIComponent(orderId)}`,
        },
        notification_url: notificationUrl,
        expiry: {
          start_time,
          unit: 'hours',
          duration: 1,
        },
        custom_field1: 'rsvp',
        custom_field2: memberType,
        custom_field3: orderId,
        customer_details: {
          ...customerName,
          email: pendingEmail,
          phone: pendingPhone,
        },
        item_details: [
          {
            id: `RSVP-${memberType}`,
            name: `RSVP ${memberType}`,
            price: ticketPrice,
            quantity: jumlahPax,
          },
        ],
      }),
    });

    if (!snapRes.ok) {
      const errText = await snapRes.text();
      return NextResponse.json({ error: `Midtrans error: ${errText}` }, { status: 502 });
    }

    const snapJson = (await snapRes.json()) as { token?: string; redirect_url?: string };
    const redirectUrl =
      snapJson.redirect_url ||
      (snapJson.token ? `${process.env.MIDTRANS_URL_SANDBOX ?? 'https://app.sandbox.midtrans.com'}/snap/v2/vtweb/${snapJson.token}` : undefined);

    return NextResponse.json(
      {
        success: true,
        data: {
          snapToken: snapJson.token,
          redirectUrl,
          orderId,
          grossAmount,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('RSVP Checkout Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
