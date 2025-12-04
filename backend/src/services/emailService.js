// services/emailService.js
// Servicio de email usando Resend (funciona en Render)

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const EMAIL_FROM = process.env.EMAIL_FROM || "Aula Virtual <onboarding@resend.dev>";

// Función para enviar email usando Resend API
const enviarEmail = async ({ to, subject, html }) => {
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: [to],
        subject: subject,
        html: html
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ Error de Resend:", data);
      throw new Error(data.message || "Error al enviar email");
    }

    console.log("✅ Email enviado correctamente:", data.id);
    return data;
  } catch (error) {
    console.error("❌ Error al enviar email:", error);
    throw error;
  }
};

// Template base para emails
const getEmailTemplate = (contenido, titulo) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${titulo}</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #1a5276 0%, #2874a6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .header h1 { margin: 0; font-size: 28px; }
    .content { background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .button { display: inline-block; background: linear-gradient(135deg, #1a5276 0%, #2874a6 100%); color: white !important; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
    .button:hover { opacity: 0.9; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    .info-box { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #1a5276; }
    .warning { background: #fff3cd; border-left-color: #ffc107; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎓 Aula Virtual</h1>
    </div>
    <div class="content">
      ${contenido}
    </div>
    <div class="footer">
      <p>Este es un email automático del Sistema de Aula Virtual</p>
      <p>UTN - Facultad Regional Tucumán</p>
      <p>© ${new Date().getFullYear()} - Todos los derechos reservados</p>
    </div>
  </div>
</body>
</html>
`;

// ============================================
// FUNCIONES DE ENVÍO DE EMAIL
// ============================================

// Email de verificación de cuenta
export const enviarEmailVerificacion = async (email, nombre, token, password = null) => {
  const verificationUrl = `${FRONTEND_URL}/verificar-email/${token}`;
  
  let contenidoPassword = "";
  if (password) {
    contenidoPassword = `
      <div class="info-box">
        <p><strong>📧 Email:</strong> ${email}</p>
        <p><strong>🔑 Contraseña temporal:</strong> ${password}</p>
      </div>
      <p class="warning" style="background: #fff3cd; padding: 10px; border-radius: 5px;">
        ⚠️ Por seguridad, te recomendamos cambiar tu contraseña después de iniciar sesión.
      </p>
    `;
  }

  const contenido = `
    <h2>¡Hola ${nombre}! 👋</h2>
    <p>Gracias por registrarte en el <strong>Aula Virtual</strong>.</p>
    <p>Para completar tu registro y activar tu cuenta, por favor verifica tu email haciendo clic en el siguiente botón:</p>
    
    <div style="text-align: center;">
      <a href="${verificationUrl}" class="button">✅ Verificar mi Email</a>
    </div>
    
    ${contenidoPassword}
    
    <div class="info-box">
      <p><strong>⏰ Importante:</strong> Este enlace expirará en 24 horas.</p>
    </div>
    
    <p>Si no creaste esta cuenta, puedes ignorar este mensaje.</p>
    
    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
    <p style="font-size: 12px; color: #666;">Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
    <p style="font-size: 12px; color: #1a5276; word-break: break-all;">${verificationUrl}</p>
  `;

  await enviarEmail({
    to: email,
    subject: "✅ Verifica tu email - Aula Virtual",
    html: getEmailTemplate(contenido, "Verificación de Email")
  });
};

// Email de bienvenida
export const enviarEmailBienvenida = async (email, nombre) => {
  const loginUrl = `${FRONTEND_URL}/login`;

  const contenido = `
    <h2>¡Bienvenido/a ${nombre}! 🎉</h2>
    <p>Tu cuenta en el <strong>Aula Virtual</strong> ha sido verificada exitosamente.</p>
    <p>Ya puedes acceder a la plataforma y comenzar a explorar todas las funcionalidades disponibles:</p>
    
    <ul style="line-height: 2;">
      <li>📚 Inscribirte en cursos</li>
      <li>📝 Realizar exámenes en línea</li>
      <li>📋 Entregar tareas</li>
      <li>💬 Comunicarte con docentes y compañeros</li>
      <li>📊 Consultar tus calificaciones</li>
    </ul>
    
    <div style="text-align: center;">
      <a href="${loginUrl}" class="button">🚀 Ingresar al Aula Virtual</a>
    </div>
    
    <p>Si tienes alguna duda, no dudes en contactar a tu docente o al administrador del sistema.</p>
    
    <p>¡Te deseamos mucho éxito en tu aprendizaje! 📖</p>
  `;

  await enviarEmail({
    to: email,
    subject: "🎉 ¡Bienvenido/a al Aula Virtual!",
    html: getEmailTemplate(contenido, "Bienvenida")
  });
};

// Email de credenciales (cuando el admin crea un usuario pre-verificado)
export const enviarEmailCredenciales = async (email, nombre, password) => {
  const loginUrl = `${FRONTEND_URL}/login`;

  const contenido = `
    <h2>¡Hola ${nombre}! 👋</h2>
    <p>Se ha creado una cuenta para ti en el <strong>Aula Virtual</strong>.</p>
    <p>A continuación te enviamos tus credenciales de acceso:</p>
    
    <div class="info-box">
      <p><strong>📧 Email:</strong> ${email}</p>
      <p><strong>🔑 Contraseña:</strong> ${password}</p>
    </div>
    
    <div style="text-align: center;">
      <a href="${loginUrl}" class="button">🚀 Ingresar al Aula Virtual</a>
    </div>
    
    <div class="info-box warning">
      <p><strong>⚠️ Importante:</strong> Por seguridad, te recomendamos cambiar tu contraseña después del primer inicio de sesión.</p>
    </div>
    
    <p>Si tienes alguna pregunta, contacta al administrador del sistema.</p>
  `;

  await enviarEmail({
    to: email,
    subject: "🔐 Tus credenciales de acceso - Aula Virtual",
    html: getEmailTemplate(contenido, "Credenciales de Acceso")
  });
};

// Email de recuperación de contraseña
export const enviarEmailRecuperacion = async (email, nombre, token) => {
  const resetUrl = `${FRONTEND_URL}/restablecer-password/${token}`;

  const contenido = `
    <h2>Hola ${nombre} 👋</h2>
    <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en el <strong>Aula Virtual</strong>.</p>
    <p>Si fuiste tú quien lo solicitó, haz clic en el siguiente botón:</p>
    
    <div style="text-align: center;">
      <a href="${resetUrl}" class="button">🔑 Restablecer Contraseña</a>
    </div>
    
    <div class="info-box">
      <p><strong>⏰ Importante:</strong> Este enlace expirará en 1 hora por seguridad.</p>
    </div>
    
    <div class="info-box warning">
      <p><strong>⚠️ Si no solicitaste este cambio</strong>, puedes ignorar este mensaje. Tu contraseña permanecerá sin cambios.</p>
    </div>
    
    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
    <p style="font-size: 12px; color: #666;">Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
    <p style="font-size: 12px; color: #1a5276; word-break: break-all;">${resetUrl}</p>
  `;

  await enviarEmail({
    to: email,
    subject: "🔑 Recuperación de contraseña - Aula Virtual",
    html: getEmailTemplate(contenido, "Recuperación de Contraseña")
  });
};

// Email de confirmación de cambio de contraseña
export const enviarEmailConfirmacionCambio = async (email, nombre) => {
  const contenido = `
    <h2>Hola ${nombre} 👋</h2>
    <p>Te confirmamos que tu contraseña del <strong>Aula Virtual</strong> ha sido cambiada exitosamente.</p>
    
    <div class="info-box">
      <p>✅ <strong>Fecha del cambio:</strong> ${new Date().toLocaleString("es-AR", { dateStyle: "full", timeStyle: "short" })}</p>
    </div>
    
    <div class="info-box warning">
      <p><strong>⚠️ Si no realizaste este cambio</strong>, contacta inmediatamente al administrador del sistema, ya que alguien podría haber accedido a tu cuenta.</p>
    </div>
    
    <p>Si fuiste tú quien realizó el cambio, puedes ignorar este mensaje.</p>
  `;

  await enviarEmail({
    to: email,
    subject: "✅ Contraseña actualizada - Aula Virtual",
    html: getEmailTemplate(contenido, "Contraseña Actualizada")
  });
};

// Email de notificación genérica
export const enviarEmailNotificacion = async (email, nombre, titulo, mensaje, link = null) => {
  let botonLink = "";
  if (link) {
    botonLink = `
      <div style="text-align: center;">
        <a href="${link}" class="button">Ver más detalles</a>
      </div>
    `;
  }

  const contenido = `
    <h2>Hola ${nombre} 👋</h2>
    <p>${mensaje}</p>
    ${botonLink}
  `;

  await enviarEmail({
    to: email,
    subject: `${titulo} - Aula Virtual`,
    html: getEmailTemplate(contenido, titulo)
  });
};

export default {
  enviarEmailVerificacion,
  enviarEmailBienvenida,
  enviarEmailCredenciales,
  enviarEmailRecuperacion,
  enviarEmailConfirmacionCambio,
  enviarEmailNotificacion
};