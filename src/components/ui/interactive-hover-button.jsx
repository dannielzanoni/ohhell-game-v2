import { cn } from "@/lib/utils"

export function InteractiveHoverButton({
  children,
  className,
  ...props
}) {
  return (
    <button
      className={cn(
        "group bg-background relative w-auto cursor-pointer overflow-hidden rounded-full border p-2 px-6 text-center font-semibold transition-colors",
        className
      )}
      {...props}>
      <span className="absolute inset-0 translate-y-full bg-primary transition-transform duration-300 group-hover:translate-y-0" />
      <span className="relative z-10 flex items-center justify-center gap-2 transition-colors duration-300 group-hover:text-primary-foreground">
        {children}
      </span>
    </button>
  );
}
