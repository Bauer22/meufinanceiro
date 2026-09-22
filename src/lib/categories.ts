export const EXPENSE_CATEGORIES = [
  "Alimentação", "Transporte", "Moradia", "Saúde", "Lazer", "Educação", "Investimento", "Impostos", "Outros",
];
export const INCOME_CATEGORIES = ["Salário", "Vendas", "Freelance", "Rendimentos", "Outros"];
export const ALL_CATEGORIES = Array.from(new Set([...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES]));
