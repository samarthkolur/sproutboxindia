export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar will be added in Phase 2 */}
      <main className="flex-1">{children}</main>
      {/* Footer will be added in Phase 2 */}
    </div>
  );
}
