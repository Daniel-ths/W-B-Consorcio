"use client";
import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext"; // Ajuste o caminho

export default function LoginPage() {
  const { login } = useAuth(); // Pega a função do contexto
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Chama o login do contexto, que já trata o redirecionamento
    await login(email, password);
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <form onSubmit={handleSubmit} className="p-8 bg-white rounded shadow-md">
        <h1 className="mb-4 text-xl font-bold">Acesse o Sistema</h1>
        
        <input
          type="email"
          placeholder="Email"
          className="block w-full p-2 mb-4 border rounded"
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Senha"
          className="block w-full p-2 mb-4 border rounded"
          onChange={(e) => setPassword(e.target.value)}
        />
        
        <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded">
          Entrar
        </button>
      </form>
    </div>
  );
}