export default function Loading() {
  return (
    <div className="min-h-screen bg-white pt-24 px-6 lg:px-12 animate-[fadeIn_0.4s_ease-out]">
      <div className="max-w-[1400px] mx-auto flex gap-8">
        
        {/* SIDEBAR */}
        <aside className="hidden md:block w-1/4 pr-6 border-r border-gray-100">
          <div className="space-y-6 animate-pulse">
            <div className="h-4 w-28 bg-gray-200 rounded" />

            <div className="space-y-3">
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <div
                  key={i}
                  className="h-12 w-full rounded-xl bg-gray-100"
                />
              ))}
            </div>
          </div>
        </aside>

        {/* GRID */}
        <main className="flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="flex flex-col animate-pulse opacity-0 animate-[fadeIn_0.5s_ease-out_forwards]"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="aspect-[16/10] w-full rounded-2xl bg-gray-100 mb-6" />
                <div className="h-5 w-20 rounded bg-gray-200 mb-3" />
                <div className="h-6 w-3/4 rounded bg-gray-200 mb-3" />
                <div className="space-y-1.5 mb-6">
                  <div className="h-3 w-16 rounded bg-gray-100" />
                  <div className="h-5 w-28 rounded bg-gray-200" />
                </div>
                <div className="h-4 w-28 rounded bg-gray-100 mt-auto" />
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}