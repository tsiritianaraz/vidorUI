import { TextField, TextFieldInput, TextFieldLabel } from "~/components/ui/text-field"
import { Button, buttonVariants } from "~/components/ui/button"

export default function Home() {
  return (
    <main>
      <section class="flex flex-col items-center justify-center text-center gap-4 py-24 md:py-32 px-4">
        <h1 class="scroll-m-20 text-3xl md:text-4xl font-bold tracking-tight text-foreground max-w-3xl leading-tight">
          Découvrir les <span class="font-semibold text-indigo-600">meilleures offres</span> de vos produits
        </h1>

        <p class="text-sm text-muted-foreground max-w-xl">Comparez, économisez et trouvez les meilleurs prix en quelques clics.</p>
      
        <TextField class="flex flex-row w-full max-w-sm items-center">
          <TextFieldInput type="text" placeholder="Quel produit voulez-vous ?" />
          <Button as="a" href="/search" class="flex-1 text-sm" variant="outline">
            Rechercher
          </Button>
          
        </TextField>
      </section>
    </main>
  );
}
