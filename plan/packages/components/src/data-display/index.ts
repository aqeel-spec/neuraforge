export { Chart } from "./chart.js";
export type { ChartProps, ChartDataPoint } from "./chart.js";

export { CodeBlock } from "./code-block.js";
export type { CodeBlockProps } from "./code-block.js";

export { CopyButton } from "./copy-button.js";
export type { CopyButtonProps } from "./copy-button.js";

export { CountUp } from "./count-up.js";
export type { CountUpProps } from "./count-up.js";

export { List } from "./list.js";
export type { ListProps, ListItem } from "./list.js";

export { DataTable } from "./data-table.js";
export type { DataTableProps, DataTableColumn } from "./data-table.js";

export { Stat } from "./stat.js";
export type { StatProps } from "./stat.js";

export { Badge } from "./badge.js";
export type { BadgeProps } from "./badge.js";

export { Avatar, AvatarGroup } from "./avatar-group.js";
export type { AvatarProps, AvatarGroupProps } from "./avatar-group.js";

export { Tag } from "./tag.js";
export type { TagProps, TagVariant } from "./tag.js";

export { Timeline } from "./timeline.js";
export type { TimelineProps, TimelineItem } from "./timeline.js";

export { KBD } from "./kbd.js";
export type { KBDProps } from "./kbd.js";

export const dataDisplayComponentIds = [
  "data-table",
  "stat",
  "badge",
  "avatar",
  "avatar-group",
  "tag",
  "timeline",
  "kbd",
  "chart",
  "code-block",
  "copy-button",
  "count-up",
  "list",
] as const;
