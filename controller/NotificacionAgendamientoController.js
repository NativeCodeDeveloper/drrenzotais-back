import NotificacionAgendamiento from "../services/notificacionAgendamiento.js";
import ReservaPacientes from "../model/ReservaPacientes.js";

export default class NotificacionAgendamientoController {

  /**
   * CONFIRMAR CITA - Muestra página con formulario POST (seguro contra pre-carga de correos)
   * GET: Muestra la página de confirmación con un botón/formulario
   * El formulario usa POST para ejecutar la acción real
   */
  static async confirmarCita(req, res) {
    try {
      const {
        id_reserva,
        nombrePaciente,
        apellidoPaciente,
        fechaInicio,
        horaInicio
      } = req.query;

      if (!id_reserva || !nombrePaciente || !apellidoPaciente || !fechaInicio || !horaInicio) {
        return res.status(400).json({
          ok: false,
          message: "Faltan parámetros requeridos"
        });
      }

      // GET siempre muestra la página de confirmación con formulario POST
      // Los clientes de correo NO ejecutan formularios POST, solo GET
      return res.send(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Confirmar Cita</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
              background: #f3f4f6;
            }
            .container {
              background: white;
              padding: 40px;
              border-radius: 10px;
              box-shadow: 0 4px 20px rgba(0,0,0,0.1);
              text-align: center;
              max-width: 500px;
            }
            h1 { color: #1f2937; margin-bottom: 20px; }
            p { color: #4b5563; line-height: 1.6; margin-bottom: 10px; }
            .icon { font-size: 64px; margin-bottom: 20px; }
            .btn {
              display: inline-block;
              padding: 14px 32px;
              border-radius: 8px;
              border: none;
              font-size: 16px;
              font-weight: 600;
              cursor: pointer;
              margin: 10px;
            }
            .btn-confirm { background: #2563eb; color: white; }
            .btn-confirm:hover { background: #1d4ed8; }
            .detail-box {
              background: #f9fafb;
              padding: 15px;
              border-radius: 8px;
              margin: 20px 0;
              text-align: left;
              border: 1px solid #e5e7eb;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="icon">📅</div>
            <h1>¿Confirmar tu cita?</h1>
            <p>Estás a punto de confirmar la siguiente cita:</p>
            <div class="detail-box">
              <p><strong>Paciente:</strong> ${nombrePaciente} ${apellidoPaciente}</p>
              <p><strong>Fecha:</strong> ${fechaInicio}</p>
              <p><strong>Hora:</strong> ${horaInicio}</p>
            </div>
            <p>Haz clic en el botón para confirmar tu asistencia:</p>
            <form method="POST" action="/notificacion/confirmar/ejecutar" style="margin-top: 20px;">
              <input type="hidden" name="id_reserva" value="${id_reserva}" />
              <input type="hidden" name="nombrePaciente" value="${nombrePaciente}" />
              <input type="hidden" name="apellidoPaciente" value="${apellidoPaciente}" />
              <input type="hidden" name="fechaInicio" value="${fechaInicio}" />
              <input type="hidden" name="horaInicio" value="${horaInicio}" />
              <button type="submit" class="btn btn-confirm">Confirmar mi cita</button>
            </form>
            <p style="margin-top: 30px; color: #6b7280; font-size: 12px;">
              Si no solicitaste esta acción, puedes cerrar esta página.
            </p>
          </div>
        </body>
        </html>
      `);

    } catch (error) {
      console.error("[CONFIRMAR CITA] Error:", error);
      return res.status(500).json({
        ok: false,
        message: "Error al confirmar la cita"
      });
    }
  }

  /**
   * EJECUTAR CONFIRMACIÓN - Solo acepta POST (seguro)
   * Esta ruta ejecuta la acción real de confirmar la cita
   */
  static async ejecutarConfirmacion(req, res) {
    try {
      const {
        id_reserva,
        nombrePaciente,
        apellidoPaciente,
        fechaInicio,
        horaInicio
      } = req.body;

      if (!id_reserva || !nombrePaciente || !apellidoPaciente || !fechaInicio || !horaInicio) {
        return res.status(400).json({
          ok: false,
          message: "Faltan parámetros requeridos"
        });
      }

      const reservaPacienteClass = new ReservaPacientes();
      const estadoReserva = "CONFIRMADA";
      const respuestaBackend = await reservaPacienteClass.actualizarEstado(estadoReserva, id_reserva);

      // SOLO enviar correo si la actualización fue exitosa
      if(respuestaBackend && respuestaBackend.affectedRows > 0) {
          console.log("[CONFIRMAR CITA] Reserva confirmada correctamente. ID:", id_reserva);

          // Enviar correo de confirmación al equipo SOLO si se actualizó correctamente
          await NotificacionAgendamiento.enviarCorreoConfirmacionEquipo({
              nombrePaciente,
              apellidoPaciente,
              fechaInicio,
              horaInicio,
              accion: "CONFIRMADA",
              id_reserva
          });

          // Mostrar página de éxito
          return res.send(`
            <!DOCTYPE html>
            <html lang="es">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Cita Confirmada</title>
              <style>
                body {
                  font-family: Arial, sans-serif;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  min-height: 100vh;
                  margin: 0;
                  background: #f3f4f6;
                }
                .container {
                  background: white;
                  padding: 40px;
                  border-radius: 10px;
                  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                  text-align: center;
                  max-width: 500px;
                }
                h1 { color: #1f2937; margin-bottom: 20px; }
                p { color: #4b5563; line-height: 1.6; margin-bottom: 10px; }
                .icon { font-size: 64px; margin-bottom: 20px; }
                .status-badge {
                  display: inline-block;
                  background: #ecfdf5;
                  color: #065f46;
                  padding: 6px 16px;
                  border-radius: 20px;
                  font-weight: 600;
                  font-size: 14px;
                  margin-bottom: 20px;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="icon">✅</div>
                <h1>Cita Confirmada</h1>
                <span class="status-badge">Confirmada exitosamente</span>
                <p><strong>${nombrePaciente} ${apellidoPaciente}</strong></p>
                <p>Tu cita para el <strong>${fechaInicio}</strong> a las <strong>${horaInicio}</strong> ha sido registrada como confirmada.</p>
                <p>Se ha enviado una notificación al equipo correspondiente.</p>
                <p style="margin-top: 30px; color: #9ca3af; font-size: 13px;">
                  Ya puedes cerrar esta página.
                </p>
              </div>
            </body>
            </html>
          `);
      } else {
          // La actualización falló - NO enviar correo
          console.log("[CONFIRMAR CITA] No se pudo confirmar la reserva: no existe o ya está confirmada. ID:", id_reserva);
          return res.send(`
            <!DOCTYPE html>
            <html lang="es">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Error</title>
              <style>
                body {
                  font-family: Arial, sans-serif;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  min-height: 100vh;
                  margin: 0;
                  background: #f3f4f6;
                }
                .container {
                  background: white;
                  padding: 40px;
                  border-radius: 10px;
                  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                  text-align: center;
                  max-width: 500px;
                }
                h1 { color: #92400e; margin-bottom: 20px; }
                p { color: #4b5563; line-height: 1.6; margin-bottom: 10px; }
                .icon { font-size: 64px; margin-bottom: 20px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="icon">⚠️</div>
                <h1>Cita no encontrada</h1>
                <p>La cita que intentas confirmar no existe o ya fue procesada anteriormente.</p>
                <p style="margin-top: 30px; color: #9ca3af; font-size: 13px;">
                  Si tienes dudas, comunícate directamente con el equipo.
                </p>
              </div>
            </body>
            </html>
          `);
      }

    } catch (error) {
      console.error("[CONFIRMAR CITA] Error:", error);
      return res.status(500).json({
        ok: false,
        message: "Error al confirmar la cita"
      });
    }
  }











  /**
   * CANCELAR CITA - Muestra página con formulario POST (seguro contra pre-carga de correos)
   * GET: Muestra la página de cancelación con un botón/formulario
   * El formulario usa POST para ejecutar la acción real
   */
  static async cancelarCita(req, res) {
    try {
      const {
        id_reserva,
        nombrePaciente,
        apellidoPaciente,
        fechaInicio,
        horaInicio
      } = req.query;

      if (!id_reserva || !nombrePaciente || !apellidoPaciente || !fechaInicio || !horaInicio) {
        return res.status(400).json({
          ok: false,
          message: "Faltan parámetros requeridos"
        });
      }

      // GET siempre muestra la página de confirmación con formulario POST
      return res.send(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Cancelar Cita</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
              background: #f3f4f6;
            }
            .container {
              background: white;
              padding: 40px;
              border-radius: 10px;
              box-shadow: 0 4px 20px rgba(0,0,0,0.1);
              text-align: center;
              max-width: 500px;
            }
            h1 { color: #1f2937; margin-bottom: 20px; }
            p { color: #4b5563; line-height: 1.6; margin-bottom: 10px; }
            .icon { font-size: 64px; margin-bottom: 20px; }
            .btn {
              display: inline-block;
              padding: 14px 32px;
              border-radius: 8px;
              border: none;
              font-size: 16px;
              font-weight: 600;
              cursor: pointer;
              margin: 10px;
            }
            .btn-cancel { background: #dc2626; color: white; }
            .btn-cancel:hover { background: #b91c1c; }
            .detail-box {
              background: #f9fafb;
              padding: 15px;
              border-radius: 8px;
              margin: 20px 0;
              text-align: left;
              border: 1px solid #e5e7eb;
            }
            .warning {
              background: #fefce8;
              border: 1px solid #e5e7eb;
              padding: 12px;
              border-radius: 6px;
              margin: 15px 0;
              font-size: 14px;
              color: #713f12;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="icon">⚠️</div>
            <h1>¿Cancelar tu cita?</h1>
            <p>Estás a punto de cancelar la siguiente cita:</p>
            <div class="detail-box">
              <p><strong>Paciente:</strong> ${nombrePaciente} ${apellidoPaciente}</p>
              <p><strong>Fecha:</strong> ${fechaInicio}</p>
              <p><strong>Hora:</strong> ${horaInicio}</p>
            </div>
            <div class="warning">
              ⚠️ <strong>Importante:</strong> Esta acción no se puede deshacer. Si cancelas, deberás agendar una nueva cita.
            </div>
            <p>¿Estás seguro/a de que deseas cancelar?</p>
            <form method="POST" action="/notificacion/cancelar/ejecutar" style="margin-top: 20px;">
              <input type="hidden" name="id_reserva" value="${id_reserva}" />
              <input type="hidden" name="nombrePaciente" value="${nombrePaciente}" />
              <input type="hidden" name="apellidoPaciente" value="${apellidoPaciente}" />
              <input type="hidden" name="fechaInicio" value="${fechaInicio}" />
              <input type="hidden" name="horaInicio" value="${horaInicio}" />
              <button type="submit" class="btn btn-cancel">❌ Sí, cancelar mi cita</button>
            </form>
            <p style="margin-top: 30px; color: #6b7280; font-size: 12px;">
              Si no solicitaste esta acción, puedes cerrar esta página.
            </p>
          </div>
        </body>
        </html>
      `);

    } catch (error) {
      console.error("[CANCELAR CITA] Error:", error);
      return res.status(500).json({
        ok: false,
        message: "Error al cancelar la cita"
      });
    }
  }

  /**
   * EJECUTAR CANCELACIÓN - Solo acepta POST (seguro)
   * Esta ruta ejecuta la acción real de cancelar la cita
   */
  static async ejecutarCancelacion(req, res) {
    try {
      const {
        id_reserva,
        nombrePaciente,
        apellidoPaciente,
        fechaInicio,
        horaInicio
      } = req.body;

      if (!id_reserva || !nombrePaciente || !apellidoPaciente || !fechaInicio || !horaInicio) {
        return res.status(400).json({
          ok: false,
          message: "Faltan parámetros requeridos"
        });
      }

      const reservaPacienteClass = new ReservaPacientes();
      const estadoReserva = "ANULADA";
      const respuestaBackend = await reservaPacienteClass.actualizarEstado(estadoReserva, id_reserva);

      // SOLO enviar correo si la actualización fue exitosa
      if(respuestaBackend && respuestaBackend.affectedRows > 0) {
          console.log("[ANULAR CITA] Reserva ANULADA correctamente. ID:", id_reserva);

          // Enviar correo de cancelación al equipo SOLO si se actualizó correctamente
          await NotificacionAgendamiento.enviarCorreoConfirmacionEquipo({
            nombrePaciente,
            apellidoPaciente,
            fechaInicio,
            horaInicio,
            accion: "CANCELADA",
            id_reserva,
          });

          // Mostrar página de éxito
          return res.send(`
            <!DOCTYPE html>
            <html lang="es">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Cita Cancelada</title>
              <style>
                body {
                  font-family: Arial, sans-serif;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  min-height: 100vh;
                  margin: 0;
                  background: #f3f4f6;
                }
                .container {
                  background: white;
                  padding: 40px;
                  border-radius: 10px;
                  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                  text-align: center;
                  max-width: 500px;
                }
                h1 { color: #1f2937; margin-bottom: 20px; }
                p { color: #4b5563; line-height: 1.6; margin-bottom: 10px; }
                .icon { font-size: 64px; margin-bottom: 20px; }
                .status-badge {
                  display: inline-block;
                  background: #fef2f2;
                  color: #991b1b;
                  padding: 6px 16px;
                  border-radius: 20px;
                  font-weight: 600;
                  font-size: 14px;
                  margin-bottom: 20px;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="icon">❌</div>
                <h1>Cita Cancelada</h1>
                <span class="status-badge">Cancelada</span>
                <p><strong>${nombrePaciente} ${apellidoPaciente}</strong></p>
                <p>Tu cita para el <strong>${fechaInicio}</strong> a las <strong>${horaInicio}</strong> ha sido cancelada.</p>
                <p>Se ha enviado una notificación al equipo correspondiente.</p>
                <p style="margin-top: 30px; color: #9ca3af; font-size: 13px;">
                  Ya puedes cerrar esta página.
                </p>
              </div>
            </body>
            </html>
          `);
      } else {
          // La actualización falló - NO enviar correo
          console.log("[ANULAR CITA] No se pudo ANULAR la reserva: no existe o ya está ANULADA. ID:", id_reserva);
          return res.send(`
            <!DOCTYPE html>
            <html lang="es">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Error</title>
              <style>
                body {
                  font-family: Arial, sans-serif;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  min-height: 100vh;
                  margin: 0;
                  background: #f3f4f6;
                }
                .container {
                  background: white;
                  padding: 40px;
                  border-radius: 10px;
                  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                  text-align: center;
                  max-width: 500px;
                }
                h1 { color: #92400e; margin-bottom: 20px; }
                p { color: #4b5563; line-height: 1.6; margin-bottom: 10px; }
                .icon { font-size: 64px; margin-bottom: 20px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="icon">⚠️</div>
                <h1>Cita no encontrada</h1>
                <p>La cita que intentas cancelar no existe o ya fue procesada anteriormente.</p>
                <p style="margin-top: 30px; color: #9ca3af; font-size: 13px;">
                  Si tienes dudas, comunícate directamente con el equipo.
                </p>
              </div>
            </body>
            </html>
          `);
      }

    } catch (error) {
      console.error("[CANCELAR CITA] Error:", error);
      return res.status(500).json({
        ok: false,
        message: "Error al cancelar la cita"
      });
    }
  }
}
