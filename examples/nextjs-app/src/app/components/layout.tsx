// Force all component demo pages to be dynamically rendered
// to avoid SSR issues with complex interactive demos
export const dynamic = "force-dynamic";

export default function ComponentsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
