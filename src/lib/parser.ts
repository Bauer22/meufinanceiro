// Interpretador de frases em português, baseado em regras simples (sem IA).
// Ex.: "Gastei 45,90 no mercado hoje" -> { type: "EXPENSE", amount: 45.9, category: "Alimentação", ... }

export type ParsedTransaction = {
  description: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
  category: string;
  date: Date;
};

const INCOME_WORDS = [
  "recebi", "ganhei", "receita", "salario", "salário", "entrou", "vendi", "venda",
  "faturei", "depositaram", "deposito", "depósito", "pagamento de cliente", "freela", "rendimento",
];

const CATEGORIES: { name: string; words: string[]; income?: boolean }[] = [
  { name: "Salário", words: ["salario", "salário"], income: true },
  { name: "Vendas", words: ["venda", "vendi", "cliente", "faturei"], income: true },
  { name: "Freelance", words: ["freela", "freelance", "projeto"], income: true },
  { name: "Rendimentos", words: ["rendimento", "dividendo", "juros"], income: true },
  { name: "Alimentação", words: ["almoco", "almoço", "jantar", "cafe", "café", "lanche", "mercado", "supermercado", "padaria", "restaurante", "ifood", "pizza", "comida"] },
  { name: "Transporte", words: ["combustivel", "combustível", "gasolina", "uber", "onibus", "ônibus", "estacionamento", "pedagio", "pedágio", "passagem"] },
  { name: "Moradia", words: ["aluguel", "condominio", "condomínio", "luz", "agua", "água", "internet", "energia", "gas", "gás"] },
  { name: "Saúde", words: ["farmacia", "farmácia", "remedio", "remédio", "consulta", "medico", "médico", "dentista", "exame"] },
  { name: "Lazer", words: ["cinema", "viagem", "bar", "show", "streaming", "netflix", "spotify", "jogo"] },
  { name: "Educação", words: ["curso", "livro", "faculdade", "escola", "mensalidade"] },
  { name: "Investimento", words: ["investi", "investimento", "acoes", "ações", "tesouro", "cripto", "bitcoin"] },
  { name: "Impostos", words: ["imposto", "das", "iptu", "ipva", "taxa"] },
];

const strip = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Converte "1.250,50", "45,90", "45.90", "1250" em número. */
export function parseAmountToken(raw: string): number {
  let t = raw.trim();
  if (t.includes(",")) t = t.replace(/\./g, "").replace(",", ".");
  else if (/^\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, "");
  return parseFloat(t);
}

function findAmount(text: string): { value: number; match: string } | null {
  // Prioriza valores com R$ ou "reais"; depois qualquer número (ignorando datas dd/mm).
  const noDates = text.replace(/\b\d{1,2}\/\d{1,2}(\/\d{2,4})?\b/g, " ");
  const patterns = [
    /r\$\s*(\d[\d.,]*)/i,
    /(\d[\d.,]*)\s*(?:reais|real|conto|contos)/i,
    /(\d[\d.,]*)/,
  ];
  for (const p of patterns) {
    const m = noDates.match(p);
    if (m) {
      const value = parseAmountToken(m[1].replace(/[.,]$/, ""));
      if (Number.isFinite(value) && value > 0) return { value, match: m[0] };
    }
  }
  return null;
}

function findDate(text: string, now: Date): { date: Date; match: string | null } {
  const base = new Date(now);
  base.setHours(12, 0, 0, 0);
  const t = strip(text);
  if (/\banteontem\b/.test(t)) { base.setDate(base.getDate() - 2); return { date: base, match: "anteontem" }; }
  if (/\bontem\b/.test(t)) { base.setDate(base.getDate() - 1); return { date: base, match: "ontem" }; }
  const m = text.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/);
  if (m) {
    const d = parseInt(m[1], 10);
    const mo = parseInt(m[2], 10) - 1;
    let y = m[3] ? parseInt(m[3], 10) : base.getFullYear();
    if (y < 100) y += 2000;
    const date = new Date(y, mo, d, 12, 0, 0);
    if (!isNaN(date.getTime()) && mo >= 0 && mo < 12 && d >= 1 && d <= 31) return { date, match: m[0] };
  }
  return { date: base, match: /\bhoje\b/.test(t) ? "hoje" : null };
}

export function parseTransaction(input: string, now = new Date()): ParsedTransaction | null {
  const text = input.trim();
  if (!text) return null;

  const amt = findAmount(text);
  if (!amt) return null;

  const t = strip(text);
  const isIncome = INCOME_WORDS.some((w) => new RegExp(`\\b${strip(w)}`).test(t));
  const type: "INCOME" | "EXPENSE" = isIncome ? "INCOME" : "EXPENSE";

  const cat = CATEGORIES.find(
    (c) => (c.income === undefined || c.income === isIncome) && c.words.some((w) => new RegExp(`\\b${strip(w)}`).test(t)),
  );
  const category = cat?.name ?? "Outros";

  const { date, match: dateMatch } = findDate(text, now);

  // Descrição: remove verbo, valor e data; mantém o que sobrou.
  let desc = text.replace(amt.match, " ");
  if (dateMatch) desc = desc.replace(new RegExp(dateMatch.replace(/\//g, "\\/"), "i"), " ");
  desc = desc
    .replace(/(?<![\p{L}])(gastei|paguei|comprei|recebi|ganhei|vendi|investi|de|em|no|na|com|para|pra|um|uma|o|a|hoje|reais|real)(?![\p{L}])/giu, " ")
    .replace(/[R$]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const description = desc ? desc.charAt(0).toUpperCase() + desc.slice(1) : category;

  return { description, amount: amt.value, type, category, date };
}
