/**
 * Alta del producto "Control ESP32-S3 - Kit de Actualización".
 * Categoría: Deshidratadores / Línea Comercial.
 *
 * Idempotente: correrlo de nuevo actualiza el producto existente por slug
 * SIN pisar las imágenes que Emilio cargue desde el admin.
 *
 *   npx tsx scripts/add-control-esp32.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SLUG = "control-esp32-s3-kit-actualizacion";

const description = `Kit de actualización del tablero de control para deshidratadores Bio Origen ya instalados. La cámara, las turbinas y las resistencias de su equipo siguen siendo buenas: lo que envejeció es el control. Cambiando solo el tablero, su máquina pasa a tener secado por humedad, recetas por etapas y monitoreo remoto.

QUÉ APORTA
· Secado por humedad real: mide la humedad dentro de la cámara y termina el proceso cuando el producto llegó al punto definido, no cuando se cumplió un tiempo estimado.
· Temperatura pareja: dos sondas digitales estancas (arriba y abajo) controlan sobre el promedio real de la cámara, eliminando el desnivel entre la bandeja superior y la inferior.
· Extracción automática: el extractor arranca solo cuando la humedad lo justifica.
· Recetas de hasta 3 etapas con temperatura y tiempo propios, guardadas en el equipo.
· Registro de consumo en kWh por lote, para conocer el costo energético real de cada producto.
· Enfriado automático al finalizar el proceso.

PROTECCIONES
Corte por sobretemperatura, detección de falla de sonda, detección de calentamiento descontrolado, termostato mecánico independiente de 95 °C en serie con las resistencias, y recuperación automática ante corte de energía (retoma el proceso donde quedó).

CONECTIVIDAD
Pantalla táctil color de 3,5" en castellano. Conectado al WiFi permite seguir el proceso desde el celular (temperatura, humedad, tiempo restante y etapa en curso) y recibir las mejoras futuras del firmware por actualización remota, sin visita técnica.

Consultános indicando el modelo y el año de tu deshidratador y te confirmamos la compatibilidad y el alcance del trabajo. Instalación a cargo de nuestro servicio técnico. Precio a convenir según equipo.`;

const specs = {
  "Interfaz": 'Pantalla táctil color 3,5" en castellano',
  "Temperatura": "2 sondas digitales estancas - control por promedio de cámara",
  "Rango de trabajo": "20 °C a 80 °C",
  "Humedad": "Sensor de cámara - corte automático por humedad objetivo",
  "Modos": "Manual y por recetas (hasta 3 etapas)",
  "Salidas": "Resistencias, turbinas y extractor",
  "Registro": "Consumo en kWh, temperatura mínima y máxima por lote",
  "Conectividad": "WiFi - monitoreo remoto y actualización de firmware a distancia",
  "Protecciones": "Sobretemperatura, falla de sonda, runaway, termostato mecánico 95 °C, recuperación ante corte de energía",
  "Alimentación": "220 V",
};

async function main() {
  const existing = await prisma.product.findUnique({ where: { slug: SLUG } });

  const data = {
    name: "Control ESP32-S3 - Kit de Actualización",
    slug: SLUG,
    description,
    // Precio a convenir: misma convención que "Cámaras de Deshidratación a Medida".
    // ⚠️ Emilio: reemplazar por el precio real desde el admin.
    price: 1,
    salePrice: null,
    stock: 0, // 0 + active:true => la ficha muestra "Se fabrica a pedido"
    category: "Deshidratadores",
    linea: "Comercial",
    featured: false,
    specs,
    active: true,
  };

  if (existing) {
    // No tocar images/videoUrl/dataSheet: pueden haberse cargado desde el admin.
    const p = await prisma.product.update({ where: { slug: SLUG }, data });
    console.log(`ACTUALIZADO: ${p.name} (${p.id})`);
    console.log(`Imágenes actuales: ${p.images.length}`);
  } else {
    const p = await prisma.product.create({ data: { ...data, images: [] } });
    console.log(`CREADO: ${p.name} (${p.id})`);
  }

  console.log(`\nFicha pública: /productos/${SLUG}`);
  console.log("Admin (para cargar imágenes): /admin/productos");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
