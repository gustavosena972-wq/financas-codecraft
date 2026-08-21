const NEED = /moradia|aluguel|saude|saúde|educacao|educação|imposto|transporte|luz|agua|água|internet/;
const WANT = /lazer|assinat|compra|ifood|delivery|marketing/;

export function split503020(income: number) {
  return {
    need: Math.round(income * 0.5),
    want: Math.round(income * 0.3),
    save: Math.round(income * 0.2),
  };
}

export function bucketSpend(spend: { name: string; amount: number }[]) {
  let need = 0;
  let want = 0;
  let other = 0;
  for (const row of spend) {
    const key = row.name.toLowerCase();
    if (NEED.test(key)) need += row.amount;
    else if (WANT.test(key)) want += row.amount;
    else other += row.amount;
  }
  return { need, want, other };
}

export function reserveMonths(balance: number, essential: number) {
  if (essential <= 0) return null;
  return balance / essential;
}

export function reserveHint(months: number | null) {
  if (months == null) return "Ainda não dá para medir. Lance o essencial do mês (moradia, luz, comida).";
  if (months < 1) return "Crítico: a reserva não cobre nem um mês. Prioridade é parar o vazamento, não investir.";
  if (months < 3) return "Curto: o alvo de pessoa é 3 a 6 meses do essencial. Guarde o que sobrar até chegar lá.";
  if (months < 6) return "No caminho. Continue até 6 meses se a renda for instável.";
  return "Reserva em nível bom. O que passar disso pode ir para dívida cara ou Tesouro Selic.";
}

export function housingCap(income: number) {
  return Math.round(income * 0.3);
}

export function cutSave(amount: number, pct: number) {
  return Math.round(amount * (Math.min(40, Math.max(0, pct)) / 100));
}

export function monthsToClearDebt(principal: number, payment: number, monthlyRatePct: number) {
  if (principal <= 0) return { months: 0, interest: 0 as number };
  if (payment <= 0) return { error: "Informe o valor da parcela." };
  const rate = monthlyRatePct / 100;
  if (rate > 0 && payment <= Math.round(principal * rate)) {
    return { error: "A parcela não cobre nem o juro. Sem isso a dívida não fecha." };
  }
  let balance = principal;
  let interest = 0;
  let months = 0;
  while (balance > 0 && months < 600) {
    months += 1;
    const fee = rate > 0 ? Math.round(balance * rate) : 0;
    interest += fee;
    balance = balance + fee - payment;
    if (balance < 0) balance = 0;
  }
  if (balance > 0) return { error: "Mais de 50 anos. Aumente a parcela ou baixe o juro." };
  return { months, interest };
}

export function sellPrice(cost: number, taxPct: number, marginPct: number) {
  const load = (taxPct + marginPct) / 100;
  if (load >= 0.95) return { error: "Imposto + margem não podem comer o preço inteiro." };
  const price = Math.round(cost / (1 - load));
  return { price, tax: Math.round(price * (taxPct / 100)), margin: price - cost - Math.round(price * (taxPct / 100)) };
}
