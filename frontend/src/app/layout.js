import "./globals.css";

export const metadata = {
  title: "EduNexus",
  description: "SIMS - Smart Institute Management System",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
