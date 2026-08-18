export const metadata = {
  title: "Quiénes somos — Bio Origen",
  description:
    "Bio Origen nació en 2007. Fabricamos deshidratadores de alta prestación con electrónica y control propios, presentes en hogares, restaurantes y empresas de todo el país.",
};

export default function NosotrosPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-extrabold text-bio-dark">Quiénes somos</h1>
      <div className="mt-6 space-y-5 text-bio-dark/80 leading-relaxed">
        <p>
          Bio Origen nació en 2007, cuando un pedido familiar —un deshidratador para preparar
          alimentos sin harinas ni procesos industriales— se convirtió en el punto de partida de
          un proyecto. Aquella primera máquina abrió la puerta a un mundo de alimentación
          diferente y marcó el rumbo: fabricar equipos de deshidratado confiables, pensados para
          quienes eligen comer mejor.
        </p>
        <p>
          De aquellos desarrollos iniciales a hoy, el camino fue de mejora continua. La
          incorporación de mejores materiales, proveedores calificados y tecnología propia nos
          permitió pasar de equipos rudimentarios a una línea de deshidratadores de alta
          prestación, con electrónica y control diseñados íntegramente por nosotros.
        </p>
        <p>
          Hoy nuestros equipos trabajan en todo el país: en hogares, en restaurantes de cocina
          tradicional y vegetariana, y en empresas dedicadas a la producción de alimentos
          saludables. También exportamos a países de la región. Todos ellos deshidratan sin
          cocción, un proceso a baja temperatura que preserva las propiedades naturales del
          alimento: vitaminas, minerales, aminoácidos y enzimas.
        </p>
        <p>
          Nuestra premisa se mantiene desde el primer día: tecnología avanzada con operación
          simple, construida en materiales nobles como el acero inoxidable, para que cada equipo
          dure muchos años. Esa confianza en lo que fabricamos es la que nos permite ofrecer
          1 año de garantía en toda nuestra línea.
        </p>
        <p>
          Gracias a nuestros clientes y a quienes nos acompañaron en este recorrido, seguimos
          creciendo y mejorando cada día.
        </p>
      </div>
    </div>
  );
}
