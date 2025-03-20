import * as fs from "fs";
import * as crypto from "node:crypto";

interface Product {
  id: number;
  title: string;
  supermarket: string;
}

interface GroupProduct {
  category: string;
  count: number;
  products: Omit<Product, "id">[];
}

function hashProductString(productString: string) {
  // Converte para minúsculas
  let normalized = productString.toLowerCase();

  // Padroniza separação de palavras
  normalized = normalized.replace(/[\s-]+/g, " ").trim();

  // Padroniza unidades de medida
  normalized = normalized.replace(/litros?/gi, "l");
  normalized = normalized.replace(/quilos?/gi, "kg");

  // Extrai quantidade
  const quantityRegex = /(\d+)\s*(?:kg|g|l|ml)/i;
  const quantityMatch = normalized.match(quantityRegex);
  let quantity = quantityMatch ? quantityMatch[0].replace(/\s+/g, "") : "";

  // Extrai termos chave
  let terms = normalized
    .replace(/[^\w\s]/g, "") // Remove pontuação
    .split(" ")
    .filter(
      (term) =>
        // Filtra conectivos e artigos
        ![
          "de",
          "da",
          "do",
          "e",
          "com",
          "tipo",
          "a",
          "o",
          "as",
          "os",
          "para",
        ].includes(term)
    )
    .filter(Boolean); // Remove strings vazias

  // Remove termos relacionados à quantidade
  terms = terms
    .filter((term) => !term.match(/^\d+$/)) // Remove números 
    .filter((term) => {
      if (!quantityMatch) return true;
      const qTerms = quantityMatch[0].toLowerCase().split(/\s+/);
      return !qTerms.includes(term);
    });

  // Ordena os termos para garantir consistência na hash
  terms.sort();

  // Adiciona novamente a quantidade
  if (quantity) {
    terms.push(quantity);
  }

  // Junta os termos de volta com espaços
  return terms.join(" ");
}
function categorizeProducts(products: Product[]): GroupProduct[] {
  const categories = products.reduce((acc, product) => {
    const productHash = hashProductString(product.title);
    if (!acc[productHash]) {
      acc[productHash] = [];
    }
    acc[productHash].push({
      id: product.id,
      title: product.title,
      supermarket: product.supermarket,
    });
    return acc;
  }, {} as Record<string, Product[]>);

  return Object.entries(categories).map(([_, products]) => ({
    category: products[0].title,
    count: products.length,
    products: products.map(({ id, ...rest }) => rest),
  }));
}

async function main() {
  const products = JSON.parse(
    fs.readFileSync("data01.json", "utf-8")
  ) as Product[];
  const categorizedProducts = categorizeProducts(products);

  fs.writeFileSync(
    "result.json",
    JSON.stringify(categorizedProducts, null, 2),
    { flag: "w" }
  );
}
main();
