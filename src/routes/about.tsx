import { Title } from "@solidjs/meta";

export default function About() {
  return (
    <main>
      <Title>About</Title>
      <div class="flex flex-col gap-5 max-w-2xl mx-auto my-20 p-12 rounded-lg border text-center">

        <h1 class="text-4xl tracking-tight mb-6 text-indigo-500">
          À propos de Vidora
        </h1>

        <div class="space-y-4 text-lg leading-relaxed">
          <p class="text-slate-500">
            Vidora.mg est une plateforme de vente en ligne de toutes les marques pour facilite la recherche et l'achat de produits locaux.
          </p>
        </div>

        <p class="text-xs text-slate-500 max-w-xl mx-auto my-5">
          Nous sommes une équipe de développeurs passionnés qui souhaitent améliorer la qualité de la vie des consommateurs en offrant des produits de haute qualité et des prix compétitifs.
        </p>

        <div class="my-2 border-t border-slate-100"></div>

        <p class="text-sm text-slate-400 dark:text-slate-500">
          Visitez{" "}
          <a
            href="https://start.solidjs.com"
            target="_blank"
            class="inline-flex items-center font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 underline decoration-2 underline-offset-4 transition-colors duration-200"
          >
            start.solidjs.com
          </a>{" "}
          pour découvrir SolidJS.
        </p>
      </div>

    </main>
  );
}
