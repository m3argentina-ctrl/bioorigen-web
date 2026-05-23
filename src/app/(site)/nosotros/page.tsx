export const metadata = {
  title: "Nosotros — Bio Origen",
};

export default function NosotrosPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-extrabold text-bio-dark">Nuestra historia</h1>
      <div className="mt-6 space-y-4 text-bio-dark/80">
        <p>
          Bio Origen nació en Tigre, Buenos Aires, con una idea simple:
          conservar los alimentos como se hacía antes, deshidratándolos
          lentamente y sin agregar nada que no sea necesario.
        </p>
        <p>
          Trabajamos con productores argentinos para seleccionar frutas,
          verduras y carnes de calidad, que luego deshidratamos en nuestros
          propios equipos a baja temperatura. Así logramos snacks nutritivos,
          livianos y con una vida útil prolongada.
        </p>
        <p>
          Además de nuestra línea de alimentos, fabricamos deshidratadores para
          quienes quieran producir en casa. Creemos en una alimentación más
          consciente, y en que cada hogar pueda ser parte de ella.
        </p>
      </div>
    </div>
  );
}
