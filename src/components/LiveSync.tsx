"use client";

import { setPriceTable, type PriceTable } from "@/data/pricing";
import { setCatalogue, type Catalogue } from "@/data/services";

/**
 * Installs the live price table and catalogue in the browser before any
 * client component (quote form, catalogue browser) reads them. Rendered first
 * in <body>. The catalogue passed here is already filtered to visible items.
 */
export function LiveSync({ table, catalogue }: { table: PriceTable; catalogue: Catalogue }) {
  setPriceTable(table);
  setCatalogue(catalogue);
  return null;
}
