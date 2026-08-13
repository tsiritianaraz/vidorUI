import { Title } from "@solidjs/meta";

export default function Home() {
  return (
    <main>
      <Title>Vidor</Title>

      <section class="flex flex-col items-center justify-center text-center gap-4 py-24 md:py-32 px-4">
        <h1 class="scroll-m-20 text-4xl md:text-6xl font-bold tracking-tight text-foreground max-w-3xl leading-tight">
          Découvrir les <span class="text-primary">meilleures offres</span> de vos produits
        </h1>

        <p class="text-lg text-muted-foreground max-w-xl">Comparez, économisez et trouvez les meilleurs prix en quelques clics.</p>
      </section>
    </main>
  );
}
