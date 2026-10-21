import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { Slot } from "radix-ui";
import { cn } from "cn";

const cardVariants = cva(
  "block rounded-xl border bg-card py-6 text-card-foreground shadow-sm",
  {
    variants: {
      variant: {
        default: "",
        panel: "panel",
        editor: "panel editor-panel",
        login: "login-card",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

function BaseCard({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof cardVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "div";
  return (
    <Comp
      data-variant={variant}
      data-slot="card"
      className={cn(cardVariants({ variant }), className)}
      {...props}
    />
  );
}

const cardHeaderVariants = cva(
  "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
);

function BaseCardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(cardHeaderVariants(), className)}
      {...props}
    />
  );
}

const cardTitleVariants = cva("leading-none font-semibold");

function BaseCardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn(cardTitleVariants(), className)}
      {...props}
    />
  );
}

const cardDescriptionVariants = cva("text-sm text-muted-foreground");

function BaseCardDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn(cardDescriptionVariants(), className)}
      {...props}
    />
  );
}

const cardActionVariants = cva(
  "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
);

function BaseCardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(cardActionVariants(), className)}
      {...props}
    />
  );
}

const cardContentVariants = cva("px-6");

function BaseCardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn(cardContentVariants(), className)}
      {...props}
    />
  );
}

const cardFooterVariants = cva("flex items-center px-6 [.border-t]:pt-6");

function BaseCardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(cardFooterVariants(), className)}
      {...props}
    />
  );
}

export {
  BaseCard,
  BaseCardHeader,
  BaseCardFooter,
  BaseCardTitle,
  BaseCardAction,
  BaseCardDescription,
  BaseCardContent,
};
