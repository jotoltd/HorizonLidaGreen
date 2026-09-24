import "./globals.css";

export const metadata = {
  title: "Horizon Lida Green | Delivery Portal",
  description: "Your vehicle deliveries, bookings and documents in one place.",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
