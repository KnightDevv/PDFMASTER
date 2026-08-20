import React from 'react';
import { Mail } from 'lucide-react';

export default function PrivacyPage({ lang = 'es', t }) {
  return (
    <div className="legal-page">
      <h1>Política de Privacidad</h1>
      <p><strong>Última actualización:</strong> Agosto 2026</p>

      <h2>1. Información General</h2>
      <p>
        En PDF Master nos tomamos su privacidad muy en serio. Esta Política de Privacidad explica
        cómo manejamos la información cuando usted utiliza nuestro servicio de procesamiento de
        documentos PDF, Word y Excel en línea.
      </p>

      <h2>2. Datos que No Recopilamos</h2>
      <p>
        PDF Master funciona completamente en el lado del cliente (su navegador web). Esto significa que:
      </p>
      <ul>
        <li><strong>No almacenamos sus archivos.</strong> Los documentos PDF, hojas de Excel, archivos Word e imágenes
        que usted procesa nunca son enviados a ningún servidor. Todo el procesamiento ocurre
        localmente en su dispositivo.</li>
        <li><strong>No recopilamos datos personales.</strong> No solicitamos nombre, correo electrónico,
        dirección ni ningún otro dato personal identificable para usar las herramientas.</li>
        <li><strong>No utilizamos cookies de rastreo.</strong> No empleamos cookies con fines de
        seguimiento publicitario ni perfilado de usuarios.</li>
        <li><strong>No compartimos información con terceros.</strong> Al no recopilar datos, no hay
        información que compartir.</li>
      </ul>

      <h2>3. Procesamiento Local Seguro</h2>
      <p>
        Todas las operaciones de PDF Master (unir PDF, convertir Excel a PDF, Word a PDF, dividir, organizar, firmar e imágenes a PDF) se ejecutan íntegramente mediante tecnologías avanzadas y seguras en el navegador del usuario. Sus archivos permanecen en la memoria de su dispositivo durante el procesamiento y se descargan directamente a su disco local.
      </p>

      <h2>4. Datos Técnicos</h2>
      <p>
        Nuestro proveedor de alojamiento web puede recopilar datos técnicos estándar del servidor
        como direcciones IP, tipo de navegador y páginas visitadas. Esta información se utiliza
        exclusivamente para mantener la disponibilidad y seguridad del servicio.
      </p>

      <h2>5. Seguridad</h2>
      <p>
        Al procesar todos los archivos localmente en su navegador, PDF Master elimina por diseño
        los riesgos asociados con la transmisión de documentos sensibles a servidores externos.
        Su información nunca viaja por Internet durante el procesamiento.
      </p>

      <h2>6. Contacto</h2>
      <p>
        Si tiene cualquier duda o consulta sobre nuestra política de privacidad, puede comunicarse directamente con nuestro equipo al correo electrónico:
      </p>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '0.6rem 1.2rem', borderRadius: '8px', fontWeight: 700, color: 'var(--accent-rose)', marginTop: '0.5rem' }}>
        <Mail size={18} />
        <a href="mailto:knightbinner@gmail.com" style={{ color: 'inherit', textDecoration: 'none' }}>knightbinner@gmail.com</a>
      </div>
    </div>
  );
}
