import { NextRequest, NextResponse } from 'next/server';
import pool from '../../../../lib/db';

interface RSVPData {
  memberType: 'VIP' | 'Reguler';
  nama: string;
  instansi: string;
  email: string;
  nomorTelepon: string;
  jumlahPax: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: RSVPData = await request.json();

    const { memberType, nama, instansi, email, nomorTelepon, jumlahPax } = body;

    // Validasi
    if (!memberType || !['VIP', 'Reguler'].includes(memberType)) {
      return NextResponse.json(
        { error: 'Tipe member tidak valid' },
        { status: 400 }
      );
    }

    if (!nama || nama.trim().length < 2) {
      return NextResponse.json(
        { error: 'Nama harus diisi minimal 2 karakter' },
        { status: 400 }
      );
    }

    if (!instansi || instansi.trim().length < 2) {
      return NextResponse.json(
        { error: 'Instansi harus diisi' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Format email tidak valid' },
        { status: 400 }
      );
    }

    if (!nomorTelepon || nomorTelepon.trim().length < 8) {
      return NextResponse.json(
        { error: 'Nomor telepon tidak valid' },
        { status: 400 }
      );
    }

    if (!jumlahPax || jumlahPax < 1 || jumlahPax > 10) {
      return NextResponse.json(
        { error: 'Jumlah pax harus antara 1-10' },
        { status: 400 }
      );
    }

    // Simpan ke database
    const result = await pool.query(
      `INSERT INTO rsvp_registrations 
        (member_type, nama, instansi, email, nomor_telepon, jumlah_pax) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id, created_at`,
      [
        memberType,
        nama.trim(),
        instansi.trim(),
        email.toLowerCase().trim(),
        nomorTelepon.trim(),
        jumlahPax,
      ]
    );

    const registration = result.rows[0];

    return NextResponse.json(
      {
        success: true,
        message: 'Pendaftaran RSVP berhasil!',
        data: {
          id: registration.id,
          memberType,
          nama: nama.trim(),
          createdAt: registration.created_at,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('RSVP Error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server. Silakan coba lagi.' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { message: 'RSVP JaxLab API is running' },
    { status: 200 }
  );
}
