import { useState } from 'react';
import { Mail, Check, X, Settings } from 'lucide-react';
import toast from 'react-hot-toast';

import Button from './ui/Button';
import Input from './ui/Input';
import Card from './ui/Card';
import Modal from './ui/Modal';
import { notificationsAPI } from '../services/api';

const NotificationTest = ({ user }) => {
  const [showModal, setShowModal] = useState(false);
  const [email, setEmail] = useState(user?.email || '');
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState(null);
  const [loadingConfig, setLoadingConfig] = useState(false);

  const loadConfig = async () => {
    try {
      setLoadingConfig(true);
      const response = await notificationsAPI.getConfig();
      setConfig(response.data);
    } catch (error) {
      toast.error('Error cargando configuración');
      console.error(error);
    } finally {
      setLoadingConfig(false);
    }
  };

  const handleTestEmail = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Email es requerido');
      return;
    }

    try {
      setLoading(true);
      await notificationsAPI.testEmail(email);
      toast.success('¡Email de prueba enviado! Revisa tu bandeja de entrada.');
      setShowModal(false);
    } catch (error) {
      console.error('Error sending test email:', error);
      toast.error(error.message || 'Error enviando email de prueba');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = async () => {
    setShowModal(true);
    await loadConfig();
  };

  if (user?.role !== 'admin') {
    return null; // Solo admins pueden ver este componente
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleOpenModal}
        className="hidden sm:flex items-center"
      >
        <Settings className="w-4 h-4 mr-2" />
        Notificaciones
      </Button>

      <Modal
        title="Configuración de Notificaciones"
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        size="md"
      >
        <div className="space-y-6">
          {/* Estado de configuración */}
          {loadingConfig ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600"></div>
            </div>
          ) : config && (
            <Card>
              <div className="space-y-3">
                <h3 className="font-medium text-gray-900 mb-3">Estado de Configuración</h3>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Gmail configurado:</span>
                  <div className="flex items-center">
                    {config.gmail_configured ? (
                      <><Check className="w-4 h-4 text-green-600 mr-1" /><span className="text-green-600">Sí</span></>
                    ) : (
                      <><X className="w-4 h-4 text-red-600 mr-1" /><span className="text-red-600">No</span></>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Email configurado:</span>
                  <span className="text-sm font-mono text-gray-900">{config.gmail_user}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Notificaciones activas:</span>
                  <div className="flex items-center">
                    {config.notifications_enabled ? (
                      <><Check className="w-4 h-4 text-green-600 mr-1" /><span className="text-green-600">Sí</span></>
                    ) : (
                      <><X className="w-4 h-4 text-red-600 mr-1" /><span className="text-red-600">No</span></>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Información sobre configuración */}
          {config && !config.gmail_configured && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex">
                <Mail className="w-5 h-5 text-yellow-600 mr-3 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-yellow-800 mb-1">
                    Gmail no configurado
                  </h4>
                  <p className="text-sm text-yellow-700 mb-2">
                    Para activar las notificaciones por email, configura las variables de entorno:
                  </p>
                  <ul className="text-xs text-yellow-600 font-mono space-y-1">
                    <li>GMAIL_USER=tu-email@gmail.com</li>
                    <li>GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx</li>
                  </ul>
                  <p className="text-xs text-yellow-600 mt-2">
                    ⚠️ Usa App Password, no tu contraseña normal
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Prueba de email */}
          {config && config.gmail_configured && (
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Enviar Email de Prueba</h3>
              <form onSubmit={handleTestEmail} className="space-y-4">
                <Input
                  label="Email de destino"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@email.com"
                  required
                />

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-700">
                    💡 Esto enviará un email de prueba para verificar que la configuración funciona correctamente.
                  </p>
                </div>

                <div className="flex gap-3 justify-end">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setShowModal(false)}
                  >
                    Cerrar
                  </Button>
                  <Button
                    type="submit"
                    loading={loading}
                    disabled={loading || !email.trim()}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Enviar Prueba
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Información sobre funcionamiento */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">ℹ️ Cómo funciona</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Se envían emails automáticamente al crear pedidos nuevos</li>
              <li>• Todos los usuarios del sistema reciben notificaciones</li>
              <li>• Los emails incluyen detalles completos del pedido</li>
              <li>• La función de email no afecta la creación de pedidos</li>
            </ul>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default NotificationTest;