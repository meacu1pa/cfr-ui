import * as React from "react"
import { Legend, ResponsiveContainer, Tooltip, type LegendProps, type TooltipProps } from "recharts"

import { cn } from "@/lib/utils"

const THEMES = {
  light: "",
  dark: ".dark",
} as const

type ChartConfig = Record<
  string,
  {
    label?: React.ReactNode
    icon?: React.ComponentType<{ className?: string }>
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<keyof typeof THEMES, string> }
  )
>

type ChartContextValue = {
  config: ChartConfig
}

const ChartContext = React.createContext<ChartContextValue | null>(null)

function useChart() {
  const context = React.useContext(ChartContext)

  if (!context) {
    throw new Error("useChart must be used within a ChartContainer")
  }

  return context
}

type ChartContainerProps = React.ComponentProps<"div"> & {
  config?: ChartConfig
  children: React.ComponentProps<typeof ResponsiveContainer>["children"]
}

function ChartContainer({ className, config = {}, children, ...props }: ChartContainerProps) {
  const id = React.useId()

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-slot="chart"
        data-chart={id}
        className={cn(
          "flex justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-hidden [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-sector]:outline-hidden [&_.recharts-surface]:outline-hidden",
          className,
        )}
        {...props}
      >
        <ChartStyle id={id} config={config} />
        <ResponsiveContainer>{children}</ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
}

function ChartStyle({ id, config }: { id: string; config: ChartConfig }) {
  const entries = Object.entries(config).filter(
    ([, value]) => value?.color || value?.theme?.light || value?.theme?.dark,
  )

  if (!entries.length) {
    return null
  }

  const css = Object.entries(THEMES)
    .map(([theme, selector]) => {
      const colors = entries
        .map(([key, value]) => {
          const color = value.theme?.[theme as keyof typeof THEMES] ?? value.color
          return color ? `  --color-${key}: ${color};` : null
        })
        .filter(Boolean)
        .join("\n")

      return `${selector} [data-chart="${id}"] {\n${colors}\n}`
    })
    .join("\n")

  return <style>{css}</style>
}

const ChartTooltip = Tooltip
const ChartLegend = Legend

type ChartTooltipContentProps = React.ComponentProps<"div"> &
  TooltipProps<number, string> & {
    hideLabel?: boolean
    hideIndicator?: boolean
    indicator?: "dot" | "line" | "dashed"
    nameKey?: string
    labelKey?: string
  }

const ChartTooltipContent = React.forwardRef<HTMLDivElement, ChartTooltipContentProps>(
  (
    {
      active,
      payload,
      className,
      indicator = "dot",
      hideLabel,
      hideIndicator,
      label,
      labelFormatter,
      labelClassName,
      formatter,
      color,
      nameKey,
      labelKey,
      ...props
    },
    ref,
  ) => {
    const { config } = useChart()

    if (!active || !payload?.length) {
      return null
    }

    const primaryPayload = payload[0]
    const labelValue = labelKey ? primaryPayload?.payload?.[labelKey] : label
    const labelKeyName = labelKey ?? primaryPayload?.dataKey ?? primaryPayload?.name ?? "value"
    const labelConfig = config[labelKeyName as string]

    const resolvedLabel = hideLabel
      ? null
      : labelFormatter
        ? labelFormatter(labelValue, payload)
        : labelConfig?.label ?? labelValue

    return (
      <div
        ref={ref}
        className={cn(
          "grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-2 text-xs shadow-xl",
          className,
        )}
        {...props}
      >
        {resolvedLabel ? <div className={cn("font-medium", labelClassName)}>{resolvedLabel}</div> : null}
        <div className="grid gap-1.5">
          {payload.map((item, index) => {
            const key = nameKey ?? item.name ?? item.dataKey ?? "value"
            const configItem = config[key as string]
            const indicatorColor = color ?? item.color ?? `var(--color-${key})`
            const formattedValue = formatter ? formatter(item.value, item.name, item, index, payload) : item.value
            const displayValue = Array.isArray(formattedValue) ? formattedValue[0] : formattedValue

            return (
              <div key={`${key}-${index}`} className="flex items-center gap-2">
                {!hideIndicator && (
                  <span
                    className={cn(
                      "shrink-0 rounded-[2px] border border-border/50",
                      indicator === "dot" && "h-2.5 w-2.5 rounded-full",
                      indicator === "line" && "h-0.5 w-3",
                      indicator === "dashed" && "h-0.5 w-3 border border-dashed",
                    )}
                    style={{ backgroundColor: indicatorColor, borderColor: indicatorColor }}
                  />
                )}
                <div className="flex flex-1 items-center justify-between gap-2">
                  <span className="text-muted-foreground">{configItem?.label ?? item.name ?? key}</span>
                  <span className="font-mono tabular-nums text-foreground">{displayValue as React.ReactNode}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  },
)
ChartTooltipContent.displayName = "ChartTooltipContent"

type ChartLegendContentProps = React.ComponentProps<"div"> &
  LegendProps & {
    hideIcon?: boolean
    nameKey?: string
  }

const ChartLegendContent = React.forwardRef<HTMLDivElement, ChartLegendContentProps>(
  ({ className, payload, verticalAlign = "bottom", hideIcon, nameKey, ...props }, ref) => {
    const { config } = useChart()

    if (!payload?.length) {
      return null
    }

    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-wrap items-center gap-4 text-xs",
          verticalAlign === "top" ? "pb-3" : "pt-3",
          className,
        )}
        {...props}
      >
        {payload.map((item, index) => {
          const key = nameKey ?? item.dataKey ?? item.value ?? `item-${index}`
          const configItem = config[key as string]
          const Icon = configItem?.icon
          const color = item.color ?? `var(--color-${key})`

          return (
            <div key={`${key}-${index}`} className="flex items-center gap-1.5">
              {hideIcon ? null : Icon ? (
                <Icon className="size-3 text-muted-foreground" />
              ) : (
                <span className="size-2 rounded-full" style={{ backgroundColor: color }} />
              )}
              <span className="text-muted-foreground">{configItem?.label ?? item.value ?? key}</span>
            </div>
          )
        })}
      </div>
    )
  },
)
ChartLegendContent.displayName = "ChartLegendContent"

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
}
