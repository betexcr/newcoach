import { chromium } from "playwright";
import path from "path";

const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

  :root {
    --primary: #1a1a2e;
    --accent: #6c63ff;
    --accent-light: #8b83ff;
    --accent-bg: #f0eeff;
    --text: #2d2d3a;
    --text-light: #6b7280;
    --border: #e5e7eb;
    --surface: #f9fafb;
    --white: #ffffff;
    --success: #10b981;
    --gold: #f59e0b;
  }

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    color: var(--text);
    line-height: 1.6;
    font-size: 10.5pt;
    background: var(--white);
  }

  .page { padding: 48px 56px; }
  .page-break { page-break-before: always; }

  /* COVER */
  .cover {
    height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    background: linear-gradient(160deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%);
    color: white;
    padding: 64px;
    position: relative;
    overflow: hidden;
  }
  .cover::before {
    content: '';
    position: absolute;
    top: -120px;
    right: -120px;
    width: 400px;
    height: 400px;
    background: radial-gradient(circle, rgba(108,99,255,0.25) 0%, transparent 70%);
    border-radius: 50%;
  }
  .cover::after {
    content: '';
    position: absolute;
    bottom: -80px;
    left: -80px;
    width: 300px;
    height: 300px;
    background: radial-gradient(circle, rgba(108,99,255,0.15) 0%, transparent 70%);
    border-radius: 50%;
  }
  .cover-logo {
    font-size: 14pt;
    font-weight: 800;
    letter-spacing: 6px;
    text-transform: uppercase;
    color: var(--accent-light);
    margin-bottom: 24px;
    position: relative;
    z-index: 1;
  }
  .cover-title {
    font-size: 36pt;
    font-weight: 900;
    line-height: 1.15;
    margin-bottom: 16px;
    position: relative;
    z-index: 1;
  }
  .cover-subtitle {
    font-size: 14pt;
    font-weight: 300;
    color: rgba(255,255,255,0.75);
    max-width: 480px;
    line-height: 1.6;
    position: relative;
    z-index: 1;
  }
  .cover-bar {
    width: 64px;
    height: 4px;
    background: var(--accent);
    border-radius: 2px;
    margin: 32px 0;
    position: relative;
    z-index: 1;
  }
  .cover-footer {
    position: absolute;
    bottom: 48px;
    font-size: 9pt;
    color: rgba(255,255,255,0.4);
    letter-spacing: 1px;
    z-index: 1;
  }

  /* SECTION HEADERS */
  h2 {
    font-size: 18pt;
    font-weight: 800;
    color: var(--primary);
    margin-bottom: 6px;
    letter-spacing: -0.3px;
  }
  h2 .accent { color: var(--accent); }
  .section-line {
    width: 40px;
    height: 3px;
    background: var(--accent);
    border-radius: 2px;
    margin-bottom: 20px;
  }
  h3 {
    font-size: 12pt;
    font-weight: 700;
    color: var(--primary);
    margin-top: 20px;
    margin-bottom: 10px;
  }

  /* TWO-COLUMN */
  .two-col {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    margin-bottom: 12px;
  }

  /* FEATURE CARD */
  .feature-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 20px 22px;
  }
  .feature-card h4 {
    font-size: 11pt;
    font-weight: 700;
    color: var(--accent);
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .feature-card ul {
    list-style: none;
    padding: 0;
  }
  .feature-card ul li {
    position: relative;
    padding-left: 18px;
    margin-bottom: 5px;
    font-size: 10pt;
    color: var(--text);
    line-height: 1.5;
  }
  .feature-card ul li::before {
    content: '→';
    position: absolute;
    left: 0;
    color: var(--accent);
    font-weight: 600;
  }

  /* HIGHLIGHT BOX */
  .highlight-box {
    background: linear-gradient(135deg, var(--accent-bg) 0%, #e8e5ff 100%);
    border-left: 4px solid var(--accent);
    border-radius: 0 10px 10px 0;
    padding: 16px 20px;
    margin: 16px 0;
  }
  .highlight-box p {
    font-size: 10.5pt;
    color: var(--primary);
    line-height: 1.6;
  }
  .highlight-box strong { color: var(--accent); }

  /* TABLE */
  table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    margin: 12px 0 16px;
    font-size: 9.5pt;
    border-radius: 10px;
    overflow: hidden;
    border: 1px solid var(--border);
  }
  thead th {
    background: var(--primary);
    color: white;
    font-weight: 600;
    text-align: left;
    padding: 11px 14px;
    font-size: 9pt;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  tbody td {
    padding: 10px 14px;
    border-bottom: 1px solid var(--border);
    color: var(--text);
    vertical-align: top;
    line-height: 1.5;
  }
  tbody tr:last-child td { border-bottom: none; }
  tbody tr:nth-child(even) td { background: var(--surface); }

  /* PRICING CARDS */
  .pricing-grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 16px;
    margin: 16px 0;
  }
  .pricing-card {
    border: 2px solid var(--border);
    border-radius: 14px;
    padding: 22px 18px;
    text-align: center;
    position: relative;
    background: var(--white);
  }
  .pricing-card.featured {
    border-color: var(--accent);
    box-shadow: 0 4px 24px rgba(108,99,255,0.15);
  }
  .pricing-card.featured::before {
    content: 'MÁS POPULAR';
    position: absolute;
    top: -11px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--accent);
    color: white;
    font-size: 7pt;
    font-weight: 700;
    letter-spacing: 1px;
    padding: 3px 12px;
    border-radius: 20px;
  }
  .pricing-card .plan-name {
    font-size: 10pt;
    font-weight: 700;
    color: var(--text-light);
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 6px;
  }
  .pricing-card .plan-price {
    font-size: 22pt;
    font-weight: 900;
    color: var(--primary);
    margin-bottom: 2px;
  }
  .pricing-card .plan-price span {
    font-size: 10pt;
    font-weight: 400;
    color: var(--text-light);
  }
  .pricing-card .plan-annual {
    font-size: 8.5pt;
    color: var(--success);
    font-weight: 600;
    margin-bottom: 12px;
  }
  .pricing-card .plan-features {
    list-style: none;
    padding: 0;
    text-align: left;
    font-size: 9pt;
    color: var(--text);
  }
  .pricing-card .plan-features li {
    padding: 4px 0;
    padding-left: 16px;
    position: relative;
    line-height: 1.4;
  }
  .pricing-card .plan-features li::before {
    content: '✓';
    position: absolute;
    left: 0;
    color: var(--success);
    font-weight: 700;
  }

  /* ADVANTAGES */
  .adv-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin: 12px 0;
  }
  .adv-box {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 16px 18px;
  }
  .adv-box h4 {
    font-size: 10pt;
    font-weight: 700;
    color: var(--primary);
    margin-bottom: 8px;
  }
  .adv-box ul {
    list-style: none;
    padding: 0;
  }
  .adv-box ul li {
    font-size: 9.5pt;
    color: var(--text);
    padding: 3px 0 3px 16px;
    position: relative;
    line-height: 1.45;
  }
  .adv-box ul li::before {
    content: '•';
    position: absolute;
    left: 0;
    color: var(--accent);
    font-weight: 900;
    font-size: 12pt;
    line-height: 1.1;
  }

  /* BUYER PROFILE */
  .buyer-card {
    display: flex;
    gap: 14px;
    align-items: flex-start;
    margin-bottom: 12px;
  }
  .buyer-icon {
    flex-shrink: 0;
    width: 36px;
    height: 36px;
    background: var(--accent-bg);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16pt;
  }
  .buyer-card strong {
    font-size: 10.5pt;
    color: var(--primary);
  }
  .buyer-card p {
    font-size: 9.5pt;
    color: var(--text-light);
    margin-top: 2px;
    line-height: 1.5;
  }

  /* COMPETITIVE */
  .comp-item {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 10px;
  }
  .comp-bullet {
    flex-shrink: 0;
    width: 24px;
    height: 24px;
    background: var(--accent);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 12pt;
    font-weight: 700;
    margin-top: 2px;
  }
  .comp-item p {
    font-size: 10pt;
    color: var(--text);
    line-height: 1.55;
  }
  .comp-item strong { color: var(--primary); }

  /* CHECKLIST */
  .checklist {
    columns: 2;
    column-gap: 24px;
    list-style: none;
    padding: 0;
    margin: 12px 0;
  }
  .checklist li {
    break-inside: avoid;
    padding: 6px 0 6px 22px;
    position: relative;
    font-size: 10pt;
    color: var(--text);
    line-height: 1.5;
  }
  .checklist li::before {
    content: '✓';
    position: absolute;
    left: 0;
    color: var(--success);
    font-weight: 700;
    font-size: 11pt;
  }

  /* OPTIONAL ADD-ONS */
  .addon-list {
    list-style: none;
    padding: 0;
    margin: 12px 0;
  }
  .addon-list li {
    padding: 10px 16px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    margin-bottom: 8px;
    font-size: 10pt;
    color: var(--text);
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .addon-list li .icon {
    color: var(--accent);
    font-size: 13pt;
  }

  /* FOOTER */
  .page-footer {
    margin-top: 40px;
    padding-top: 16px;
    border-top: 1px solid var(--border);
    text-align: center;
  }
  .page-footer p {
    font-size: 8.5pt;
    color: var(--text-light);
    line-height: 1.6;
  }

  /* CONTACT CTA */
  .cta-box {
    background: linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%);
    border-radius: 16px;
    padding: 32px;
    text-align: center;
    color: white;
    margin-top: 24px;
  }
  .cta-box h3 {
    color: white;
    font-size: 16pt;
    margin-bottom: 8px;
    margin-top: 0;
  }
  .cta-box p {
    color: rgba(255,255,255,0.7);
    font-size: 10.5pt;
  }

  p { margin-bottom: 8px; }
</style>
</head>
<body>

<!-- ===================== COVER ===================== -->
<div class="cover">
  <div class="cover-logo">NEWCOACH</div>
  <h1 class="cover-title">Prospecto<br>de Venta</h1>
  <div class="cover-bar"></div>
  <p class="cover-subtitle">
    Plataforma de coaching fitness multiplataforma.<br>
    Tu gimnasio. Tu marca. Tu app.
  </p>
  <p class="cover-footer">DOCUMENTO CONFIDENCIAL &nbsp;·&nbsp; 2026</p>
</div>

<!-- ===================== PAGE 2: PRODUCTO ===================== -->
<div class="page page-break">

  <h2>Descripción del <span class="accent">Producto</span></h2>
  <div class="section-line"></div>

  <p style="font-size:11pt; color:var(--text); line-height:1.7; margin-bottom:20px;">
    <strong>NewCoach</strong> es una aplicación multiplataforma de coaching fitness diseñada para entrenadores personales y sus clientes. Ofrece un flujo de trabajo digital completo — desde la programación de entrenamientos y seguimiento de progreso hasta mensajería, nutrición, hábitos, métricas corporales e insignias de logros.
  </p>

  <div class="two-col">
    <div class="feature-card">
      <h4>🏋️ Para Coaches</h4>
      <ul>
        <li>Dashboard con gestión de clientes e ingresos</li>
        <li>Biblioteca de ejercicios con videos demostrativos</li>
        <li>Constructor de entrenamientos, plantillas y programas</li>
        <li>Asignar entrenamientos y programas a clientes</li>
        <li>Mensajería directa y masiva</li>
        <li>Seguimiento de progreso y cumplimiento</li>
        <li>Asignación de hábitos a clientes</li>
        <li>Facturación y gestión de pagos</li>
      </ul>
    </div>
    <div class="feature-card">
      <h4>📱 Para Clientes</h4>
      <ul>
        <li>Vista diaria y calendario de entrenamientos</li>
        <li>Ejecución y registro de entrenamientos</li>
        <li>Seguimiento de progreso y récords personales</li>
        <li>Fotos de progreso (frente, lado, espalda)</li>
        <li>Métricas corporales: peso, grasa, medidas</li>
        <li>Seguimiento de nutrición y macros</li>
        <li>Hábitos e insignias de logros</li>
        <li>Mensajería directa con el coach</li>
      </ul>
    </div>
  </div>

  <h3>Destacados Adicionales</h3>
  <div class="two-col" style="grid-template-columns: 1fr 1fr 1fr 1fr; gap: 12px;">
    <div style="background:var(--accent-bg); border-radius:10px; padding:14px; text-align:center;">
      <div style="font-size:18pt; margin-bottom:4px;">🌎</div>
      <div style="font-size:9pt; font-weight:600; color:var(--primary);">Bilingüe</div>
      <div style="font-size:8pt; color:var(--text-light);">Inglés + Español</div>
    </div>
    <div style="background:var(--accent-bg); border-radius:10px; padding:14px; text-align:center;">
      <div style="font-size:18pt; margin-bottom:4px;">🎮</div>
      <div style="font-size:9pt; font-weight:600; color:var(--primary);">Modo Demo</div>
      <div style="font-size:8pt; color:var(--text-light);">Para ventas en vivo</div>
    </div>
    <div style="background:var(--accent-bg); border-radius:10px; padding:14px; text-align:center;">
      <div style="font-size:18pt; margin-bottom:4px;">⚙️</div>
      <div style="font-size:9pt; font-weight:600; color:var(--primary);">CI/CD</div>
      <div style="font-size:8pt; color:var(--text-light);">Deploy automatizado</div>
    </div>
    <div style="background:var(--accent-bg); border-radius:10px; padding:14px; text-align:center;">
      <div style="font-size:18pt; margin-bottom:4px;">🧪</div>
      <div style="font-size:9pt; font-weight:600; color:var(--primary);">E2E Tests</div>
      <div style="font-size:8pt; color:var(--text-light);">Playwright incluido</div>
    </div>
  </div>

  <h3>Stack Tecnológico</h3>
  <table>
    <thead>
      <tr><th>Capa</th><th>Tecnología</th></tr>
    </thead>
    <tbody>
      <tr><td>Framework de App</td><td>Expo 55, React Native 0.83, React 19, TypeScript</td></tr>
      <tr><td>Enrutamiento</td><td>Expo Router (basado en archivos)</td></tr>
      <tr><td>UI</td><td>React Native Paper (Material Design 3)</td></tr>
      <tr><td>Backend</td><td>Supabase (PostgreSQL, Auth, Realtime, Storage)</td></tr>
      <tr><td>Estado</td><td>TanStack React Query, Zustand</td></tr>
      <tr><td>Internacionalización</td><td>i18next (Inglés + Español)</td></tr>
      <tr><td>Notificaciones</td><td>Expo Notifications</td></tr>
      <tr><td>Testing</td><td>Playwright (E2E)</td></tr>
      <tr><td>Hosting</td><td>Vercel (web), EAS (builds nativos)</td></tr>
      <tr><td>CI/CD</td><td>GitHub Actions</td></tr>
    </tbody>
  </table>

  <div class="highlight-box">
    <p>Construir este producto desde cero costaría aproximadamente <strong>$20,000–$30,000 USD</strong>, lo que representa <strong>4–6 meses</strong> de trabajo de desarrollo — incluyendo arquitectura, UI/UX, base de datos, autenticación, localización, videos, facturación, fotos de progreso, métricas corporales, CI/CD y testing.</p>
  </div>

</div>

<!-- ===================== PAGE 3: PRECIOS ===================== -->
<div class="page page-break">

  <h2>Guía de <span class="accent">Precios</span></h2>
  <div class="section-line"></div>

  <h3>Opción A — Venta Única (Código Fuente)</h3>
  <table>
    <thead>
      <tr><th>Escenario</th><th>Rango de Precio (USD)</th></tr>
    </thead>
    <tbody>
      <tr><td>Venta a comprador estratégico (agencia, startup)</td><td><strong>$8,000–$12,000</strong></td></tr>
      <tr><td>Con personalización, branding y despliegue incluido</td><td><strong>$12,000–$18,000</strong></td></tr>
      <tr><td>Con usuarios activos o ingresos</td><td><strong>3–5× ingresos anuales</strong> (estándar SaaS)</td></tr>
    </tbody>
  </table>

  <h3>Opción B — Suscripción Mensual para Gimnasios (SaaS)</h3>

  <div class="pricing-grid">
    <div class="pricing-card">
      <div class="plan-name">Starter</div>
      <div class="plan-price">$200<span>/mes</span></div>
      <div class="plan-annual">$2,000/año — ahorra $400</div>
      <ul class="plan-features">
        <li>Hasta 2 coaches</li>
        <li>Hasta 30 clientes</li>
        <li>Branding del gimnasio</li>
        <li>Soporte por email</li>
      </ul>
    </div>
    <div class="pricing-card featured">
      <div class="plan-name">Profesional</div>
      <div class="plan-price">$400<span>/mes</span></div>
      <div class="plan-annual">$4,000/año — ahorra $800</div>
      <ul class="plan-features">
        <li>Hasta 10 coaches</li>
        <li>Hasta 200 clientes</li>
        <li>Branding completo</li>
        <li>Soporte prioritario</li>
      </ul>
    </div>
    <div class="pricing-card">
      <div class="plan-name">Enterprise</div>
      <div class="plan-price">$700<span>/mes</span></div>
      <div class="plan-annual">$7,000/año — ahorra $1,400</div>
      <ul class="plan-features">
        <li>Coaches ilimitados</li>
        <li>Clientes ilimitados</li>
        <li>Branding completo</li>
        <li>Soporte dedicado</li>
        <li>Integraciones custom</li>
      </ul>
    </div>
  </div>

  <div class="adv-grid">
    <div class="adv-box">
      <h4>🏢 Ventajas para el Gimnasio</h4>
      <ul>
        <li>Sin inversión inicial grande — gasto mensual manejable</li>
        <li>Hosting, actualizaciones y soporte incluidos</li>
        <li>App con la marca del gimnasio (white-label)</li>
        <li>Escalable según crecimiento del negocio</li>
        <li>2 meses gratis al pagar anualmente</li>
      </ul>
    </div>
    <div class="adv-box">
      <h4>📈 Ventajas para el Vendedor</h4>
      <ul>
        <li>Ingreso recurrente mensual (MRR)</li>
        <li>Retención del código fuente y propiedad intelectual</li>
        <li>Escalable a múltiples gimnasios</li>
        <li>$400/mes × 1 gimnasio = $4,800/año</li>
        <li>Pagos anuales aseguran flujo de caja</li>
      </ul>
    </div>
  </div>

</div>

<!-- ===================== PAGE 4: COMPRADORES + COMPETENCIA ===================== -->
<div class="page page-break">

  <h2>Perfiles de <span class="accent">Comprador Ideal</span></h2>
  <div class="section-line"></div>

  <h3>Para Venta Única (Opción A)</h3>

  <div class="buyer-card">
    <div class="buyer-icon">💻</div>
    <div>
      <strong>Agencias de Desarrollo</strong>
      <p>Agencias de software que atienden clientes de fitness o salud. El código sirve como base lista para personalizar y revender a múltiples clientes.</p>
    </div>
  </div>

  <div class="buyer-card">
    <div class="buyer-icon">🚀</div>
    <div>
      <strong>Startups</strong>
      <p>Emprendedores entrando al espacio fitness-tech que quieren un punto de partida listo para producción en vez de construir desde cero.</p>
    </div>
  </div>

  <h3>Para Suscripción SaaS (Opción B)</h3>

  <div class="buyer-card">
    <div class="buyer-icon">🏋️</div>
    <div>
      <strong>Gimnasios y Centros de Fitness</strong>
      <p>Cadenas de gimnasios, estudios de entrenamiento personal y centros de bienestar que quieren su propia app con su marca sin invertir en desarrollo.</p>
    </div>
  </div>

  <div class="buyer-card">
    <div class="buyer-icon">👥</div>
    <div>
      <strong>Coaches Independientes con Equipo</strong>
      <p>Coaches que manejan varios entrenadores y necesitan una plataforma profesional a un costo mensual accesible.</p>
    </div>
  </div>

  <div class="buyer-card">
    <div class="buyer-icon">🏅</div>
    <div>
      <strong>Centros de Bienestar y CrossFit Boxes</strong>
      <p>Negocios de fitness especializados que buscan diferenciarse con tecnología propia.</p>
    </div>
  </div>

  <h2 style="margin-top:28px;">Ventaja Competitiva <span class="accent">en Costa Rica</span></h2>
  <div class="section-line"></div>

  <div class="comp-item">
    <div class="comp-bullet">1</div>
    <p><strong>Localización en español</strong> ya incluida — la mayoría de plataformas competidoras (TrueCoach, Trainerize, etc.) son en inglés y cobran precios premium en USD.</p>
  </div>
  <div class="comp-item">
    <div class="comp-bullet">2</div>
    <p><strong>Cultura fitness en crecimiento</strong> en Costa Rica, especialmente en el GAM, Santa Ana, Escazú y las zonas turísticas de Guanacaste.</p>
  </div>
  <div class="comp-item">
    <div class="comp-bullet">3</div>
    <p>Muchos coaches dependen de <strong>WhatsApp y hojas de cálculo</strong> — una app dedicada es una mejora clara e inmediata.</p>
  </div>
  <div class="comp-item">
    <div class="comp-bullet">4</div>
    <p>Alternativa accesible a plataformas SaaS que cobran $20–$100+/mes <strong>por coach</strong> — NewCoach cobra <strong>por gimnasio</strong>, significativamente más económico.</p>
  </div>
  <div class="comp-item">
    <div class="comp-bullet">5</div>
    <p>Modelo de suscripción <strong>elimina la barrera de entrada</strong> para gimnasios pequeños y medianos.</p>
  </div>

</div>

<!-- ===================== PAGE 5: QUÉ INCLUYE + CONTACTO ===================== -->
<div class="page page-break">

  <h2>Qué Incluye <span class="accent">la Venta</span></h2>
  <div class="section-line"></div>

  <ul class="checklist">
    <li>Código fuente completo (TypeScript/React Native)</li>
    <li>Esquema de base de datos Supabase y migraciones</li>
    <li>Datos semilla (biblioteca de ejercicios con videos)</li>
    <li>Sistema de facturación y pagos integrado</li>
    <li>Módulo de fotos de progreso y métricas corporales</li>
    <li>Configuraciones de CI/CD (GitHub Actions)</li>
    <li>Configuraciones de build EAS (iOS + Android)</li>
    <li>Configuración de despliegue en Vercel (web)</li>
    <li>Suite de tests end-to-end</li>
    <li>Documentación (README)</li>
  </ul>

  <h2 style="margin-top:28px;">Complementos <span class="accent">Opcionales</span></h2>
  <div class="section-line"></div>

  <ul class="addon-list">
    <li><span class="icon">⟡</span> Soporte técnico post-venta y onboarding</li>
    <li><span class="icon">⟡</span> Configuración de pasarela de pago local (Sinpe Móvil u otra)</li>
    <li><span class="icon">⟡</span> Branding personalizado y despliegue</li>
    <li><span class="icon">⟡</span> Contrato de mantenimiento continuo</li>
  </ul>

  <div class="cta-box">
    <h3>¿Listo para comenzar?</h3>
    <p>Para consultas, demos en vivo o discutir términos, comuníquese directamente.</p>
  </div>

  <div class="page-footer">
    <p>Este documento es confidencial y está dirigido únicamente a compradores potenciales.<br>NewCoach &copy; 2026 — Todos los derechos reservados.</p>
  </div>

</div>

</body>
</html>`;

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle" });

  const outPath = path.resolve(__dirname, "..", "NewCoach-Sale-Prospectus.pdf");
  await page.pdf({
    path: outPath,
    format: "Letter",
    printBackground: true,
    margin: { top: "0", right: "0", bottom: "0", left: "0" },
  });

  await browser.close();
  console.log("PDF generated:", outPath);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
