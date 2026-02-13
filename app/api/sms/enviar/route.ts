// app/api/sms/enviar/route.ts
import { NextResponse } from "next/server";
import { apibrasilFetch } from "@/lib/apibrasil";

export async function POST(request: Request) {
  const reqId = `sms_${Math.random().toString(16).slice(2)}_${Date.now()}`;

  try {
    const body = await request.json().catch(() => ({}));

    const number = String(body?.number || "").replace(/\D/g, "");
    const message = String(body?.message || "").trim();
    const operator = body?.operator ? String(body.operator) : undefined;

    if (!number || number.length < 10) {
      return NextResponse.json({ error: true, message: "Número inválido" }, { status: 400 });
    }
    if (!message) {
      return NextResponse.json({ error: true, message: "Mensagem vazia" }, { status: 400 });
    }

    const apiUrl = "https://gateway.apibrasil.io/api/v2/sms/send";

    const payload: any = {
      number: number.startsWith("55") ? number : `55${number}`,
      message,
      user_reply: !!body?.user_reply,
      webhook_url: body?.webhook_url || undefined,
    };
    if (operator) payload.operator = operator;

    const { ok, status, data } = await apibrasilFetch({
      url: apiUrl,
      method: "POST",
      body: payload,
      timeoutMs: 120000,
      // Se não tiver device separado pro SMS, deixe assim:
      deviceToken: process.env.APIBRASIL_SMS_DEVICE_TOKEN || process.env.APIBRASIL_DEVICE_TOKEN,
    });

    if (!ok || data?.error === true) {
      return NextResponse.json(
        {
          error: true,
          message: data?.message || "Erro ao enviar SMS",
          status,
          apiResponse: data,
          reqId,
        },
        { status: status || 502 }
      );
    }

    return NextResponse.json({ error: false, message: "SMS enviado", data, reqId });
  } catch (err: any) {
    const isAbort =
      String(err?.name || "").toLowerCase().includes("abort") ||
      String(err || "").toLowerCase().includes("timeout");

    return NextResponse.json(
      {
        error: true,
        message: isAbort ? "Timeout no envio de SMS" : "Erro interno",
        details: err?.message || String(err),
        reqId,
      },
      { status: isAbort ? 504 : 500 }
    );
  }
}