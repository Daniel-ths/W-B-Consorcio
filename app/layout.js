import { AuthProvider } from "../contexts/AuthContext"; // Ajuste o caminho
import "./globals.css";

export default function RootLayout({ children }) {
  return (
    <html lang="pt-br">
      <body>
        {/* Envolva tudo com o AuthProvider */}
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}