// Fuente única de contenido de ejemplo. La importa prisma/seed.ts.
import type { Prisma } from "@prisma/client";

type SampleProduct = {
  name: string;
  slug: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  linea?: string;
  featured: boolean;
  images: string[];
  specs: Prisma.InputJsonValue;
  rating: number;
  reviewCount: number;
};

type SampleRecipe = {
  name: string;
  slug: string;
  emoji: string;
  description: string;
  category: string;
  difficulty: string;
  time: string;
  temperature: string;
  ingredients: string[];
  equipment: string[];
  steps: string[];
  variations: string[];
  uses: string[];
  image: string;
  images: string[];
  featured: boolean;
  season: string | null;
};

const FOOD_SPECS = (peso: string) => ({
  peso,
  conservación: "Lugar fresco y seco",
  "vida útil": "6 meses",
});

export const SAMPLE_PRODUCTS: SampleProduct[] = [
  {
    name: "Charqui Clásico 100g",
    slug: "charqui-clasico-100g",
    description:
      "Carne de res deshidratada al estilo norteño, salada en su punto justo. Alta en proteínas, sin conservantes.",
    price: 4200,
    stock: 40,
    category: "Charqui",
    featured: true,
    images: [],
    specs: FOOD_SPECS("100g"),
    rating: 4.8,
    reviewCount: 24,
  },
  {
    name: "Charqui Picante 100g",
    slug: "charqui-picante-100g",
    description:
      "Nuestro charqui con un toque de ají molido. Para los que buscan intensidad.",
    price: 4500,
    stock: 25,
    category: "Charqui",
    featured: true,
    images: [],
    specs: FOOD_SPECS("100g"),
    rating: 4.6,
    reviewCount: 18,
  },
  {
    name: "Mix de Frutas Deshidratadas 200g",
    slug: "mix-frutas-deshidratadas-200g",
    description:
      "Manzana, pera, ananá y banana deshidratadas. Dulzor natural, ideal para la mochila.",
    price: 3800,
    stock: 60,
    category: "Frutas",
    featured: true,
    images: [],
    specs: FOOD_SPECS("200g"),
    rating: 4.9,
    reviewCount: 31,
  },
  {
    name: "Manzana Deshidratada 150g",
    slug: "manzana-deshidratada-150g",
    description: "Rodajas finas de manzana, crujientes y sin azúcar agregada.",
    price: 2900,
    stock: 50,
    category: "Frutas",
    featured: false,
    images: [],
    specs: FOOD_SPECS("150g"),
    rating: 4.5,
    reviewCount: 12,
  },
  {
    name: "Tomate Deshidratado 100g",
    slug: "tomate-deshidratado-100g",
    description:
      "Tomate en aceite de oliva listo para tus pastas, ensaladas y picadas.",
    price: 3500,
    stock: 30,
    category: "Verduras",
    featured: false,
    images: [],
    specs: FOOD_SPECS("100g"),
    rating: 4.4,
    reviewCount: 9,
  },
  {
    name: "Snack Mix Energía 180g",
    slug: "snack-mix-energia-180g",
    description:
      "Frutas deshidratadas, semillas y trozos de charqui. El snack completo para entrenar.",
    price: 5100,
    stock: 35,
    category: "Snacks",
    featured: true,
    images: [],
    specs: FOOD_SPECS("180g"),
    rating: 4.7,
    reviewCount: 27,
  },
  {
    name: "Banana Chips 150g",
    slug: "banana-chips-150g",
    description: "Banana deshidratada crocante, energía pura para el día.",
    price: 2700,
    stock: 0,
    category: "Snacks",
    featured: false,
    images: [],
    specs: FOOD_SPECS("150g"),
    rating: 4.3,
    reviewCount: 14,
  },

  // --- Equipos deshidratadores: Línea Familiar ---
  {
    name: "Deshidratador Familiar BO-3",
    slug: "deshidratador-familiar-bo-3",
    description:
      "Deshidratador compacto de 3 bandejas, ideal para empezar en casa. Bajo consumo y fácil de usar.",
    price: 119000,
    stock: 15,
    category: "Deshidratadores",
    linea: "Familiar",
    featured: false,
    images: [],
    specs: {
      bandejas: "3",
      potencia: "350W",
      temperatura: "35°C a 68°C",
      garantía: "1 año",
    },
    rating: 4.6,
    reviewCount: 11,
  },
  {
    name: "Deshidratador Hogareño BO-6",
    slug: "deshidratador-hogareno-bo-6",
    description:
      "Deshidratador de 6 bandejas con control de temperatura. Hacé tus propios alimentos en casa.",
    price: 189000,
    stock: 8,
    category: "Deshidratadores",
    linea: "Familiar",
    featured: false,
    images: [],
    specs: {
      bandejas: "6",
      potencia: "500W",
      temperatura: "35°C a 70°C",
      garantía: "1 año",
    },
    rating: 5,
    reviewCount: 5,
  },
  {
    name: "Deshidratador Familiar BO-9",
    slug: "deshidratador-familiar-bo-9",
    description:
      "Deshidratador de 9 bandejas para familias grandes o producción casera intensiva.",
    price: 279000,
    stock: 10,
    category: "Deshidratadores",
    linea: "Familiar",
    featured: false,
    images: [],
    specs: {
      bandejas: "9",
      potencia: "650W",
      temperatura: "35°C a 70°C",
      garantía: "2 años",
    },
    rating: 4.8,
    reviewCount: 8,
  },

  // --- Equipos deshidratadores: Línea Comercial ---
  {
    name: "Deshidratador Comercial BO-16",
    slug: "deshidratador-comercial-bo-16",
    description:
      "Equipo de 16 bandejas en acero inoxidable para emprendimientos y pequeños comercios.",
    price: 690000,
    stock: 6,
    category: "Deshidratadores",
    linea: "Comercial",
    featured: false,
    images: [],
    specs: {
      bandejas: "16",
      potencia: "1200W",
      temperatura: "35°C a 75°C",
      garantía: "2 años",
      construcción: "Acero inoxidable",
    },
    rating: 4.9,
    reviewCount: 6,
  },
  {
    name: "Deshidratador Comercial BO-30",
    slug: "deshidratador-comercial-bo-30",
    description:
      "Equipo de 30 bandejas en acero inoxidable para producción comercial sostenida.",
    price: 1290000,
    stock: 3,
    category: "Deshidratadores",
    linea: "Comercial",
    featured: false,
    images: [],
    specs: {
      bandejas: "30",
      potencia: "2200W",
      temperatura: "35°C a 80°C",
      garantía: "2 años",
      construcción: "Acero inoxidable",
    },
    rating: 5,
    reviewCount: 4,
  },
  {
    name: "Deshidratador Comercial BO-48 Industrial",
    slug: "deshidratador-comercial-bo-48",
    description:
      "Equipo industrial de 48 bandejas en acero inoxidable para alta producción continua.",
    price: 2450000,
    stock: 2,
    category: "Deshidratadores",
    linea: "Comercial",
    featured: false,
    images: [],
    specs: {
      bandejas: "48",
      potencia: "3500W",
      temperatura: "35°C a 80°C",
      garantía: "3 años",
      construcción: "Acero inoxidable",
    },
    rating: 5,
    reviewCount: 2,
  },
];

export const SAMPLE_RECIPES: SampleRecipe[] = [
  // ─── BÁSICO ──────────────────────────────────────────────────────────────
  {
    name: "Chips de Manzana",
    slug: "chips-de-manzana",
    emoji: "🍎",
    description:
      "Rodajas crujientes de manzana deshidratada, perfectas como snack saludable o para decorar porridge y ensaladas.",
    category: "Básico",
    difficulty: "Fácil",
    time: "6-8 horas",
    temperature: "55°C",
    ingredients: [
      "4 manzanas medianas (variedad a elección)",
      "Jugo de 1 limón",
      "1 cucharadita de canela en polvo (opcional)",
    ],
    equipment: [
      "Deshidratador con bandejas",
      "Mandolina o cuchillo afilado",
      "Bol con agua y limón",
    ],
    steps: [
      "Lavar bien las manzanas y cortarlas en rodajas de 3-4 mm de espesor.",
      "Sumergir las rodajas en agua con jugo de limón por 5 minutos para evitar la oxidación.",
      "Escurrir y secar con papel absorbente.",
      "Espolvorear canela si se desea.",
      "Distribuir en bandejas del deshidratador sin superponer.",
      "Deshidratar a 55°C durante 6-8 horas hasta que estén crujientes.",
      "Dejar enfriar completamente antes de guardar en frasco hermético.",
    ],
    variations: [
      "Con ralladura de naranja y cardamomo",
      "Con una pizca de sal y pimienta de Cayena para versión salada",
    ],
    uses: ["Snack directo", "Decoración de tortas y porridge", "Granola casera"],
    image: "",
    images: [],
    featured: true,
    season: "Otoño",
  },
  {
    name: "Plátanos Deshidratados",
    slug: "platanos-deshidratados",
    emoji: "🍌",
    description:
      "Rodajas de banana deshidratada, naturalmente dulces y energéticas. Ideales para el desayuno o el bolso.",
    category: "Básico",
    difficulty: "Fácil",
    time: "8-10 horas",
    temperature: "57°C",
    ingredients: ["6 bananas maduras pero firmes", "Jugo de 1 limón"],
    equipment: ["Deshidratador", "Cuchillo y tabla"],
    steps: [
      "Pelar las bananas y cortarlas en rodajas de 5 mm.",
      "Rociar con jugo de limón para retardar la oxidación.",
      "Colocar en bandejas sin superponer.",
      "Deshidratar a 57°C por 8-10 horas, dando vuelta a mitad de proceso.",
      "Están listas cuando estén secas pero levemente flexibles.",
    ],
    variations: [
      "Bañadas en chocolate oscuro derretido",
      "Con miel y semillas de chía antes de deshidratar",
    ],
    uses: ["Snack energético", "Mix de frutos secos", "Cereales y muesli"],
    image: "",
    images: [],
    featured: false,
    season: null,
  },
  {
    name: "Fresas Deshidratadas",
    slug: "fresas-deshidratadas",
    emoji: "🍓",
    description:
      "Fresas liofilizadas de forma artesanal: concentran todo el sabor y se vuelven ligeramente crujientes.",
    category: "Básico",
    difficulty: "Fácil",
    time: "8-12 horas",
    temperature: "60°C",
    ingredients: ["500 g de fresas frescas maduras"],
    equipment: ["Deshidratador", "Cuchillo y tabla"],
    steps: [
      "Lavar y secar bien las fresas.",
      "Retirar los cabos y cortar en mitades o rodajas de 5 mm.",
      "Colocar con el lado cortado hacia arriba en las bandejas.",
      "Deshidratar a 60°C por 8-12 horas según el grosor.",
      "Dejar enfriar; deben quedar crocantes o levemente masticables según preferencia.",
    ],
    variations: [
      "Enteras (tiempo mayor: 14-16 horas)",
      "Con vainilla: remojar 30 min en jugo de naranja con extracto de vainilla antes de deshidratar",
    ],
    uses: ["Snack saludable", "Yogur y helados", "Decoración de postres"],
    image: "",
    images: [],
    featured: false,
    season: "Primavera",
  },
  {
    name: "Chips de Zanahoria",
    slug: "chips-de-zanahoria",
    emoji: "🥕",
    description:
      "Chips crocantes de zanahoria, ligeramente condimentadas. Un snack vegetal lleno de betacarotenos.",
    category: "Básico",
    difficulty: "Fácil",
    time: "6-8 horas",
    temperature: "57°C",
    ingredients: [
      "500 g de zanahorias peladas",
      "1 cucharada de aceite de oliva",
      "Sal marina y pimienta a gusto",
    ],
    equipment: ["Deshidratador", "Mandolina o cuchillo", "Bol para mezclar"],
    steps: [
      "Pelar las zanahorias y cortarlas en rodajas finas de 2-3 mm.",
      "Mezclar con aceite, sal y pimienta en un bol.",
      "Distribuir en bandejas del deshidratador.",
      "Deshidratar a 57°C durante 6-8 horas hasta que estén crujientes.",
    ],
    variations: [
      "Con comino y pimentón ahumado",
      "Con ajo en polvo y hierbas provenzales",
    ],
    uses: ["Snack salado", "Acompañamiento de sopas", "Dips y hummus"],
    image: "",
    images: [],
    featured: false,
    season: null,
  },
  {
    name: "Hierbas Aromáticas",
    slug: "hierbas-aromaticas",
    emoji: "🌿",
    description:
      "Orégano, tomillo, romero y albahaca deshidratados en casa para conservar todo su aroma y sabor.",
    category: "Básico",
    difficulty: "Fácil",
    time: "4-6 horas",
    temperature: "35°C",
    ingredients: [
      "Manojo de orégano fresco",
      "Manojo de tomillo fresco",
      "Ramitas de romero",
      "Hojas de albahaca",
    ],
    equipment: ["Deshidratador", "Mallas de secado finas"],
    steps: [
      "Lavar suavemente las hierbas y secar con papel absorbente.",
      "Separar las hojas de los tallos gruesos.",
      "Extender en bandejas con malla fina para que no caigan.",
      "Deshidratar a 35°C durante 4-6 horas hasta que se desmigajen fácilmente.",
      "Guardar en frascos oscuros bien tapados.",
    ],
    variations: [
      "Mix de hierbas italianas (orégano, albahaca, tomillo)",
      "Mezcla de hierbas para asado (romero, orégano, ajo)",
    ],
    uses: ["Condimento en pizzas y pastas", "Infusiones", "Aceites aromatizados"],
    image: "",
    images: [],
    featured: false,
    season: "Primavera",
  },

  // ─── INTERMEDIO ──────────────────────────────────────────────────────────
  {
    name: "Tomates Secos",
    slug: "tomates-secos",
    emoji: "🍅",
    description:
      "Tomates cherry o perita deshidratados con hierbas, concentrando un sabor intenso y dulce. Un clásico gourmet.",
    category: "Intermedio",
    difficulty: "Media",
    time: "10-14 horas",
    temperature: "60°C",
    ingredients: [
      "1 kg de tomates perita o cherry",
      "2 dientes de ajo en láminas",
      "Orégano seco a gusto",
      "Sal marina y pimienta",
      "Aceite de oliva (opcional, para conservar)",
    ],
    equipment: [
      "Deshidratador",
      "Cuchillo y tabla",
      "Frasco de vidrio para conservar",
    ],
    steps: [
      "Lavar los tomates y cortarlos al medio (o en cuartos si son grandes).",
      "Retirar el exceso de semillas con una cuchara.",
      "Condimentar con sal, pimienta, ajo y orégano.",
      "Colocar con el lado cortado hacia arriba en bandejas.",
      "Deshidratar a 60°C por 10-14 horas; deben quedar blandos pero sin humedad.",
      "Guardar en frasco con aceite de oliva o en bolsa sellada al vacío.",
    ],
    variations: [
      "Con albahaca fresca y pimienta negra molida gruesa",
      "Con chile seco para versión picante",
    ],
    uses: ["Pizzas y focaccias", "Pastas y risottos", "Antipasto"],
    image: "",
    images: [],
    featured: true,
    season: "Verano",
  },
  {
    name: "Chips Vegetales Mixtos",
    slug: "chips-vegetales-mixtos",
    emoji: "🥦",
    description:
      "Combinación colorida de remolacha, zucchini y papa andina deshidratadas con especias. Crujientes y saludables.",
    category: "Intermedio",
    difficulty: "Media",
    time: "7-10 horas",
    temperature: "57°C",
    ingredients: [
      "2 remolachas medianas",
      "2 zucchinis",
      "2 papas andinas medianas",
      "1 cucharada de aceite de oliva",
      "Sal, pimienta, pimentón a gusto",
    ],
    equipment: ["Deshidratador con varias bandejas", "Mandolina (recomendado)", "Bol para condimentar"],
    steps: [
      "Lavar y pelar los vegetales.",
      "Cortar en rodajas uniformes de 2-3 mm con mandolina.",
      "Mezclar cada vegetal por separado con aceite y condimentos.",
      "Distribuir en bandejas separadas (los tiempos varían por tipo).",
      "Deshidratar a 57°C: zucchini 6-7 hs, remolacha 8-9 hs, papa 9-10 hs.",
      "Retirar cada uno cuando estén crujientes.",
    ],
    variations: [
      "Agregar chips de batata y zanahoria para más variedad",
      "Versión picante con cayena y comino",
    ],
    uses: ["Snack colorido", "Guarnición de sopas", "Bowl toppings"],
    image: "",
    images: [],
    featured: false,
    season: null,
  },
  {
    name: "Leather de Frutas",
    slug: "leather-de-frutas",
    emoji: "🍑",
    description:
      "Puré de frutas extendido y deshidratado hasta obtener una lámina flexible y naturalmente dulce.",
    category: "Intermedio",
    difficulty: "Media",
    time: "8-10 horas",
    temperature: "57°C",
    ingredients: [
      "500 g de frutos de estación (durazno, mango, fresa o mezcla)",
      "1 cucharada de miel o azúcar (opcional)",
      "Jugo de ½ limón",
    ],
    equipment: [
      "Deshidratador con lámina de silicona",
      "Licuadora o procesadora",
      "Espátula",
    ],
    steps: [
      "Lavar, pelar y descarozar las frutas.",
      "Procesar hasta obtener un puré liso.",
      "Agregar miel y limón; mezclar bien.",
      "Extender sobre la lámina de silicona con un grosor de 5-6 mm.",
      "Deshidratar a 57°C por 8-10 horas hasta que no quede pegajoso al tacto.",
      "Dejar enfriar y cortar en tiras; enrollar con papel film.",
    ],
    variations: [
      "Durazno con canela",
      "Mango con coco rallado encima antes de deshidratar",
    ],
    uses: ["Snack para niños", "Merienda", "Decoración de tortas"],
    image: "",
    images: [],
    featured: false,
    season: "Verano",
  },
  {
    name: "Condimento Casero en Polvo",
    slug: "condimento-casero-en-polvo",
    emoji: "🧂",
    description:
      "Mezcla de vegetales y hierbas deshidratadas trituradas que da profundidad de sabor a cualquier plato.",
    category: "Intermedio",
    difficulty: "Media",
    time: "10-12 horas",
    temperature: "55°C",
    ingredients: [
      "2 cebollas medianas",
      "1 cabeza de ajo",
      "2 pimientos rojos",
      "2 zanahorias",
      "Hierbas frescas: perejil, apio, orégano",
    ],
    equipment: [
      "Deshidratador",
      "Procesadora o molinillo de café",
      "Tamiz",
      "Frascos de vidrio",
    ],
    steps: [
      "Cortar todos los vegetales en rodajas finas.",
      "Deshidratar a 55°C por 10-12 horas hasta que estén completamente secos.",
      "Dejar enfriar completamente.",
      "Procesar o moler hasta obtener polvo fino.",
      "Tamizar para homogeneizar el tamaño.",
      "Guardar en frascos herméticos lejos de la luz.",
    ],
    variations: [
      "Condimento picante: agregar chile y pimienta negra",
      "Condimento mediterráneo: agregar tomate seco molido",
    ],
    uses: [
      "Sopas y guisos",
      "Sazonar carnes",
      "Reemplaza el caldo en polvo industrial",
    ],
    image: "",
    images: [],
    featured: false,
    season: null,
  },

  // ─── AVANZADO ────────────────────────────────────────────────────────────
  {
    name: "Beef Jerky",
    slug: "beef-jerky",
    emoji: "🥩",
    description:
      "Carne de res marinada y deshidratada al estilo americano. Proteína concentrada con sabor intenso y ahumado.",
    category: "Avanzado",
    difficulty: "Difícil",
    time: "6-8 horas + 12 hs marinado",
    temperature: "70°C",
    ingredients: [
      "500 g de peceto o nalga sin grasa, en tiras de 5 mm",
      "60 ml de salsa de soja",
      "2 cucharadas de salsa Worcestershire",
      "1 cucharadita de ajo en polvo",
      "1 cucharadita de cebolla en polvo",
      "½ cucharadita de pimienta negra",
      "½ cucharadita de pimentón ahumado",
    ],
    equipment: [
      "Deshidratador con control de temperatura",
      "Cuchillo bien afilado o rebanadadora",
      "Recipiente para marinar",
      "Papel absorbente",
    ],
    steps: [
      "Retirar toda la grasa visible de la carne (la grasa se enrancia al deshidratar).",
      "Cortar tiras de 5 mm siguiendo la veta.",
      "Mezclar todos los ingredientes del marinado.",
      "Marinar la carne en refrigerador por 12-24 horas.",
      "Retirar del marinado y secar bien con papel absorbente.",
      "Distribuir en bandejas sin superponer.",
      "Deshidratar a 70°C por 6-8 horas, dando vuelta a las 3 horas.",
      "La carne está lista cuando se dobla sin quebrarse pero no tiene humedad.",
      "Guardar en bolsa sellada; consumir en 1 semana o refrigerar.",
    ],
    variations: [
      "Teriyaki: agregar jengibre rallado, sake y azúcar moreno al marinado",
      "Picante: duplicar el pimentón y agregar chile molido",
    ],
    uses: ["Snack proteico", "Camping y trekking", "Picadas gourmet"],
    image: "",
    images: [],
    featured: true,
    season: null,
  },
  {
    name: "Hongos Gourmet Deshidratados",
    slug: "hongos-gourmet-deshidratados",
    emoji: "🍄",
    description:
      "Portobellos, shiitake y gírgolas deshidratados para intensificar su sabor umami. Se rehidratan en minutos.",
    category: "Avanzado",
    difficulty: "Difícil",
    time: "8-12 horas",
    temperature: "45°C",
    ingredients: ["300 g de portobellos", "200 g de shiitake", "200 g de gírgolas"],
    equipment: [
      "Deshidratador",
      "Pincel o trapo húmedo para limpiar",
      "Mallas finas para piezas pequeñas",
    ],
    steps: [
      "Limpiar los hongos con pincel o paño húmedo (no sumergir en agua).",
      "Cortar los portobellos en láminas de 5 mm.",
      "Dejar los shiitake y gírgolas pequeños enteros; cortar los grandes.",
      "Distribuir en bandejas sin superposición.",
      "Deshidratar a 45°C por 8-12 horas hasta que estén completamente rígidos.",
      "Dejar enfriar y guardar en frasco hermético lejos de la humedad.",
    ],
    variations: [
      "Condimentados con sal, tomillo y ajo antes de deshidratar",
      "Moler para obtener polvo de hongos para salsas y risottos",
    ],
    uses: [
      "Rehidratar en agua caliente para salsas",
      "Polvo umami para sopas",
      "Rellenos de pasta fresca",
    ],
    image: "",
    images: [],
    featured: false,
    season: "Otoño",
  },
  {
    name: "Barritas Energéticas",
    slug: "barritas-energeticas",
    emoji: "🌾",
    description:
      "Barritas de avena, frutas deshidratadas y semillas comprimidas y secadas para una textura firme y duradera.",
    category: "Avanzado",
    difficulty: "Difícil",
    time: "8-10 horas",
    temperature: "57°C",
    ingredients: [
      "200 g de avena arrollada",
      "100 g de dátiles sin carozo",
      "50 g de almendras",
      "50 g de semillas de girasol",
      "30 g de chips de manzana deshidratada",
      "3 cucharadas de manteca de maní",
      "2 cucharadas de miel",
      "1 cucharadita de canela",
      "Pizca de sal",
    ],
    equipment: [
      "Procesadora",
      "Deshidratador",
      "Molde rectangular o papel film",
      "Lámina de silicona",
    ],
    steps: [
      "Procesar los dátiles hasta obtener una pasta.",
      "Mezclar pasta de dátiles con manteca de maní, miel, canela y sal.",
      "Incorporar avena, almendras picadas, semillas y frutas deshidratadas.",
      "Mezclar hasta que todo se integre.",
      "Extender sobre lámina de silicona con un grosor de 1.5-2 cm.",
      "Cortar en barritas antes de deshidratar.",
      "Deshidratar a 57°C por 8-10 horas hasta que estén firmes.",
      "Envolver individualmente en papel film.",
    ],
    variations: [
      "Con cacao en polvo y naranja confitada",
      "Con proteína en polvo para versión deportiva",
    ],
    uses: ["Snack pre-entrenamiento", "Desayuno portátil", "Trekking y viajes"],
    image: "",
    images: [],
    featured: true,
    season: null,
  },
];
