// emailService.js
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const EMAIL_FROM = process.env.EMAIL_FROM || "onboarding@resend.dev";
const FRONTEND_URL = process.env.FRONTEND_URL;

// =======================================================
//   ESTILOS BÁSICOS (HTML Templates)
// =======================================================
const baseEmail = (titulo, contenido) => `
  <div style="font-family: Arial; background:#f6f6f6; padding:20px;">
    <div style="max-width:600px; margin:auto; background:white; border-radius:8px; padding:20px;
                box-shadow:0 2px 8px rgba(0,0,0,0.1);">
      <h2 style="color:#1a73e8;">${titulo}</h2>
      <hr style="border:none;border-top:1px solid #ddd;margin-bottom:20px;" />
      <div style="font-size:15px; color:#333;">
        ${contenido}
      </div>
      <br />
      <p style="font-size:13px; color:#888;">Aula Virtual UTN - Sistema automático</p>
    </div>
  </div>
`;

// =======================================================
//   1️⃣ VERIFICACIÓN DE CUENTA
// =======================================================
export const enviarEmailVerificacion = async (email, nombre, token) => {
  const link = `${FRONTEND_URL}/verify/${token}`;

  const html = baseEmail(
    "Verificación de cuenta",
    `
      <p>Hola <strong>${nombre}</strong>, gracias por registrarte.</p>
      <p>Hacé clic en el botón para activar tu cuenta:</p>
      <p>
        <a href="${link}" 
           style="background:#1a73e8;color:white;padding:12px 20px;
                  border-radius:5px;text-decoration:none;font-weight:bold;">
           Verificar mi cuenta
        </a>
      </p>
      <p>Si no funciona, copiá este enlace en tu navegador:</p>
      <p>${link}</p>
    `
  );

  return await resend.emails.send({
    from: EMAIL_FROM,
    to: email,
    subject: "Verificá tu cuenta",
    html,
  });
};

// =======================================================
//   2️⃣ ENVÍO DE CREDENCIALES (Creación por admin)
// =======================================================
export const enviarEmailCredenciales = async (email, nombre, password) => {
  const html = baseEmail(
    "Tus credenciales de acceso",
    `
      <p>Hola <strong>${nombre}</strong>, tu cuenta fue creada exitosamente.</p>
      <p>Estas son tus credenciales:</p>
      <ul>
        <li><strong>Email:</strong> ${email}</li>
        <li><strong>Contraseña:</strong> ${password}</li>
      </ul>
      <p>Podés ingresar desde aquí:</p>
      <a href="${FRONTEND_URL}/login"
         style="background:#28a745;color:white;padding:12px 20px;
                border-radius:5px;text-decoration:none;font-weight:bold;">
         Iniciar sesión
      </a>
      <br/><br/>
      <p>Te recomendamos cambiar la contraseña al ingresar.</p>
    `
  );

  return await resend.emails.send({
    from: EMAIL_FROM,
    to: email,
    subject: "Bienvenido al Aula Virtual - Tus credenciales",
    html,
  });
};

// =======================================================
//   3️⃣ EMAIL PARA RECUPERAR CONTRASEÑA
// =======================================================
export const enviarEmailRecuperacion = async (email, token) => {
  const link = `${FRONTEND_URL}/reset-password/${token}`;

  const html = baseEmail(
    "Restablecer contraseña",
    `
      <p>Recibimos una solicitud para restablecer tu contraseña.</p>
      <p>Hacé clic aquí para continuar:</p>
      <a href="${link}" 
         style="background:#dc3545;color:white;padding:12px 20px;
                border-radius:5px;text-decoration:none;font-weight:bold;">
         Restablecer contraseña
      </a>
      <br/><br/>
      <p>Si no solicitaste esto, podés ignorar este mensaje.</p>
    `
  );

  return await resend.emails.send({
    from: EMAIL_FROM,
    to: email,
    subject: "Recuperar contraseña - Aula Virtual",
    html,
  });
};

// =======================================================
//   4️⃣ CONFIRMACIÓN DE CONTRASEÑA CAMBIADA
// =======================================================
export const enviarEmailConfirmacionCambio = async (email, nombre) => {
  const html = baseEmail(
    "Tu contraseña fue cambiada",
    `
      <p>Hola <strong>${nombre}</strong>,</p>
      <p>Este mensaje confirma que tu contraseña fue cambiada correctamente.</p>
      <p>Si no realizaste este cambio, contactanos de inmediato.</p>
    `
  );

  return await resend.emails.send({
    from: EMAIL_FROM,
    to: email,
    subject: "Contraseña actualizada",
    html,
  });
};

// =======================================================
//   5️⃣ EMAIL DE BIENVENIDA (para alumnos/docentes)
// =======================================================
export const enviarEmailBienvenida = async (email, nombre) => {
  const html = baseEmail(
    "¡Bienvenido al Aula Virtual!",
    `
      <p>Hola <strong>${nombre}</strong>,</p>
      <p>Ya podés acceder al sistema utilizando tu cuenta.</p>
      <p>Te deseamos un excelente comienzo.</p>
    `
  );

  return await resend.emails.send({
    from: EMAIL_FROM,
    to: email,
    subject: "Bienvenido al Aula Virtual",
    html,
  });
};

// =======================================================
//   6️⃣ NOTIFICACIÓN A DOCENTES O ADMIN
// =======================================================
export const enviarNotificacionDocente = async (email, asunto, mensaje) => {
  const html = baseEmail("Nueva notificación", `<p>${mensaje}</p>`);

  return await resend.emails.send({
    from: EMAIL_FROM,
    to: email,
    subject: asunto,
    html,
  });
};
