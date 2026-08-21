import ExcelJS from "exceljs";
import { companyPaid, personPaid, type PlanId } from "./plans";
import { buildBusinessSampleBuffer, buildPersonalSampleBuffer } from "./excel";

const GREEN = "FF217346";

function paintHeader(row: ExcelJS.Row) {
  row.font = { bold: true, color: { argb: "FFFFFFFF" }, name: "Calibri", size: 11 };
  row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: GREEN } };
  row.alignment = { vertical: "middle", wrapText: true };
  row.height = 22;
}

function moneyCols(sheet: ExcelJS.Worksheet, cols: number[]) {
  for (const col of cols) sheet.getColumn(col).numFmt = '"R$" #,##0.00';
}

function pctCols(sheet: ExcelJS.Worksheet, cols: number[]) {
  for (const col of cols) sheet.getColumn(col).numFmt = "0.0%";
}

function grid(sheet: ExcelJS.Worksheet) {
  sheet.views = [{ state: "frozen", ySplit: 1, xSplit: 1, activeCell: "A2" }];
  sheet.properties.defaultRowHeight = 18;
}

function addSheet(wb: ExcelJS.Workbook, name: string, headers: string[], rows: (string | number | { formula: string; result?: number | string })[][]) {
  const sheet = wb.addWorksheet(name, { properties: { tabColor: { argb: GREEN } } });
  sheet.addRow(headers);
  paintHeader(sheet.getRow(1));
  for (const row of rows) sheet.addRow(row);
  headers.forEach((_, i) => {
    sheet.getColumn(i + 1).width = i === 0 ? 32 : 18;
  });
  grid(sheet);
  return sheet;
}

export async function buildChatWorkbook(company: boolean, plan: PlanId | string | null | undefined) {
  if (company) {
    if (companyPaid(plan)) return buildCompanyWorkbook(plan === "ENTERPRISE");
    return buildBusinessSampleBuffer();
  }
  if (personPaid(plan)) return buildPersonWorkbook(plan === "PLUS");
  return buildPersonalSampleBuffer();
}

async function buildPersonWorkbook(full: boolean) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Finanças CodeCraft";
  wb.calcProperties.fullCalcOnLoad = true;

  const capa = addSheet(wb, "Capa", ["Campo", "Valor"], [
    ["Arquivo", "Financas-Pessoal.xlsx"],
    ["Uso", "Preencha Lançamentos. As outras abas calculam sozinhas."],
    ["Regra", "Não apague as fórmulas. Só mude números e textos nas abas de dado."],
  ]);
  capa.getColumn(2).width = 64;

  addSheet(wb, "Premissas", ["Premissa", "Valor", "Para que serve"], [
    ["Alvo de reserva (meses)", 6, "Quantos meses do essencial você quer parado"],
    ["Teto de moradia", 0.3, "30% da renda"],
    ["Corte de assinatura", 0.15, "Quanto tentar baixar nas contas fixas"],
  ]);
  wb.getWorksheet("Premissas")!.getCell("B3").numFmt = "0%";
  wb.getWorksheet("Premissas")!.getCell("B4").numFmt = "0%";

  const lanc = addSheet(wb, "Lancamentos", ["Data", "Descricao", "Valor", "Tipo", "Categoria", "Conta", "Bloco"], [
    ["2026-08-01", "Salário", 6200, "Receita", "Salário", "Conta corrente", "Renda"],
    ["2026-08-02", "Aluguel", 1800, "Despesa", "Moradia", "Conta corrente", "Necessidade"],
    ["2026-08-03", "Supermercado", 387.9, "Despesa", "Alimentação", "Carteira", "Necessidade"],
    ["2026-08-05", "Combustível", 220, "Despesa", "Transporte", "Cartão", "Necessidade"],
    ["2026-08-08", "Freelance", 1500, "Receita", "Freelance", "Conta corrente", "Renda"],
    ["2026-08-10", "Farmácia", 64.5, "Despesa", "Saúde", "Carteira", "Necessidade"],
    ["2026-08-12", "Internet", 119.9, "Despesa", "Assinaturas", "Conta corrente", "Necessidade"],
    ["2026-08-15", "Lanche", 32, "Despesa", "Alimentação", "Carteira", "Lazer"],
    ["2026-08-18", "Streaming", 55.9, "Despesa", "Assinaturas", "Cartão", "Lazer"],
    ["2026-08-20", "Reserva", 400, "Despesa", "Poupança", "Conta corrente", "Guardar"],
  ]);
  moneyCols(lanc, [3]);

  const caixa = addSheet(wb, "Caixa", ["Indicador", "Valor", "Formula"], [
    ["Renda", { formula: 'SUMIF(Lancamentos!D:D,"Receita",Lancamentos!C:C)', result: 7700 }, '=SOMASE(Lancamentos!D:D;"Receita";Lancamentos!C:C)'],
    ["Gasto", { formula: 'SUMIF(Lancamentos!D:D,"Despesa",Lancamentos!C:C)', result: 3080.2 }, '=SOMASE(Lancamentos!D:D;"Despesa";Lancamentos!C:C)'],
    ["Sobra", { formula: "B2-B3", result: 4619.8 }, "=B2-B3"],
    ["Margem", { formula: 'IF(B2=0,0,B4/B2)', result: 0.6 }, "=SE(B2=0;0;B4/B2)"],
  ]);
  moneyCols(caixa, [2]);
  caixa.getCell("B5").numFmt = "0.0%";

  const split = addSheet(wb, "50-30-20", ["Bloco", "Teto", "Gasto", "Folga", "Formula"], [
    ["Necessidade", { formula: "Caixa!B2*0.5", result: 3850 }, { formula: 'SUMIF(Lancamentos!G:G,"Necessidade",Lancamentos!C:C)', result: 2592.3 }, { formula: "B2-C2", result: 1257.7 }, "=Renda*50%"],
    ["Lazer", { formula: "Caixa!B2*0.3", result: 2310 }, { formula: 'SUMIF(Lancamentos!G:G,"Lazer",Lancamentos!C:C)', result: 87.9 }, { formula: "B3-C3", result: 2222.1 }, "=Renda*30%"],
    ["Guardar", { formula: "Caixa!B2*0.2", result: 1540 }, { formula: 'SUMIF(Lancamentos!G:G,"Guardar",Lancamentos!C:C)', result: 400 }, { formula: "B4-C4", result: 1140 }, "=Renda*20%"],
  ]);
  moneyCols(split, [2, 3, 4]);

  addSheet(wb, "Categorias", ["Categoria", "Gasto", "% do gasto", "Formula"], [
    ["Moradia", { formula: 'SUMIF(Lancamentos!E:E,"Moradia",Lancamentos!C:C)', result: 1800 }, { formula: "IF(Caixa!B3=0,0,B2/Caixa!B3)", result: 0.58 }, "=SOMASE(Lancamentos!E:E;A2;Lancamentos!C:C)"],
    ["Alimentação", { formula: 'SUMIF(Lancamentos!E:E,"Alimentação",Lancamentos!C:C)', result: 419.9 }, { formula: "IF(Caixa!B3=0,0,B3/Caixa!B3)", result: 0.14 }, "=SOMASE(...)"],
    ["Transporte", { formula: 'SUMIF(Lancamentos!E:E,"Transporte",Lancamentos!C:C)', result: 220 }, { formula: "IF(Caixa!B3=0,0,B4/Caixa!B3)", result: 0.07 }, "=SOMASE(...)"],
    ["Assinaturas", { formula: 'SUMIF(Lancamentos!E:E,"Assinaturas",Lancamentos!C:C)', result: 175.8 }, { formula: "IF(Caixa!B3=0,0,B5/Caixa!B3)", result: 0.06 }, "=SOMASE(...)"],
  ]);
  moneyCols(wb.getWorksheet("Categorias")!, [2]);
  pctCols(wb.getWorksheet("Categorias")!, [3]);

  const reserva = addSheet(wb, "Reserva", ["Indicador", "Valor", "Formula"], [
    ["Essencial (necessidade)", { formula: "'50-30-20'!C2", result: 2592.3 }, "=gasto do bloco necessidade"],
    ["Alvo 6 meses", { formula: "B2*Premissas!B2", result: 15553.8 }, "=Essencial * meses alvo"],
    ["Já guardado neste mês", { formula: "'50-30-20'!C4", result: 400 }, "=bloco Guardar"],
  ]);
  moneyCols(reserva, [2]);

  addSheet(wb, "Contas fixas", ["Conta", "Valor", "Se baixar 15%", "Formula"], [
    ["Aluguel", 1800, { formula: "B2*Premissas!B4", result: 270 }, "=B2*15%"],
    ["Internet", 119.9, { formula: "B3*Premissas!B4", result: 18 }, "=B3*15%"],
    ["Streaming", 55.9, { formula: "B4*Premissas!B4", result: 8.4 }, "=B4*15%"],
  ]);
  moneyCols(wb.getWorksheet("Contas fixas")!, [2, 3]);

  if (full) {
    addSheet(wb, "Metas", ["Meta", "Alvo", "Por mês (12x)", "Formula"], [
      ["Reserva de emergência", 15000, { formula: "B2/12", result: 1250 }, "=B2/12"],
      ["Troca de notebook", 4500, { formula: "B3/12", result: 375 }, "=B3/12"],
    ]);
    moneyCols(wb.getWorksheet("Metas")!, [2, 3]);
    addSheet(wb, "Previsao", ["Mês", "Renda", "Gasto", "Sobra", "Saldo acumulado"], [
      ["M0 (agora)", { formula: "Caixa!B2" }, { formula: "Caixa!B3" }, { formula: "B2-C2" }, { formula: "D2" }],
      ["M1", { formula: "B2" }, { formula: "C2" }, { formula: "B3-C3" }, { formula: "E2+D3" }],
      ["M2", { formula: "B3" }, { formula: "C3" }, { formula: "B4-C4" }, { formula: "E3+D4" }],
      ["M3", { formula: "B4" }, { formula: "C4" }, { formula: "B5-C5" }, { formula: "E4+D5" }],
      ["M4", { formula: "B5" }, { formula: "C5" }, { formula: "B6-C6" }, { formula: "E5+D6" }],
      ["M5", { formula: "B6" }, { formula: "C6" }, { formula: "B7-C7" }, { formula: "E6+D7" }],
      ["M6", { formula: "B7" }, { formula: "C7" }, { formula: "B8-C8" }, { formula: "E7+D8" }],
    ]);
    moneyCols(wb.getWorksheet("Previsao")!, [2, 3, 4, 5]);
  }

  return wb.xlsx.writeBuffer();
}

async function buildCompanyWorkbook(full: boolean) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Finanças CodeCraft";
  wb.calcProperties.fullCalcOnLoad = true;

  addSheet(wb, "Capa", ["Campo", "Valor"], [
    ["Arquivo", "Tesouraria-Empresa.xlsx"],
    ["Modelo", "Caixa, DRE, fluxo, títulos, giro e indicadores. Nível de tesouraria, sem linha enfeite."],
    ["Como usar", "1) Premissas  2) Lancamentos  3) Receber e Pagar  4) leia Painel e DRE"],
    ["Regra", "Fórmula não se apaga. Dado entra em Lancamentos, Receber, Pagar e Premissas."],
  ]);
  wb.getWorksheet("Capa")!.getColumn(2).width = 78;

  const pre = addSheet(wb, "Premissas", ["Premissa", "Valor", "Para que serve"], [
    ["Alíquota efetiva (simples/exemplo)", 0.06, "Imposto sobre a receita"],
    ["Margem alvo", 0.25, "Resultado / receita"],
    ["Crescimento mensal da receita", 0.03, "Previsão"],
    ["Prazo médio de recebimento (dias)", 21, "DSO"],
    ["Prazo médio de pagamento (dias)", 14, "DPO"],
    ["Runway mínimo (meses)", 3, "Caixa / burn"],
  ]);
  pre.getCell("B2").numFmt = "0%";
  pre.getCell("B3").numFmt = "0%";
  pre.getCell("B4").numFmt = "0%";

  const lanc = addSheet(wb, "Lancamentos", ["Data", "Descricao", "Valor", "Tipo", "Grupo", "Centro", "Conta", "ClienteFornecedor"], [
    ["2026-08-01", "Projeto site institucional", 8000, "Receita", "Receita", "Comercial", "Conta PJ", "Cliente A"],
    ["2026-08-04", "Projeto loja", 12500, "Receita", "Receita", "Comercial", "Conta PJ", "Cliente B"],
    ["2026-08-06", "Freelancer layout", 1800, "Despesa", "Custos", "Produto", "Conta PJ", "Fornecedor C"],
    ["2026-08-07", "Pró-labore", 3500, "Despesa", "Folha", "Admin", "Conta PJ", "Sócio"],
    ["2026-08-08", "DAS", 1230, "Despesa", "Impostos", "Admin", "Conta PJ", "Receita Federal"],
    ["2026-08-10", "Meta Ads", 900, "Despesa", "Marketing", "Comercial", "Cartão PJ", "Meta"],
    ["2026-08-12", "Hospedagem e domínio", 189, "Despesa", "Infra", "Produto", "Cartão PJ", "Cloudflare"],
    ["2026-08-14", "Contador", 420, "Despesa", "OpEx", "Admin", "Conta PJ", "Escritório"],
    ["2026-08-18", "Manutenção mensal", 2400, "Receita", "Receita", "Comercial", "Conta PJ", "Cliente A"],
    ["2026-08-20", "Canva + ferramentas", 149, "Despesa", "Infra", "Produto", "Cartão PJ", "SaaS"],
  ]);
  moneyCols(lanc, [3]);

  const painel = addSheet(wb, "Painel", ["Indicador", "Valor", "Formula", "Leitura"], [
    ["Receita", { formula: 'SUMIF(Lancamentos!D:D,"Receita",Lancamentos!C:C)', result: 22900 }, '=SOMASE(Lancamentos!D:D;"Receita";Lancamentos!C:C)', ""],
    ["Despesa", { formula: 'SUMIF(Lancamentos!D:D,"Despesa",Lancamentos!C:C)', result: 8188 }, '=SOMASE(Lancamentos!D:D;"Despesa";Lancamentos!C:C)', ""],
    ["Resultado", { formula: "B2-B3", result: 14712 }, "=B2-B3", ""],
    ["Margem", { formula: "IF(B2=0,0,B4/B2)", result: 0.643 }, "=SE(B2=0;0;B4/B2)", "Alvo na aba Premissas"],
    ["Imposto estimado", { formula: "B2*Premissas!B2", result: 1374 }, "=Receita*alíquota", ""],
    ["A receber", { formula: "SUMIF(Receber!E:E,\"Aberto\",Receber!D:D)", result: 4500 }, '=SOMASE(Receber!E:E;"Aberto";Receber!D:D)', "Não gaste o que não caiu"],
    ["A pagar", { formula: "SUMIF(Pagar!E:E,\"Aberto\",Pagar!D:D)", result: 2100 }, '=SOMASE(Pagar!E:E;"Aberto";Pagar!D:D)', ""],
    ["Capital de giro", { formula: "B7-B8", result: 2400 }, "=A receber − A pagar", ""],
    ["Burn", { formula: "IF(B4>=0,0,-B4)", result: 0 }, "=SE(Resultado>=0;0;-Resultado)", ""],
    ["Runway", { formula: 'IF(B10=0,"sem burn","caixa / burn")', result: "sem burn" }, "=SE(Burn=0;\"sem burn\";Caixa/Burn)", "Mínimo 3 meses"],
  ]);
  moneyCols(painel, [2]);
  painel.getCell("B5").numFmt = "0.0%";

  const dre = addSheet(wb, "DRE", ["Linha", "Valor", "Formula"], [
    ["(=) Receita líquida", { formula: "Painel!B2", result: 22900 }, "=Painel receita"],
    ["(−) Custos do serviço", { formula: 'SUMIF(Lancamentos!E:E,"Custos",Lancamentos!C:C)', result: 1800 }, '=SOMASE(Lancamentos!E:E;"Custos";Lancamentos!C:C)'],
    ["(=) Lucro bruto", { formula: "B2-B3", result: 21100 }, "=B2-B3"],
    ["(−) Folha", { formula: 'SUMIF(Lancamentos!E:E,"Folha",Lancamentos!C:C)', result: 3500 }, '=SOMASE(...;"Folha";...)'],
    ["(−) Impostos", { formula: 'SUMIF(Lancamentos!E:E,"Impostos",Lancamentos!C:C)', result: 1230 }, '=SOMASE(...;"Impostos";...)'],
    ["(−) Marketing", { formula: 'SUMIF(Lancamentos!E:E,"Marketing",Lancamentos!C:C)', result: 900 }, '=SOMASE(...;"Marketing";...)'],
    ["(−) Infra", { formula: 'SUMIF(Lancamentos!E:E,"Infra",Lancamentos!C:C)', result: 338 }, '=SOMASE(...;"Infra";...)'],
    ["(−) OpEx", { formula: 'SUMIF(Lancamentos!E:E,"OpEx",Lancamentos!C:C)', result: 420 }, '=SOMASE(...;"OpEx";...)'],
    ["(=) Resultado", { formula: "B4-SUM(B5:B8)", result: 14712 }, "=Lucro bruto − despesas"],
    ["Margem", { formula: "IF(B2=0,0,B10/B2)", result: 0.643 }, "=Resultado/Receita"],
  ]);
  moneyCols(dre, [2]);
  dre.getCell("B11").numFmt = "0.0%";

  const fluxo = addSheet(wb, "Fluxo", ["Mês", "Entradas", "Saídas", "Variação", "Saldo", "Formula"], [
    ["Agosto", { formula: "Painel!B2" }, { formula: "Painel!B3" }, { formula: "B2-C2" }, { formula: "D2" }, "=B2-C2"],
    ["Setembro", { formula: "B2*(1+Premissas!B4)" }, { formula: "C2" }, { formula: "B3-C3" }, { formula: "E2+D3" }, "=saldo anterior + variação"],
    ["Outubro", { formula: "B3*(1+Premissas!B4)" }, { formula: "C3" }, { formula: "B4-C4" }, { formula: "E3+D4" }, ""],
    ["Novembro", { formula: "B4*(1+Premissas!B4)" }, { formula: "C4" }, { formula: "B5-C5" }, { formula: "E4+D5" }, ""],
    ["Dezembro", { formula: "B5*(1+Premissas!B4)" }, { formula: "C5" }, { formula: "B6-C6" }, { formula: "E5+D6" }, ""],
    ["Janeiro", { formula: "B6*(1+Premissas!B4)" }, { formula: "C6" }, { formula: "B7-C7" }, { formula: "E6+D7" }, ""],
  ]);
  moneyCols(fluxo, [2, 3, 4, 5]);

  const receber = addSheet(wb, "Receber", ["Cliente", "Descricao", "Vencimento", "Valor", "Status"], [
    ["Cliente B", "Parcela 2 do projeto loja", "2026-09-05", 4500, "Aberto"],
    ["Cliente A", "Manutenção setembro", "2026-09-10", 2400, "Aberto"],
  ]);
  moneyCols(receber, [4]);

  const pagar = addSheet(wb, "Pagar", ["Fornecedor", "Descricao", "Vencimento", "Valor", "Status"], [
    ["Escritório", "Contador setembro", "2026-09-08", 420, "Aberto"],
    ["Freelancer C", "Layout extra", "2026-09-03", 800, "Aberto"],
    ["Receita Federal", "DAS setembro", "2026-09-20", 880, "Aberto"],
  ]);
  moneyCols(pagar, [4]);

  const centros = addSheet(wb, "Centros", ["Centro", "Gasto", "% despesa", "Formula"], [
    ["Comercial", { formula: 'SUMIF(Lancamentos!F:F,"Comercial",Lancamentos!C:C)', result: 900 }, { formula: "IF(Painel!B3=0,0,B2/Painel!B3)", result: 0.11 }, "=SOMASE(Lancamentos!F:F;A2;Lancamentos!C:C)"],
    ["Produto", { formula: 'SUMIF(Lancamentos!F:F,"Produto",Lancamentos!C:C)', result: 2138 }, { formula: "IF(Painel!B3=0,0,B3/Painel!B3)", result: 0.26 }, ""],
    ["Admin", { formula: 'SUMIF(Lancamentos!F:F,"Admin",Lancamentos!C:C)', result: 5150 }, { formula: "IF(Painel!B3=0,0,B4/Painel!B3)", result: 0.63 }, ""],
  ]);
  moneyCols(centros, [2]);
  pctCols(centros, [3]);

  const impostos = addSheet(wb, "Impostos", ["Tributo", "Base", "Aliquota", "Valor", "Formula"], [
    ["Estimado pelas premissas", { formula: "Painel!B2" }, { formula: "Premissas!B2" }, { formula: "B2*C2" }, "=Receita*alíquota"],
    ["Já lançado no mês", { formula: "Painel!B2" }, "", { formula: 'SUMIF(Lancamentos!E:E,"Impostos",Lancamentos!C:C)' }, "=SOMASE grupo Impostos"],
    ["Diferença a provisionar", "", "", { formula: "D2-D3" }, "=estimado − lançado"],
  ]);
  moneyCols(impostos, [2, 4]);
  impostos.getCell("C2").numFmt = "0%";

  const giro = addSheet(wb, "Giro", ["Indicador", "Valor", "Formula", "Regra"], [
    ["A receber aberto", { formula: 'SUMIF(Receber!E:E,"Aberto",Receber!D:D)' }, "=títulos em aberto", "Não comprometer no caixa"],
    ["A pagar aberto", { formula: 'SUMIF(Pagar!E:E,"Aberto",Pagar!D:D)' }, "", "Pagar no vencimento"],
    ["Ciclo (DSO − DPO)", { formula: "Premissas!B5-Premissas!B6" }, "=prazo receber − prazo pagar", "Quanto menor, melhor o caixa"],
    ["Caixa livre estimado", { formula: "Painel!B4+Giro!B2-Giro!B3" }, "=resultado + receber − pagar", ""],
  ]);
  moneyCols(giro, [2]);

  const kpi = addSheet(wb, "Indicadores", ["KPI", "Valor", "Formula", "Referencia"], [
    ["Margem", { formula: "Painel!B5" }, "=Resultado/Receita", "Alvo: Premissas"],
    ["Custo / receita", { formula: "IF(Painel!B2=0,0,DRE!B3/Painel!B2)" }, "=Custos/Receita", "Serviço: manter baixo"],
    ["Folha / receita", { formula: "IF(Painel!B2=0,0,DRE!B5/Painel!B2)" }, "=Folha/Receita", "Estoura fácil em empresa pequena"],
    ["Marketing / receita", { formula: "IF(Painel!B2=0,0,DRE!B7/Painel!B2)" }, "=Mkt/Receita", "Só sobe se o ticket acompanhar"],
    ["Margem vs alvo", { formula: "Painel!B5-Premissas!B3" }, "=real − alvo", "Negativo = preço ou custo"],
  ]);
  pctCols(kpi, [2]);

  if (full) {
    addSheet(wb, "Fechamento", ["Etapa", "Status", "Regra"], [
      ["Lançamentos conferidos", "Pendente", "Toda linha tem categoria e centro"],
      ["Receber e pagar batidos", "Pendente", "Nenhum título sem cliente/fornecedor"],
      ["Imposto provisionado", "Pendente", "Aba Impostos diferença = 0 ou justificada"],
      ["Banco = livro", "Pendente", "Conciliação zerada"],
      ["Mês travado", "Aberto", "Depois de travar, não relança o mês"],
    ]);
    addSheet(wb, "Equipe", ["Pessoa", "Papel", "Pode lançar", "Pode fechar mês"], [
      ["Dono", "ADMIN", "Sim", "Sim"],
      ["Financeiro", "FINANCE", "Sim", "Não"],
      ["Sócio", "VIEW", "Não", "Não"],
    ]);
    addSheet(wb, "Conciliacao", ["Conta", "Saldo livro", "Saldo banco", "Diferença", "Formula"], [
      ["Conta PJ", { formula: "Painel!B4" }, 14712, { formula: "C2-B2" }, "=banco − livro deve ser 0"],
      ["Cartão PJ", 0, 0, { formula: "C3-B3" }, ""],
    ]);
    moneyCols(wb.getWorksheet("Conciliacao")!, [2, 3, 4]);
    const prev = addSheet(wb, "Previsao", ["Mês", "Receita", "Despesa", "Resultado", "Caixa"], [
      ["M0", { formula: "Painel!B2" }, { formula: "Painel!B3" }, { formula: "B2-C2" }, { formula: "D2" }],
      ["M1", { formula: "B2*(1+Premissas!B4)" }, { formula: "C2" }, { formula: "B3-C3" }, { formula: "E2+D3" }],
      ["M2", { formula: "B3*(1+Premissas!B4)" }, { formula: "C3" }, { formula: "B4-C4" }, { formula: "E3+D4" }],
      ["M3", { formula: "B4*(1+Premissas!B4)" }, { formula: "C4" }, { formula: "B5-C5" }, { formula: "E4+D5" }],
      ["M4", { formula: "B5*(1+Premissas!B4)" }, { formula: "C5" }, { formula: "B6-C6" }, { formula: "E5+D6" }],
      ["M5", { formula: "B6*(1+Premissas!B4)" }, { formula: "C6" }, { formula: "B7-C7" }, { formula: "E6+D7" }],
      ["M6", { formula: "B7*(1+Premissas!B4)" }, { formula: "C7" }, { formula: "B8-C8" }, { formula: "E7+D8" }],
      ["M7", { formula: "B8*(1+Premissas!B4)" }, { formula: "C8" }, { formula: "B9-C9" }, { formula: "E8+D9" }],
      ["M8", { formula: "B9*(1+Premissas!B4)" }, { formula: "C9" }, { formula: "B10-C10" }, { formula: "E9+D10" }],
      ["M9", { formula: "B10*(1+Premissas!B4)" }, { formula: "C10" }, { formula: "B11-C11" }, { formula: "E10+D11" }],
      ["M10", { formula: "B11*(1+Premissas!B4)" }, { formula: "C11" }, { formula: "B12-C12" }, { formula: "E11+D12" }],
      ["M11", { formula: "B12*(1+Premissas!B4)" }, { formula: "C12" }, { formula: "B13-C13" }, { formula: "E12+D13" }],
    ]);
    moneyCols(prev, [2, 3, 4, 5]);
  }

  return wb.xlsx.writeBuffer();
}
