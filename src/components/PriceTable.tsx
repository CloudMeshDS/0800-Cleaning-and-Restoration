import { formatPrice, getPrice, type PriceId } from "@/data/pricing";

export function PriceTable({ ids, compact = false }: { ids: readonly PriceId[]; compact?: boolean }) {
  if (!ids.length) {
    return <p className="text-[0.95rem] text-charcoal/70">Priced after assessment – every job in this category is different, so we quote rather than guess.</p>;
  }
  return (
    <table className="w-full text-left">
      <caption className="sr-only">Indicative prices</caption>
      <tbody className="divide-y divide-charcoal/10">
        {ids.map((id) => {
          const p = getPrice(id);
          return (
            <tr key={id}>
              <th scope="row" className={`font-normal text-charcoal/80 ${compact ? "py-2.5 text-sm" : "py-4"}`}>
                {p.label}
                {p.note && <span className="ml-2 text-xs text-charcoal/50">{p.note}</span>}
                {p.basis === "addon" && <span className="ml-2 rounded-full bg-sage/30 px-2 py-0.5 text-[0.68rem] font-semibold uppercase tracking-wider text-forest">Add-on</span>}
              </th>
              <td className={`text-right font-semibold tabular-nums text-forest ${compact ? "py-2.5 text-sm" : "py-4"}`}>{formatPrice(p)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
