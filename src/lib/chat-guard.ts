import { planChatAsksPerDay, planChatChars, planChatAskLabel, type PlanId } from "./plans";
import { newId, nowIso } from "./types";

export const CHAT_FILE_MAX_BYTES = 6 * 1024 * 1024;

export type ChatAskState = {
  used: number;
  limit: number;
  remaining: number;
  infinite: boolean;
};

export type ChatThread<TMsg> = {
  id: string;
  title: string;
  messages: TMsg[];
  showSheet: boolean;
  updatedAt: string;
};

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function fold(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function readChatAsks(userId: string, plan: PlanId | string | null | undefined): ChatAskState {
  const limit = planChatAsksPerDay(plan);
  const infinite = !Number.isFinite(limit);
  if (!userId || infinite) {
    return { used: 0, limit, remaining: Number.POSITIVE_INFINITY, infinite: true };
  }
  let used = 0;
  try {
    const raw = localStorage.getItem(`fc-chat-asks-${userId}`);
    if (raw) {
      const saved = JSON.parse(raw) as { date?: string; count?: number };
      if (saved.date === todayKey()) used = Math.max(0, Number(saved.count) || 0);
    }
  } catch {
    used = 0;
  }
  return { used, limit, remaining: Math.max(0, limit - used), infinite: false };
}

export function bumpChatAsk(userId: string, plan: PlanId | string | null | undefined): ChatAskState {
  const current = readChatAsks(userId, plan);
  if (current.infinite) return current;
  if (current.remaining <= 0) return current;
  const next = { ...current, used: current.used + 1, remaining: current.remaining - 1 };
  try {
    localStorage.setItem(`fc-chat-asks-${userId}`, JSON.stringify({ date: todayKey(), count: next.used }));
  } catch {
    /* ignore */
  }
  return next;
}

export function chatLimitLines(plan: PlanId | string | null | undefined) {
  return [
    planChatAskLabel(plan),
    `Até ${planChatChars(plan)} caracteres por pergunta`,
    "Só finanças, orçamento e empresa",
    "Sem senha, token ou cartão",
    "Não transfere PIX — só muda se você confirmar",
  ];
}

const FINANCE =
  /(gasto|ganho|salario|recebi|paguei|orcamento|orçamento|empresa|planilha|divida|conta|pix|imposto|caixa|dre|investimento|meta|teto|aluguel|ifood|mercado|cartao|boleto|mei|autonomo|folha|das|lucro|preju|reserva|corte|50-30-20|fluxo|titulo|concili|patrimonio|saldo|livre|mes|mês|analis|porte|grande|pequena)/;
const OFF_TOPIC =
  /(sexo|porno|nude|namorad|futebol|minecraft|hackear|bomb|arma de fogo|politica partid|eleicao|eleição|receita de bolo|codigo python|javascript homework|trabalho de escola)/;
const SECRET = /(senha|codigo do banco|token|cvv|cvc|numero do cartao|número do cartão|chave pix de outra pessoa)/;

export function chatMessageIssue(raw: string, plan: PlanId | string | null | undefined): string | null {
  const text = raw.trim();
  if (!text) return "Escreve a pergunta.";
  const max = planChatChars(plan);
  if (text.length > max) {
    return `Esta pergunta passou de ${max} caracteres neste plano. Encurta, ou sobe de plano.`;
  }
  const t = fold(text);
  if (SECRET.test(t)) {
    return "Eu não peço senha, token, CVV nem número de cartão. Isso não entra neste chat.";
  }
  if (OFF_TOPIC.test(t) && !FINANCE.test(t)) {
    return "Este chat é só de dinheiro: gasto, orçamento, empresa e planilha. Fora disso eu não respondo.";
  }
  return null;
}

export function chatFileIssue(file: File) {
  if (file.size > CHAT_FILE_MAX_BYTES) {
    return "Esse arquivo passou de 6 MB. Manda um Excel ou CSV menor.";
  }
  if (!/\.(xlsx|xls|csv|xlsm)$/i.test(file.name)) {
    return "Manda Excel ou CSV.";
  }
  return null;
}

function packKey(workspaceId: string) {
  return `fc-chat-pack-${workspaceId}`;
}

function oldKey(workspaceId: string) {
  return `fc-chat-${workspaceId}`;
}

export function threadTitleFrom(messages: { from: string; body: string }[]) {
  const first = messages.find((msg) => msg.from === "user")?.body?.trim();
  if (!first) return "Nova conversa";
  const clean = first.replace(/\s+/g, " ");
  return clean.length > 28 ? `${clean.slice(0, 26)}…` : clean;
}

export function loadChatPack<TMsg>(
  workspaceId: string,
  welcome: TMsg[],
): { threads: ChatThread<TMsg>[]; openId: string } {
  try {
    const packed = localStorage.getItem(packKey(workspaceId));
    if (packed) {
      const saved = JSON.parse(packed) as { threads?: ChatThread<TMsg>[]; openId?: string };
      if (saved.threads?.length) {
        const openId = saved.threads.some((t) => t.id === saved.openId) ? saved.openId! : saved.threads[0].id;
        return { threads: saved.threads.slice(0, 12), openId };
      }
    }
    const legacy = localStorage.getItem(oldKey(workspaceId));
    if (legacy) {
      const saved = JSON.parse(legacy) as { messages?: TMsg[]; showSheet?: boolean };
      if (saved.messages?.length) {
        const thread: ChatThread<TMsg> = {
          id: newId(),
          title: threadTitleFrom(saved.messages as { from: string; body: string }[]),
          messages: saved.messages,
          showSheet: Boolean(saved.showSheet),
          updatedAt: nowIso(),
        };
        return { threads: [thread], openId: thread.id };
      }
    }
  } catch {
    /* ignore */
  }
  const thread: ChatThread<TMsg> = {
    id: newId(),
    title: "Nova conversa",
    messages: welcome,
    showSheet: true,
    updatedAt: nowIso(),
  };
  return { threads: [thread], openId: thread.id };
}

export function saveChatPack<TMsg>(workspaceId: string, threads: ChatThread<TMsg>[], openId: string) {
  try {
    localStorage.setItem(packKey(workspaceId), JSON.stringify({ threads: threads.slice(0, 12), openId }));
    localStorage.removeItem(oldKey(workspaceId));
  } catch {
    /* ignore */
  }
}

export function clearChatPack(workspaceId: string) {
  try {
    localStorage.removeItem(packKey(workspaceId));
    localStorage.removeItem(oldKey(workspaceId));
  } catch {
    /* ignore */
  }
}

export function freshThread<TMsg>(welcome: TMsg[]): ChatThread<TMsg> {
  return {
    id: newId(),
    title: "Nova conversa",
    messages: welcome,
    showSheet: false,
    updatedAt: nowIso(),
  };
}

export const THINKING_LINES = [
  "Olhando o mês…",
  "Batendo com o lançamento…",
  "Contando os centavos…",
  "Montando a resposta…",
];
