import { NextRequest, NextResponse } from 'next/server';
import pool from '../../../../../lib/db';

async function ensurePaymentColumns() {
  await pool.query(`ALTER TABLE rsvp_registrations ADD COLUMN IF NOT EXISTS order_id TEXT`);
  await pool.query(`ALTER TABLE rsvp_registrations ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending'`);
  await pool.query(`ALTER TABLE rsvp_registrations ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ`);
  await pool.query(`ALTER TABLE rsvp_registrations ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMPTZ`);
}

export async function GET(request: NextRequest) {
  try {
    const orderId = request.nextUrl.searchParams.get('order_id')?.trim() ?? '';
    if (!orderId) {
      return NextResponse.json({ error: 'order_id wajib diisi' }, { status: 400 });
    }

    await ensurePaymentColumns();

    const result = await pool.query(
      `SELECT
        id,
        order_id as "orderId",
        nama,
        instansi,
        email,
        member_type as "memberType",
        nomor_telepon as "nomorTelepon",
        jumlah_pax as "jumlahPax",
        payment_status as "paymentStatus",
        paid_at as "paidAt",
        created_at as "createdAt"
       FROM rsvp_registrations
       WHERE order_id = $1 AND payment_status = 'paid'
       LIMIT 1`,
      [orderId]
    );

    const row = result.rows[0];
    if (!row) {
      return NextResponse.json({ error: 'RSVP tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: row,
    });
  } catch (error) {
    console.error('RSVP Validate Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
