import { NextRequest, NextResponse } from 'next/server';

function getStatusUrl(orderId: string) {
  const baseUrl =
    process.env.MIDTRANS_IS_PRODUCTION === 'true'
      ? process.env.MIDTRANS_URL_PRODUCTION
      : process.env.MIDTRANS_URL_SANDBOX;

  if (!baseUrl) {
    throw new Error(
      'Midtrans URL belum di-set. Isi MIDTRANS_URL_SANDBOX atau MIDTRANS_URL_PRODUCTION di .env'
    );
  }

  return `${baseUrl.replace(/\/$/, '')}/v2/${encodeURIComponent(orderId)}/status`;
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

export async function GET(request: NextRequest) {
  try {
    const orderId = request.nextUrl.searchParams.get('order_id')?.trim() ?? '';
    if (!orderId) {
      return NextResponse.json({ error: 'order_id wajib diisi' }, { status: 400 });
    }

    const serverKey = process.env.MIDTRANS_SERVER_KEY ?? '';
    if (!serverKey) {
      return NextResponse.json({ error: 'MIDTRANS_SERVER_KEY belum di-set' }, { status: 500 });
    }

    const auth = Buffer.from(`${serverKey}:`).toString('base64');
    const statusRes = await fetch(getStatusUrl(orderId), {
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: 'application/json',
      },
    });

    if (!statusRes.ok) {
      const errText = await statusRes.text();
      return NextResponse.json({ error: `Midtrans status error: ${errText}` }, { status: 502 });
    }

    const data = (await statusRes.json()) as {
      order_id?: string;
      transaction_status?: string;
      fraud_status?: string;
      gross_amount?: string;
      status_code?: string;
      payment_type?: string;
      va_numbers?: Array<{ bank?: string; va_number?: string }>;
      permata_va_number?: string;
      currency?: string;
    };

    const nextStatus = mapMidtransStatus(
      String(data.transaction_status ?? '').toLowerCase(),
      data.fraud_status ? String(data.fraud_status).toLowerCase() : undefined
    );

    return NextResponse.json({
      success: true,
      orderId: data.order_id ?? orderId,
      transactionStatus: data.transaction_status ?? null,
      paymentStatus: nextStatus,
      fraudStatus: data.fraud_status ?? null,
      grossAmount: data.gross_amount ?? null,
      paymentType: data.payment_type ?? null,
      vaNumber: data.va_numbers?.[0]?.va_number ?? data.permata_va_number ?? null,
      currency: data.currency ?? null,
      raw: data,
    });
  } catch (error) {
    console.error('RSVP Status Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
