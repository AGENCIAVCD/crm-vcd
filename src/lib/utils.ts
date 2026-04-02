import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number | string | null | undefined) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
  }).format(Number(value ?? 0));
}

export function getHoursSince(timestamp: string | null | undefined) {
  if (!timestamp) {
    return 0;
  }

  const diff = Date.now() - new Date(timestamp).getTime();
  return Math.max(0, Math.floor(diff / 3_600_000));
}

export function getLeadSlaState(timestamp: string | null | undefined) {
  const hours = getHoursSince(timestamp);

  if (hours >= 48) {
    return "critical" as const;
  }

  if (hours >= 24) {
    return "warning" as const;
  }

  return "healthy" as const;
}

export function formatElapsedTime(timestamp: string | null | undefined) {
  const hours = getHoursSince(timestamp);

  if (hours < 1) {
    return "Agora";
  }

  if (hours < 24) {
    return `${hours}h sem retorno`;
  }

  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;

  if (remainingHours === 0) {
    return `${days}d sem retorno`;
  }

  return `${days}d ${remainingHours}h sem retorno`;
}
