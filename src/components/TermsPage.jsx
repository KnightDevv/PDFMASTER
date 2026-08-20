import React from 'react';
import { Mail } from 'lucide-react';

export default function TermsPage({ lang = 'es', t }) {
  return (
    <div className="legal-page">
      <h1>Términos y Condiciones de Uso</h1>
      <p><strong>Última actualización:</strong> Agosto 2026</p>

      <h2>1. Aceptación de los Términos</h2>
      <p>
        Al acceder y utilizar PDF Master (en adelante, "el Servicio"), usted acepta cumplir con
        estos Términos y Condiciones de Uso. Si no está de acuerdo con alguno de estos términos,
        le rogamos que no utilice el Servicio.
      </p>

      <h2>2. Descripción del Servicio</h2>
      <p>
        PDF Master es una aplicación web gratuita que permite a los usuarios unir, dividir, organizar,
        firmar y convertir archivos PDF, documentos Word y hojas de cálculo Excel directamente en el navegador. Todo el
        procesamiento se realiza localmente en el dispositivo del usuario; ningún archivo es enviado
        a servidores externos.
      </p>

      <h2>3. Uso Aceptable</h2>
      <p>El usuario se compromete a:</p>
      <ul>
        <li>Utilizar el Servicio exclusivamente para fines legales y legítimos.</li>
        <li>No intentar descompilar, realizar ingeniería inversa ni modificar el código fuente del Servicio con fines maliciosos.</li>
        <li>No utilizar el Servicio para procesar contenido ilegal, difamatorio u ofensivo.</li>
        <li>No intentar sobrecargar, interferir ni dañar la infraestructura del Servicio.</li>
      </ul>

      <h2>4. Propiedad Intelectual</h2>
      <p>
        Todo el diseño, código fuente, logotipos e iconografía de PDF Master son propiedad de su creador (Mauro). Se prohíbe la reproducción total o parcial sin autorización expresa.
      </p>

      <h2>5. Limitación de Responsabilidad</h2>
      <p>
        El Servicio se proporciona "tal cual" sin garantías de ningún tipo. No nos hacemos
        responsables de pérdida de datos, interrupciones del servicio, ni de cualquier daño directo
        o indirecto derivado del uso del Servicio. El usuario es el único responsable de sus archivos
        y de mantener copias de seguridad adecuadas.
      </p>

      <h2>6. Disponibilidad del Servicio</h2>
      <p>
        Nos reservamos el derecho de modificar, suspender o descontinuar el Servicio en cualquier
        momento y sin previo aviso. No garantizamos la disponibilidad ininterrumpida del Servicio.
      </p>

      <h2>7. Modificación de los Términos</h2>
      <p>
        Nos reservamos el derecho de actualizar estos Términos y Condiciones en cualquier momento.
        Los cambios serán efectivos a partir de su publicación en esta página.
      </p>

      <h2>8. Contacto</h2>
      <p>
        Si tiene preguntas sobre estos términos o desea ponerse en contacto con nosotros, puede escribirnos directamente al correo electrónico oficial:
      </p>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '0.6rem 1.2rem', borderRadius: '8px', fontWeight: 700, color: 'var(--accent-rose)', marginTop: '0.5rem' }}>
        <Mail size={18} />
        <a href="mailto:knightbinner@gmail.com" style={{ color: 'inherit', textDecoration: 'none' }}>knightbinner@gmail.com</a>
      </div>
    </div>
  );
}
