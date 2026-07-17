import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table"
import { SearchX } from "lucide-react"

type DataTableProps<TData> = {
  data: TData[]
  columns: ColumnDef<TData, unknown>[]
  isLoading?: boolean
  emptyMessage?: string
  emptySubtext?: string
}

export function DataTable<TData>({
  data,
  columns,
  isLoading = false,
  emptyMessage = "No results found",
  emptySubtext = "There is no data to display at this time.",
}: DataTableProps<TData>) {
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable<TData>({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] border-collapse text-left text-sm">
          <thead className="bg-zinc-50/50 text-zinc-500 border-b border-zinc-200/80 uppercase tracking-wider text-[11px] font-bold">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="py-3 px-5 font-medium">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          <tbody className="divide-y divide-zinc-100 text-zinc-700">
            {isLoading ? (
              // ── Skeleton Loader ──
              [...Array(5)].map((_, idx) => (
                <tr key={`skeleton-${idx}`} className="animate-pulse">
                  {columns.map((_, colIdx) => (
                    <td key={`skeleton-cell-${colIdx}`} className="py-4 px-5">
                      <div className="h-4 w-full rounded bg-zinc-100" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length > 0 ? (
              // ── Data Rows ──
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="transition-colors hover:bg-zinc-50/80"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="py-3 px-5">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              // ── Empty State ──
              <tr>
                <td colSpan={columns.length} className="py-16 text-center">
                  <div className="mx-auto flex max-w-sm flex-col items-center justify-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-50 border border-zinc-100 mb-3 shadow-sm">
                      <SearchX className="h-6 w-6 text-zinc-400" />
                    </div>
                    <p className="text-[15px] font-semibold text-zinc-900">{emptyMessage}</p>
                    <p className="mt-1 text-[13px] font-medium text-zinc-500">{emptySubtext}</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
