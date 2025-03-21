import * as fs from "fs";

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

  // Extai informação de quantidade
  const quantityRegex =
    /(\d+[\.,]?\d*)\s*(kg|g|kilo|quilo|quilos|kilos|l|lt|litro|litros|ml|mililitro|mililitros)/i;
  const quantityMatch = normalized.match(quantityRegex);

  let standardizedQuantity = "";
  let originalQuantityText = "";

  if (quantityMatch) {
    originalQuantityText = quantityMatch[0];
    const value = parseFloat(quantityMatch[1].replace(",", "."));
    const unit = quantityMatch[2].toLowerCase();

    // Padroniza para unidades base kg e l com separação decimal por vírgula
    if (["g", "grama", "gramas"].includes(unit)) {
      // Converte g para kg
      const kgValue = value / 1000;
      standardizedQuantity = `${kgValue
        .toFixed(1)
        .replace(".", ",")
        .replace(",0", "")} kg`;
    } else if (["kg", "kilo", "kilos", "quilo", "quilos"].includes(unit)) {
      // Adiciona vírgula para separação decimal
      standardizedQuantity = `${value
        .toFixed(1)
        .replace(".", ",")
        .replace(",0", "")} kg`;
    } else if (["ml", "mililitro", "mililitros"].includes(unit)) {
      // Converte ml para l
      const lValue = value / 1000;
      standardizedQuantity = `${lValue
        .toFixed(1)
        .replace(".", ",")
        .replace(",0", "")} l`;
    } else if (["l", "lt", "litro", "litros"].includes(unit)) {
      // Adiciona vírgula para separação decimal
      standardizedQuantity = `${value
        .toFixed(1)
        .replace(".", ",")
        .replace(",0", "")} l`;
    } else {
      standardizedQuantity = quantityMatch[0];
    }
  }

  // Extrai termos chave do produto
  let terms = normalized
    .replace(/[^\w\s]/g, "") // Remove pontuação
    .split(" ")
    .filter(
      (term) =>
        // Filtra artigos
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
    .filter(Boolean); // Remove strings cazias

  // Remove a quantidade para adicionar no final padronizadas
  terms = terms.filter((term) => {
    // Filtra o termo de quantidade
    if (
      originalQuantityText &&
      originalQuantityText.toLowerCase().includes(term)
    ) {
      return false;
    }
    // Filtra números soltos
    if (term.match(/^\d+$/)) {
      return false;
    }
    return true;
  });
  // Ordena os termos para garantir consistência na hash
  terms.sort();

  // Adiciona a quantidade padronizada no final
  if (standardizedQuantity) {
    terms.push(standardizedQuantity.replace(/\s+/g, ""));
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
