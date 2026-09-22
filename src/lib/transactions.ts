import { prisma } from "./prisma";
import { installmentDates, splitInstallments } from "./dates";

export type NewTransaction = {
  description: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
  category: string;
  date: Date;
  accountId?: string | null;
  installments?: number;
};

/** Cria um lançamento; com installments >= 2, cria uma parcela por mês. */
export async function createTransactions(input: NewTransaction) {
  const n = input.installments && input.installments >= 2 ? Math.min(input.installments, 48) : 1;
  const accountId = input.accountId || null;

  if (n === 1) {
    return [
      await prisma.transaction.create({
        data: {
          description: input.description,
          amount: input.amount,
          type: input.type,
          category: input.category,
          date: input.date,
          accountId,
        },
      }),
    ];
  }

  const group = crypto.randomUUID();
  const amounts = splitInstallments(input.amount, n);
  const dates = installmentDates(input.date, n);
  return prisma.$transaction(
    amounts.map((amount, i) =>
      prisma.transaction.create({
        data: {
          description: `${input.description} (${i + 1}/${n})`,
          amount,
          type: input.type,
          category: input.category,
          date: dates[i],
          accountId,
          installmentGroup: group,
          installmentNumber: i + 1,
          installmentTotal: n,
        },
      }),
    ),
  );
}
