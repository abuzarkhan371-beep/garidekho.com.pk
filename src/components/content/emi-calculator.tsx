"use client";

import { useMemo, useState } from "react";
import { Calculator, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatNumber } from "@/lib/utils";

type YearRow = {
  year: number;
  principal: number;
  interest: number;
  balance: number;
};

function finite(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

export function EmiCalculator() {
  const [amount, setAmount] = useState("5000000");
  const [downPayment, setDownPayment] = useState("1000000");
  const [years, setYears] = useState("5");
  const [rate, setRate] = useState("12.5");

  const result = useMemo(() => {
    const price = finite(amount);
    const down = Math.min(finite(downPayment), price);
    const principal = Math.max(0, price - down);
    const months = Math.max(1, Math.round(finite(years) * 12));
    const annualRate = Number(rate) > 0 ? Number(rate) : 0;
    const monthlyRate = annualRate / 1200;

    const emi = principal === 0
      ? 0
      : monthlyRate === 0
        ? principal / months
        : (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);

    const totalPayable = emi * months;
    const totalInterest = Math.max(0, totalPayable - principal);

    const rows: YearRow[] = [];
    let balance = principal;
    let yearPrincipal = 0;
    let yearInterest = 0;

    for (let month = 1; month <= months; month += 1) {
      const interest = balance * monthlyRate;
      const principalPaid = Math.min(balance, emi - interest);
      balance = Math.max(0, balance - principalPaid);
      yearPrincipal += principalPaid;
      yearInterest += interest;

      if (month % 12 === 0 || month === months) {
        rows.push({
          year: Math.ceil(month / 12),
          principal: yearPrincipal,
          interest: yearInterest,
          balance,
        });
        yearPrincipal = 0;
        yearInterest = 0;
      }
    }

    return { price, down, principal, months, annualRate, emi, totalPayable, totalInterest, rows };
  }, [amount, downPayment, years, rate]);

  function reset() {
    setAmount("5000000");
    setDownPayment("1000000");
    setYears("5");
    setRate("12.5");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      <form
        className="surface-card rounded-xl p-5 sm:p-6"
        onSubmit={(event) => event.preventDefault()}
        aria-label="EMI inputs"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="size-5 text-link" />
            <h2 className="font-display text-base font-bold">Loan details</h2>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={reset}><RotateCcw /> Reset</Button>
        </div>

        <div className="mt-5 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="emi-amount">Vehicle price (PKR)</Label>
            <Input id="emi-amount" inputMode="numeric" value={amount} onChange={(event) => setAmount(event.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="emi-down">Down payment (PKR)</Label>
            <Input id="emi-down" inputMode="numeric" value={downPayment} onChange={(event) => setDownPayment(event.target.value)} />
            {Number(downPayment) > Number(amount) && Number(amount) > 0 && (
              <p className="text-xs font-medium text-amber-700">Down payment was capped at the vehicle price.</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="emi-years">Tenure (years)</Label>
              <Input id="emi-years" type="number" min="1" max="30" value={years} onChange={(event) => setYears(event.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="emi-rate">Interest rate (% p.a.)</Label>
              <Input id="emi-rate" type="number" min="0" max="40" step="0.1" value={rate} onChange={(event) => setRate(event.target.value)} />
            </div>
          </div>
        </div>

        <p className="mt-5 rounded-xl bg-ink-50 p-3 text-xs leading-relaxed text-ink-500 dark:bg-ink-800 dark:text-ink-300">
          Calculations use a reducing-balance formula with monthly compounding. Enter the rate quoted by your bank;
          processing fees, insurance and taxes are not included.
        </p>
      </form>

      <div className="space-y-5">
        <div className="surface-card overflow-hidden rounded-xl">
          <div className="bg-ink-950 p-6 text-white dark:bg-link-ink">
            <p className="text-xs font-semibold uppercase tracking-widest text-link-soft">Estimated monthly installment</p>
            <p className="mt-2 font-display text-3xl font-extrabold sm:text-4xl">PKR {formatNumber(Math.round(result.emi))}</p>
            <p className="mt-2 text-xs text-ink-200">
              {formatNumber(result.months)} months · {result.annualRate.toFixed(2)}% p.a. · financing PKR {formatNumber(result.principal)}
            </p>
          </div>
          <dl className="grid grid-cols-2 gap-px bg-ink-100 sm:grid-cols-4 dark:bg-ink-800">
            {[
              ["Vehicle price", result.price],
              ["Down payment", result.down],
              ["Total interest", result.totalInterest],
              ["Total payable", result.totalPayable],
            ].map(([label, value]) => (
              <div key={String(label)} className="bg-white p-4 dark:bg-ink-900">
                <dt className="text-[0.7rem] font-medium uppercase tracking-wide text-ink-400">{label}</dt>
                <dd className="mt-1 text-sm font-bold text-ink-900 dark:text-white">PKR {formatNumber(Math.round(Number(value)))}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="surface-card rounded-xl p-5 sm:p-6">
          <h2 className="font-display text-base font-bold">Amortization summary</h2>
          {result.rows.length > 0 ? (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[420px] text-left text-xs">
                <thead className="text-ink-400">
                  <tr className="border-b border-ink-100 dark:border-ink-800">
                    <th className="py-2 font-semibold">Year</th>
                    <th className="py-2 text-right font-semibold">Principal paid</th>
                    <th className="py-2 text-right font-semibold">Interest paid</th>
                    <th className="py-2 text-right font-semibold">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100 dark:divide-ink-800">
                  {result.rows.map((row) => (
                    <tr key={row.year} className="text-ink-700 dark:text-ink-200">
                      <td className="py-2 font-semibold">{row.year}</td>
                      <td className="py-2 text-right">PKR {formatNumber(Math.round(row.principal))}</td>
                      <td className="py-2 text-right">PKR {formatNumber(Math.round(row.interest))}</td>
                      <td className="py-2 text-right">PKR {formatNumber(Math.round(row.balance))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-2 text-sm text-ink-500">Enter a positive price to see the repayment schedule.</p>
          )}
        </div>
      </div>
    </div>
  );
}
