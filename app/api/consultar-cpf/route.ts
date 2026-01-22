import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { cpf } = body;

    // --- SEUS TOKENS (Copiados da sua mensagem anterior) ---
    const BEARE_TOKEN = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczovL2dhdGV3YXkuYXBpYnJhc2lsLmlvL2FwaS92Mi9zb2NpYWwvZ2l0aHViL2NhbGxiYWNrIiwiaWF0IjoxNzY5MTIxNzI5LCJleHAiOjE4MDA2NTc3MjksIm5iZiI6MTc2OTEyMTcyOSwianRpIjoiaXNKYUVENG94SG5RODlOYSIsInN1YiI6IjIwMzQyIiwicHJ2IjoiMjNiZDVjODk0OWY2MDBhZGIzOWU3MDFjNDAwODcyZGI3YTU5NzZmNyJ9.FiS0iN6_N8hNOhGnBYU2f9zESSPh4wXiFI0RQ4X_F5g"; 
    const DEVICE_TOKEN = "178bfa7c-fc33-4ef2-aabe-915aa48e89aa"; 
    // -----------------------------------------------------

    const cpfLimpo = cpf.replace(/\D/g, '');

    // URL Exata da sua imagem (POST)
    const url = "https://gateway.apibrasil.io/api/v2/dados/cpf";

    console.log(`Consultando API Brasil (POST) para CPF: ${cpfLimpo}`);

    const response = await fetch(url, {
      method: "POST", // A imagem confirma que é POST
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${BEARE_TOKEN}`,
        "DeviceToken": DEVICE_TOKEN
      },
      body: JSON.stringify({ 
        cpf: cpfLimpo 
      })
    });

    const data = await response.json();

    // Log para debug no terminal
    console.log("Status:", response.status);
    
    if (!response.ok || data.error) {
      console.error("Erro API:", data);
      return NextResponse.json({ 
        error: data.message || data.error || "Erro na consulta." 
      }, { status: response.status });
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error("Erro interno:", error);
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  }
}