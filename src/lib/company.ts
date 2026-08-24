import type { Org } from "./types";

export function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

export function formatCnpj(value: string) {
  const d = onlyDigits(value).slice(0, 14);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

export function formatCep(value: string) {
  const d = onlyDigits(value).slice(0, 8);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}

export function formatCpf(value: string) {
  const d = onlyDigits(value).slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

export function isValidCpf(value: string) {
  const d = onlyDigits(value);
  if (d.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(d)) return false;
  const digit = (base: string, factor: number) => {
    const sum = base.split("").reduce((total, char, i) => total + Number(char) * (factor - i), 0);
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };
  return digit(d.slice(0, 9), 10) === Number(d[9]) && digit(d.slice(0, 10), 11) === Number(d[10]);
}

function cnpjDigit(base: string, weights: number[]) {
  const sum = base.split("").reduce((total, char, i) => total + Number(char) * weights[i], 0);
  const rest = sum % 11;
  return rest < 2 ? 0 : 11 - rest;
}

export function isValidCnpj(value: string) {
  const d = onlyDigits(value);
  if (d.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(d)) return false;
  const first = cnpjDigit(d.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const second = cnpjDigit(d.slice(0, 13), [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return first === Number(d[12]) && second === Number(d[13]);
}

export type CompanyLookup = {
  legalName: string;
  tradeName: string;
  cnpj: string;
  phone: string;
  email: string;
  cep: string;
  street: string;
  number: string;
  district: string;
  city: string;
  state: string;
  activity: string;
  situation: string;
};

export async function lookupCnpj(raw: string): Promise<{ error?: string; data?: CompanyLookup }> {
  const cnpj = onlyDigits(raw);
  if (!isValidCnpj(cnpj)) return { error: "CNPJ inválido. Confira os 14 números." };
  try {
    const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`);
    if (res.status === 404) return { error: "Esse CNPJ não aparece na base pública. Confira o número." };
    if (!res.ok) return { error: "Não deu para buscar agora. Preencha os dados e ligue mesmo assim." };
    const row = (await res.json()) as Record<string, unknown>;
    const ddd = String(row.ddd_telefone_1 ?? "").replace(/\D/g, "");
    return {
      data: {
        legalName: String(row.razao_social ?? ""),
        tradeName: String(row.nome_fantasia ?? ""),
        cnpj,
        phone: ddd,
        email: String(row.email ?? ""),
        cep: onlyDigits(String(row.cep ?? "")),
        street: String(row.logradouro ?? ""),
        number: String(row.numero ?? ""),
        district: String(row.bairro ?? ""),
        city: String(row.municipio ?? ""),
        state: String(row.uf ?? ""),
        activity: String(row.cnae_fiscal_descricao ?? ""),
        situation: String(row.descricao_situacao_cadastral ?? ""),
      },
    };
  } catch {
    return { error: "Sem rede para buscar o CNPJ. Preencha na mão." };
  }
}

export function orgIsLinked(org: Org) {
  return Boolean(org.linkedAt && isValidCnpj(org.cnpj) && org.legalName.trim().length >= 3 && org.city.trim().length >= 2);
}

export function displayCompany(org: Org) {
  return org.tradeName.trim() || org.legalName.trim() || org.name;
}
