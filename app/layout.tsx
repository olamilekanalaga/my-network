import "./globals.css";
export const metadata = {
  title: "Network — Your next move",
  description:
    "Your people, your possibilities. A private workspace to build relationships, grow a business, and make your next career move.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
