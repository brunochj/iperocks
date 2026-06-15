import SearchBar from "@/app/components/SearchBar";
import BackButton from "@/app/components/back-button";

export default function CroquiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Barra de busca fixa no topo (sticky) */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-sm shadow-sm">
        <BackButton />
        <div className="max-w-2xl mx-auto px-4 py-2">
          <SearchBar />
        </div>
      </div>
      {/* Conteúdo principal da página (setores, blocos ou linhas) */}
      <main className="max-w-2xl mx-auto px-4 pb-20">{children}</main>
    </div>
  );
}
