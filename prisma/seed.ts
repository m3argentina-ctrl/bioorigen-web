import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { SAMPLE_PRODUCTS, SAMPLE_RECIPES } from "../src/lib/sample-data";

const prisma = new PrismaClient();

async function main() {
  // Productos
  for (const product of SAMPLE_PRODUCTS) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: product,
      create: product,
    });
  }

  // Recetas
  for (const recipe of SAMPLE_RECIPES) {
    await prisma.recipe.upsert({
      where: { slug: recipe.slug },
      update: recipe,
      create: recipe,
    });
  }

  // Orden de ejemplo
  const charqui = await prisma.product.findUnique({ where: { slug: "charqui-clasico-100g" } });
  const mix = await prisma.product.findUnique({ where: { slug: "mix-frutas-deshidratadas-200g" } });
  if (charqui && mix) {
    const items = [
      { productId: charqui.id, name: charqui.name, price: charqui.price, quantity: 2 },
      { productId: mix.id, name: mix.name, price: mix.price, quantity: 1 },
    ];
    const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    await prisma.order.upsert({
      where: { id: "seed-order-demo" },
      update: {},
      create: {
        id: "seed-order-demo",
        customerEmail: "cliente@ejemplo.com",
        customerName: "Juan Pérez",
        customerPhone: "+54 9 11 1234-5678",
        customerAddress: "Av. Cazón 123, Tigre, Buenos Aires",
        items,
        subtotal,
        shipping: 0,
        total: subtotal,
        status: "paid",
        paymentStatus: "approved",
      },
    });
  }

  // Admin inicial
  const adminPassword = await bcrypt.hash("Admin123!", 12);
  await prisma.admin.upsert({
    where: { email: "admin@bioorigen.com.ar" },
    update: {},
    create: {
      email: "admin@bioorigen.com.ar",
      password: adminPassword,
      name: "Administrador",
      role: "admin",
    },
  });

  // Banners de ejemplo
  const banners = [
    {
      id: "banner-1",
      title: "Deshidratadores Bio Origen",
      subtitle: "Fabricamos equipos de alta calidad",
      description: "Línea Familiar y Comercial. Garantía de 2 años.",
      image: "",
      buttonText: "Ver equipos",
      buttonLink: "/productos?categoria=Deshidratadores",
      bgColor: "#4A7C59",
      order: 0,
      active: true,
    },
    {
      id: "banner-2",
      title: "Alimentos Deshidratados",
      subtitle: "Sin conservantes, sin azúcar agregada",
      description: "Charqui, frutas y snacks 100% naturales.",
      image: "",
      buttonText: "Ver tienda",
      buttonLink: "/productos",
      bgColor: "#2C3E50",
      order: 1,
      active: true,
    },
    {
      id: "banner-3",
      title: "Envío gratis",
      subtitle: "En compras superiores a $80.000",
      description: "Todo el país. Envíos a domicilio.",
      image: "",
      buttonText: "Comprar ahora",
      buttonLink: "/productos",
      bgColor: "#E67E22",
      order: 2,
      active: true,
    },
  ];

  for (const banner of banners) {
    await prisma.banner.upsert({
      where: { id: banner.id },
      update: banner,
      create: banner,
    });
  }

  // Config inicial del sitio
  const configItems = [
    { key: "contact_email", value: "consultas@bioorigen.com.ar", description: "Email de contacto" },
    { key: "contact_phone", value: "+54 911 6981-9981", description: "Teléfono" },
    { key: "whatsapp", value: "+54 911 6981-9981", description: "WhatsApp" },
    { key: "instagram", value: "", description: "URL Instagram" },
    { key: "facebook", value: "", description: "URL Facebook" },
    { key: "shipping_cost", value: "2000", description: "Costo de envío (ARS)" },
    { key: "free_shipping_from", value: "80000", description: "Envío gratis desde (ARS)" },
    { key: "maintenance_mode", value: "false", description: "Modo mantenimiento" },
  ];

  for (const item of configItems) {
    await prisma.siteConfig.upsert({
      where: { key: item.key },
      update: {},
      create: item,
    });
  }

  // PaymentConfig inicial
  const existingPaymentCfg = await prisma.paymentConfig.findFirst();
  if (!existingPaymentCfg) {
    await prisma.paymentConfig.create({
      data: { openpayEnabled: true, bankTransferEnabled: true },
    });
  }

  console.log(
    `Seed completo: ${SAMPLE_PRODUCTS.length} productos, ${SAMPLE_RECIPES.length} recetas, 1 orden, 1 admin, ${banners.length} banners, ${configItems.length} configs.`,
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
