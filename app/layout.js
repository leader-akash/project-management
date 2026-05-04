import "./globals.css";
import { Providers } from "./providers";

export const metadata = {
  title: "ProjectFlow",
  description: "Internal project management with real-time collaboration"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

