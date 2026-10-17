export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 grid-bg" aria-hidden="true" />
      <div
        className="pointer-events-none absolute -top-40 right-1/4 h-96 w-96 animate-blob rounded-full bg-brand-500/25 blur-3xl motion-reduce:animate-none"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -top-24 left-0 h-72 w-72 animate-blob rounded-full bg-neon-400/20 blur-3xl [animation-delay:-6s] motion-reduce:animate-none"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-4xl px-4 pt-14 pb-10 text-center sm:px-6 sm:pt-20 sm:pb-12">
        <h1 className="animate-rise text-5xl leading-tight font-black tracking-tight sm:text-6xl md:text-7xl motion-reduce:animate-none">
          مقطّع
          <span className="block bg-gradient-to-l from-brand-600 via-violet-500 to-neon-400 bg-clip-text whitespace-nowrap text-transparent sm:mx-3 sm:inline">
            لتيك توك
          </span>
        </h1>
        <p className="mt-5 text-xl leading-9 font-extrabold sm:text-2xl">
          نزّل مقاطعك المفضلة بجودة عالية.
        </p>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-8 text-slate-600 sm:text-base dark:text-slate-400">
          الصق رابط فيديو تيك توك واحفظه بدون علامة مائية حسب المتاح، مباشرة من متصفحك وبدون تسجيل دخول.
        </p>
      </div>
    </section>
  );
}