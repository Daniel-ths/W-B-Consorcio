import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AdminButton from "@/components/AdminButton";

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />

      <main className="min-h-screen">
        {children}
      </main>

      <AdminButton />

      <Footer />
    </>
  );
}
