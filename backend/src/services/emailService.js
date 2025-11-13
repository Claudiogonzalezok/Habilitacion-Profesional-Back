// services/emailService.js
import { getTransporter } from "../config/email.config.js";

/**
 * Enviar email de recuperación de contraseña
 */
export const enviarEmailRecuperacion = async (email, nombre, resetToken) => {
  const transporter = getTransporter();
  
  if (!transporter) {
    throw new Error("El servicio de email no está configurado");
  }

  const resetURL = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

  const mailOptions = {
    from: `"Aula Virtual" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: "Recuperación de Contraseña - Aula Virtual",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #0d6efd; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; padding: 12px 30px; background-color: #0d6efd; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #6c757d; font-size: 12px; }
          .warning { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Recuperación de Contraseña</h1>
          </div>
          <div class="content">
            <p>Hola <strong>${nombre}</strong>,</p>
            <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en <strong>Aula Virtual</strong>.</p>
            <p>Para crear una nueva contraseña, haz clic en el siguiente botón:</p>
            <div style="text-align: center;">
              <a href="${resetURL}" class="button">Restablecer Contraseña</a>
            </div>
            <p>O copia y pega este enlace en tu navegador:</p>
            <p style="word-break: break-all; color: #0d6efd;">${resetURL}</p>
            <div class="warning">
              <strong>⚠️ Importante:</strong>
              <ul>
                <li>Este enlace expirará en <strong>1 hora</strong></li>
                <li>Si no solicitaste este cambio, ignora este correo</li>
                <li>Tu contraseña actual seguirá siendo válida</li>
              </ul>
            </div>
          </div>
          <div class="footer">
            <p>Este es un correo automático, por favor no responder.</p>
            <p>&copy; ${new Date().getFullYear()} Aula Virtual - Todos los derechos reservados</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email de recuperación enviado a: ${email}`);
    return true;
  } catch (error) {
    console.error("❌ Error al enviar email:", error);
    throw new Error("No se pudo enviar el email de recuperación");
  }
};

/**
 * Enviar email de confirmación de cambio de contraseña
 */
export const enviarEmailConfirmacionCambio = async (email, nombre) => {
  const transporter = getTransporter();
  
  if (!transporter) {
    console.warn("⚠️ No se pudo enviar email de confirmación: servicio no configurado");
    return false;
  }

  const mailOptions = {
    from: `"Aula Virtual" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: "Contraseña Actualizada - Aula Virtual",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #198754; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
          .footer { text-align: center; margin-top: 20px; color: #6c757d; font-size: 12px; }
          .alert { background-color: #d1ecf1; border-left: 4px solid #0dcaf0; padding: 15px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Contraseña Actualizada</h1>
          </div>
          <div class="content">
            <p>Hola <strong>${nombre}</strong>,</p>
            <p>Te confirmamos que la contraseña de tu cuenta en <strong>Aula Virtual</strong> ha sido actualizada exitosamente.</p>
            <div class="alert">
              <strong>🔒 Tu cuenta está segura</strong>
              <p>Si realizaste este cambio, no necesitas hacer nada más.</p>
            </div>
            <p>Si <strong>NO</strong> realizaste este cambio, por favor contacta con el administrador de inmediato.</p>
          </div>
          <div class="footer">
            <p>Este es un correo automático, por favor no responder.</p>
            <p>&copy; ${new Date().getFullYear()} Aula Virtual - Todos los derechos reservados</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email de confirmación enviado a: ${email}`);
    return true;
  } catch (error) {
    console.error("❌ Error al enviar email de confirmación:", error);
    return false;
  }
};

/**
 * Enviar email de verificación de cuenta (con contraseña)
 */
export const enviarEmailVerificacion = async (email, nombre, verificationToken, passwordTemporal) => {
  const transporter = getTransporter();
  
  if (!transporter) {
    throw new Error("El servicio de email no está configurado");
  }

  const verificationURL = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;

  const mailOptions = {
    from: `"Aula Virtual" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: "Verifica tu cuenta - Aula Virtual",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #198754; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; padding: 12px 30px; background-color: #198754; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #6c757d; font-size: 12px; }
          .warning { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
          .credentials { background-color: #fff; border: 2px solid #198754; padding: 20px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎓 ¡Bienvenido a Aula Virtual!</h1>
          </div>
          <div class="content">
            <p>Hola <strong>${nombre}</strong>,</p>
            <p>¡Gracias por registrarte en <strong>Aula Virtual</strong>!</p>
            <p>Para completar tu registro y activar tu cuenta, por favor verifica tu dirección de correo electrónico haciendo clic en el siguiente botón:</p>
            <div style="text-align: center;">
              <a href="${verificationURL}" class="button">Verificar mi email</a>
            </div>
            <p>O copia y pega este enlace en tu navegador:</p>
            <p style="word-break: break-all; color: #198754;">${verificationURL}</p>
            
            ${passwordTemporal ? `
            <div class="credentials">
              <h3 style="margin-top: 0; color: #198754;">📋 Tus credenciales de acceso:</h3>
              <p style="margin: 10px 0;">
                <strong>Email:</strong> ${email}<br>
                <strong>Contraseña:</strong> <code style="background: #f8f9fa; padding: 5px 10px; border-radius: 3px; font-size: 14px;">${passwordTemporal}</code>
              </p>
              <p style="margin: 10px 0; color: #666; font-size: 14px;">
                💡 <strong>Importante:</strong> Guarda esta contraseña en un lugar seguro. Podrás cambiarla después de iniciar sesión.
              </p>
            </div>
            ` : ''}
            
            <div class="warning">
              <strong>⚠️ Importante:</strong>
              <ul>
                <li>Este enlace expirará en <strong>24 horas</strong></li>
                <li>Si no solicitaste esta cuenta, ignora este correo</li>
                <li>No podrás iniciar sesión hasta verificar tu email</li>
              </ul>
            </div>
          </div>
          <div class="footer">
            <p>Este es un correo automático, por favor no responder.</p>
            <p>&copy; ${new Date().getFullYear()} Aula Virtual - Todos los derechos reservados</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email de verificación enviado a: ${email}`);
    return true;
  } catch (error) {
    console.error("❌ Error al enviar email de verificación:", error);
    throw new Error("No se pudo enviar el email de verificación");
  }
};

/**
 * Enviar email de bienvenida (después de verificar)
 */
export const enviarEmailBienvenida = async (email, nombre) => {
  const transporter = getTransporter();
  
  if (!transporter) {
    console.warn("⚠️ No se pudo enviar email de bienvenida: servicio no configurado");
    return false;
  }

  const mailOptions = {
    from: `"Aula Virtual" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: "¡Cuenta verificada! - Aula Virtual",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #0d6efd; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; padding: 12px 30px; background-color: #0d6efd; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #6c757d; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ ¡Cuenta Verificada!</h1>
          </div>
          <div class="content">
            <p>Hola <strong>${nombre}</strong>,</p>
            <p>¡Tu cuenta ha sido verificada exitosamente! 🎉</p>
            <p>Ya puedes iniciar sesión y comenzar a usar todas las funcionalidades de <strong>Aula Virtual</strong>.</p>
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL}/login" class="button">Iniciar Sesión</a>
            </div>
            <p>¡Bienvenido a nuestra comunidad educativa!</p>
          </div>
          <div class="footer">
            <p>Este es un correo automático, por favor no responder.</p>
            <p>&copy; ${new Date().getFullYear()} Aula Virtual - Todos los derechos reservados</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email de bienvenida enviado a: ${email}`);
    return true;
  } catch (error) {
    console.error("❌ Error al enviar email de bienvenida:", error);
    return false;
  }
};

/**
 * 🆕 Enviar email con credenciales cuando un admin crea un usuario
 */
export const enviarEmailCredenciales = async (email, nombre, passwordTemporal) => {
  const transporter = getTransporter();
  
  if (!transporter) {
    console.warn("⚠️ No se pudo enviar email con credenciales: servicio no configurado");
    return false;
  }

  const mailOptions = {
    from: `"Aula Virtual" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: "Tu cuenta ha sido creada - Aula Virtual",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #0d6efd; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; padding: 12px 30px; background-color: #0d6efd; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #6c757d; font-size: 12px; }
          .credentials { background-color: #fff; border: 2px solid #0d6efd; padding: 20px; border-radius: 5px; margin: 20px 0; }
          .alert { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎓 Bienvenido a Aula Virtual</h1>
          </div>
          <div class="content">
            <p>Hola <strong>${nombre}</strong>,</p>
            <p>Un administrador ha creado una cuenta para ti en <strong>Aula Virtual</strong>.</p>
            
            <div class="credentials">
              <h3 style="margin-top: 0; color: #0d6efd;">📋 Tus credenciales de acceso:</h3>
              <p style="margin: 10px 0;">
                <strong>Email:</strong> ${email}<br>
                <strong>Contraseña:</strong> <code style="background: #f8f9fa; padding: 5px 10px; border-radius: 3px; font-size: 14px;">${passwordTemporal}</code>
              </p>
            </div>

            <div class="alert">
              <strong>🔒 Importante:</strong>
              <p style="margin: 10px 0;">Por seguridad, te recomendamos cambiar tu contraseña después del primer inicio de sesión.</p>
            </div>

            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL}/login" class="button">Iniciar Sesión</a>
            </div>

            <p>Si tienes alguna duda, contacta con el administrador.</p>
          </div>
          <div class="footer">
            <p>Este es un correo automático, por favor no responder.</p>
            <p>&copy; ${new Date().getFullYear()} Aula Virtual - Todos los derechos reservados</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email con credenciales enviado a: ${email}`);
    return true;
  } catch (error) {
    console.error("❌ Error al enviar email con credenciales:", error);
    return false;
  }
};