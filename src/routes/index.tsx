import { Title } from "@solidjs/meta";
import Counter from "~/components/Counter";

export default function Home() {
  return (
    <main>
      <Title>Vidor</Title>
      <h1>Decouvrir les meilleurs offres de vos produits</h1>
      <Counter />
    </main>
  );
}
