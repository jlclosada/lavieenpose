import { motion } from 'framer-motion'

export default function AboutPage() {
  return (
    <section className="page-section about-section">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="page-title">Sobre LaVieEnPose</h1>

        <div className="about-content">
          <p>
            LaVieEnPose nace de la pasion por la moda contemporanea, el diseno y la
            expresion visual. Somos una plataforma editorial dedicada a explorar
            las tendencias, los creadores y las historias que definen el
            panorama de la moda actual.
          </p>
          <p>
            Nuestro objetivo es ofrecer un espacio curado donde confluyen el
            periodismo de moda, la fotografia artistica y la comunidad creativa.
            Cada articulo, cada imagen de nuestro lookbook, esta seleccionada
            para inspirar y reflejar una vision estetica autentica.
          </p>

          <div className="about-values">
            <div className="value-item">
              <h3>Curaduria</h3>
              <p>Seleccionamos contenido con criterio editorial riguroso.</p>
            </div>
            <div className="value-item">
              <h3>Estetica</h3>
              <p>Creemos en la belleza como forma de comunicacion.</p>
            </div>
            <div className="value-item">
              <h3>Comunidad</h3>
              <p>Un espacio abierto para amantes de la moda.</p>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  )
}
