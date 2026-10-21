import { cva } from "class-variance-authority";
import * as React from "react";
import { cn } from "cn";
import { ChevronDownIcon } from "lucide-react";
import { Accordion as AccordionPrimitive } from "radix-ui";

function BaseAccordion({
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Root>) {
  return <AccordionPrimitive.Root data-slot="accordion" {...props} />;
}

const accordionItemVariants = cva("border-b last:border-b-0");

function BaseAccordionItem({
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn(accordionItemVariants(), className)}
      {...props}
    />
  );
}

const accordionHeaderVariants = cva("flex");

const accordionTriggerVariants = cva(
  "flex flex-1 items-start justify-between gap-4 rounded-md py-4 text-left text-sm font-medium transition-all outline-none hover:underline focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&[data-state=open]>svg]:rotate-180",
);

const accordionIconVariants = cva(
  "pointer-events-none size-4 shrink-0 translate-y-0.5 text-muted-foreground transition-transform duration-200",
);

function BaseAccordionTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Header className={cn(accordionHeaderVariants())}>
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(accordionTriggerVariants(), className)}
        {...props}
      >
        {children}
        <ChevronDownIcon className={cn(accordionIconVariants())} />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

const accordionContentVariants = cva(
  "overflow-hidden text-sm data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down",
);

const accordionContentBodyVariants = cva("pt-0 pb-4");

function BaseAccordionContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content
      data-slot="accordion-content"
      className={cn(accordionContentVariants())}
      {...props}
    >
      <div className={cn(accordionContentBodyVariants(), className)}>
        {children}
      </div>
    </AccordionPrimitive.Content>
  );
}

export {
  BaseAccordion,
  BaseAccordionItem,
  BaseAccordionTrigger,
  BaseAccordionContent,
};
