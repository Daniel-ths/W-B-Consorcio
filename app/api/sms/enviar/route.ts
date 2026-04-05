// app/api/sms/enviar/route.ts
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const reqId = `sms_${Math.random().toString(16).slice(2)}_${Date.now()}`;

  try {
    const body = await request.json().catch(() => ({}));

    const rawNumber = String(body?.number || "").replace(/\D/g, "");
    const message = String(body?.message || "").trim();

    if (!rawNumber || rawNumber.length < 10) {
      return NextResponse.json(
        { error: true, message: "Número inválido" },
        { status: 400 }
      );
    }

    if (!message) {
      return NextResponse.json(
        { error: true, message: "Mensagem vazia" },
        { status: 400 }
      );
    }

    const number = rawNumber.startsWith("55") ? rawNumber : `55${rawNumber}`;
    const to = `+${number}`;

    const username = process.env.CLICKSEND_USERNAME;
    const apiKey = process.env.CLICKSEND_API_KEY;
    const from = process.env.CLICKSEND_FROM || "Sistema";

    if (!username || !apiKey) {
      return NextResponse.json(
        {
          error: true,
          message: "Credenciais do ClickSend não configuradas",
          reqId,
        },
        { status: 500 }
      );
    }

    const auth = Buffer.from(`${username}:${apiKey}`).toString("base64");

    const response = await fetch("https://rest.clicksend.com/v3/sms/send", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          {
            source: "nextjs",
            from,
            body: message,
            to,
          },
        ],
      }),
      cache: "no-store",
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return NextResponse.json(
        {
          error: true,
          message: data?.response_msg || data?.message || "Erro ao enviar SMS",
          status: response.status,
          apiResponse: data,
          reqId,
        },
        { status: response.status || 502 }
      );
    }

    const result = data?.data?.messages?.[0];
    const resultStatus = result?.status || result?.message_status || "unknown";

    return NextResponse.json({
      error: false,
      message: "SMS enviado",
      data,
      resultStatus,
      reqId,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        error: true,
        message: "Erro interno",
        details: err?.message || String(err),
        reqId,
      },
      { status: 500 }
    );
  }
}