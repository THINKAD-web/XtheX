import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";

type Row = { key: string; value: string };

type Props = {
  rows: Row[];
};

export function MediaSpecTable({ rows }: Props) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white/90 p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/75">
      <Table>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.key} className="border-zinc-200/70 dark:border-zinc-700/60">
              <TableCell className="w-[34%] text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                {row.key}
              </TableCell>
              <TableCell className="text-sm text-zinc-800 dark:text-zinc-100">
                {row.value}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
