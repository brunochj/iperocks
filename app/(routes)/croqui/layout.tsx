import SearchBar from "@/app/components/SearchBar";
import BackButton from "@/app/components/back-button";

export default function CroquiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Barra de busca fixa no topo (sticky) */}
      <div className="sticky top-0 z-20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm shadow-sm dark:shadow-gray-800">
        <div className="flex items-center gap-2 max-w-2xl justify-between w-full mx-auto px-4 py-2">
          <div className="w-[10%] shrink-0">
            <BackButton />
          </div>
          <div className="w-[90%]">
            <SearchBar />
          </div>
        </div>
      </div>
      {/* Conteúdo principal da página (setores, blocos ou linhas) */}
      <main className="max-w-2xl mx-auto px-4 pb-20">{children}</main>
    </div>
  );
}
