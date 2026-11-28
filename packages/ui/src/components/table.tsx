import {
  Cell as AriaCell,
  Column as AriaColumn,
  Row as AriaRow,
  Table as AriaTable,
  TableBody as AriaTableBody,
  TableHeader as AriaTableHeader,
  type CellProps,
  type ColumnProps,
  type RowProps,
  type TableBodyProps,
  type TableHeaderProps,
  type TableProps,
} from "react-aria-components";
import { cn } from "../lib/cn";

export function Table({
  className,
  ...props
}: Omit<TableProps, "className"> & { className?: string }) {
  return (
    <div className="relative w-full overflow-auto">
      <AriaTable
        {...props}
        className={cn("w-full caption-bottom border-collapse text-sm outline-none", className)}
      />
    </div>
  );
}

export function TableHeader<T extends object>(props: TableHeaderProps<T>) {
  return <AriaTableHeader {...props} className="border-b" />;
}

export function Column({
  className,
  ...props
}: Omit<ColumnProps, "className"> & { className?: string }) {
  return (
    <AriaColumn
      {...props}
      className={cn(
        "h-10 px-3 text-start align-middle font-medium whitespace-nowrap text-muted-foreground outline-none",
        "data-[focus-visible]:ring-2 data-[focus-visible]:ring-ring data-[focus-visible]:ring-inset",
        className,
      )}
    />
  );
}

export function TableBody<T extends object>(props: TableBodyProps<T>) {
  return <AriaTableBody {...props} />;
}

export function Row<T extends object>({
  className,
  ...props
}: Omit<RowProps<T>, "className"> & { className?: string }) {
  return (
    <AriaRow
      {...props}
      className={cn(
        "border-b outline-none transition-colors data-[hovered]:bg-muted/50 data-[selected]:bg-muted",
        "data-[focus-visible]:ring-2 data-[focus-visible]:ring-ring data-[focus-visible]:ring-inset",
        className,
      )}
    />
  );
}

export function Cell({
  className,
  ...props
}: Omit<CellProps, "className"> & { className?: string }) {
  return (
    <AriaCell
      {...props}
      className={cn(
        "p-3 align-middle outline-none data-[focus-visible]:ring-2 data-[focus-visible]:ring-ring data-[focus-visible]:ring-inset",
        className,
      )}
    />
  );
}
