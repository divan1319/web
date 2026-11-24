import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Dotnet Atlas | Laboratorio de ingeniería .NET",
  description: "Un campus interactivo con 26 clases de C#, ASP.NET Core, EF Core, PostgreSQL y prácticas empresariales.",
};
export default function RootLayout({ children }:Readonly<{children:React.ReactNode}>) {
  return (
    <html lang="es" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          try {
            if (localStorage.getItem('dotnet-atlas-theme') === 'light') {
              document.documentElement.dataset.theme = 'light';
            }
          } catch {}
        ` }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
