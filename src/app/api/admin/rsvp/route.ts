import { NextResponse } from 'next/server';
import pool from '../../../../../lib/db';

export async function GET() {
  try {
    const result = await pool.query(
      `SELECT
        id,
        member_type as "memberType",
        nama,
        instansi,
        email,
        nomor_telepon as "nomorTelepon",
        jumlah_pax as "jumlahPax",
        order_id as "orderId",
        payment_status as "paymentStatus",
        paid_at as "paidAt",
        created_at as "createdAt"
       FROM rsvp_registrations
       ORDER BY created_at DESC`
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Admin API Error:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil data RSVP' },
      { status: 500 }
    );
  }
}
