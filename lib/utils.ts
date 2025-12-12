import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Função para combinar classes CSS condicionalmente
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Função para formatar dinheiro (R$ 1.000,00)
export function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}