"use client";

import { cva, type VariantProps } from "class-variance-authority";

import * as React from "react";
import { cn } from "cn";

const tableVariants = cva("w-full caption-bottom text-sm", {
  variants: {
    variant: {
      default: "",
      inventory: "items-main-table",
      lines: "purchase-lines-table",
    },
  },
  defaultVariants: { variant: "default" },
});

function BaseTable({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"table"> & VariantProps<typeof tableVariants>) {
  return (
    <table
      data-slot="table"
      data-variant={variant}
      className={cn(tableVariants({ variant }), className)}
      {...props}
    />
  );
}

const tableHeaderVariants = cva("[&_tr]:border-b");

function BaseTableHeader({
  className,
  ...props
}: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn(tableHeaderVariants(), className)}
      {...props}
    />
  );
}

const tableBodyVariants = cva("[&_tr:last-child]:border-0");

function BaseTableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn(tableBodyVariants(), className)}
      {...props}
    />
  );
}

const tableFooterVariants = cva(
  "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
);

function BaseTableFooter({
  className,
  ...props
}: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(tableFooterVariants(), className)}
      {...props}
    />
  );
}

const tableRowVariants = cva(
  "border-b transition-colors hover:bg-muted/50 has-aria-expanded:bg-muted/50 data-[state=selected]:bg-muted",
);

function BaseTableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(tableRowVariants(), className)}
      {...props}
    />
  );
}

const tableHeadVariants = cva(
  "h-10 px-2 text-left align-middle font-medium whitespace-nowrap text-foreground [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
);

function BaseTableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(tableHeadVariants(), className)}
      {...props}
    />
  );
}

const cellVariants = cva(
  "p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
  {
    variants: {
      variant: {
        default: "",
        empty: "empty p-9 text-center text-[var(--muted)]",
        code: "items-code",
        name: "items-name",
        numeric: "items-number",
        expired: "items-expired",
        money: "purchase-money",
        "empty-lines": "purchase-empty",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

function BaseTableCell({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"td"> & VariantProps<typeof cellVariants>) {
  return (
    <td
      data-variant={variant}
      data-slot="table-cell"
      className={cn(cellVariants({ variant }), className)}
      {...props}
    />
  );
}

const tableCaptionVariants = cva("mt-4 text-sm text-muted-foreground");

function BaseTableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn(tableCaptionVariants(), className)}
      {...props}
    />
  );
}

export {
  BaseTable,
  BaseTableHeader,
  BaseTableBody,
  BaseTableFooter,
  BaseTableHead,
  BaseTableRow,
  BaseTableCell,
  BaseTableCaption,
};
