import { useState, useEffect } from 'react';
import { Mail, Check, X, Settings, Plus, Trash2, Users, RefreshCw, Bell, BellOff } from 'lucide-react';
import toast from 'react-hot-toast';

import Button from './ui/Button';
import Input from './ui/Input';
import Card from './ui/Card';
import Modal from './ui/Modal';
import Table from './ui/Table';
import Badge from './ui/Badge';
import { notificationsAPI } from '../services/api';

const NotificationManager = ({ user }) => {
  const [showModal, setShowModal] = useState(false);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(false);

  // Estados para agregar email extra
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [addingEmail, setAddingEmail] = useState(false);

  // Estados para email de prueba
  const [testEmail, setTestEmail] = useState(user?.email || '');
  const [sendingTest, setSendingTest] = useState(false);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const response = await notificationsAPI.getConfig();
      setConfig(response.data);
    } catch (error) {
      toast.error('Error cargando configuración');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleGlobalNotifications = async () => {
    try {
      const newSettings = {
        ...config.settings,
        enabled: !config.settings.enabled
      };

      await notificationsAPI.updateConfig({ settings: newSettings });
      setConfig(prev => ({
        ...prev,
        settings: newSettings
      }));

      toast.success(`Notificaciones ${newSettings.enabled ? 'activadas' : 'desactivadas'}`);
    } catch (error) {
      toast.error('Error actualizando configuración');
      console.error(error);
    }
  };

  const handleToggleUserNotification = async (userId, currentEnabled) => {
    try {
      const updatedUsers = config.userNotifications.map(user =>
        user.userId === userId ? { ...user, enabled: !currentEnabled } : user
      );

      await notificationsAPI.updateConfig({ userNotifications: updatedUsers });
      setConfig(prev => ({
        ...prev,
        userNotifications: updatedUsers
      }));

      toast.success('Configuración actualizada');
    } catch (error) {
      toast.error('Error actualizando configuración');
      console.error(error);
    }
  };

  const handleAddExtraEmail = async (e) => {
    e.preventDefault();
    if (!newEmail.trim() || !newName.trim()) {
      toast.error('Email y nombre son requeridos');
      return;
    }

    try {
      setAddingEmail(true);
      await notificationsAPI.addExtraEmail(newEmail.trim(), newName.trim());
      await loadConfig(); // Recargar configuración
      setNewEmail('');
      setNewName('');
      toast.success('Email agregado exitosamente');
    } catch (error) {
      toast.error(error.message || 'Error agregando email');
    } finally {
      setAddingEmail(false);
    }
  };

  const handleDeleteExtraEmail = async (email) => {
    if (!confirm(`¿Eliminar el email ${email}?`)) return;

    try {
      await notificationsAPI.deleteExtraEmail(email);
      await loadConfig();
      toast.success('Email eliminado');
    } catch (error) {
      toast.error('Error eliminando email');
      console.error(error);
    }
  };

  const handleToggleExtraEmail = async (email, currentEnabled) => {
    try {
      const updatedExtras = config.extraEmails.map(extra =>
        extra.email === email ? { ...extra, enabled: !currentEnabled } : extra
      );

      await notificationsAPI.updateConfig({ extraEmails: updatedExtras });
      setConfig(prev => ({
        ...prev,
        extraEmails: updatedExtras
      }));

      toast.success('Configuración actualizada');
    } catch (error) {
      toast.error('Error actualizando configuración');
      console.error(error);
    }
  };

  const handleSyncUsers = async () => {
    try {
      await notificationsAPI.syncUsers();
      await loadConfig();
      toast.success('Usuarios sincronizados');
    } catch (error) {
      toast.error('Error sincronizando usuarios');
      console.error(error);
    }
  };

  const handleTestEmail = async (e) => {
    e.preventDefault();
    if (!testEmail.trim()) {
      toast.error('Email es requerido');
      return;
    }

    try {
      setSendingTest(true);
      await notificationsAPI.testEmail(testEmail);
      toast.success('¡Email de prueba enviado! Revisa tu bandeja.');
    } catch (error) {
      toast.error(error.message || 'Error enviando email de prueba');
    } finally {
      setSendingTest(false);
    }
  };

  useEffect(() => {
    if (showModal) {
      loadConfig();
    }
  }, [showModal]);

  if (user?.role !== 'admin') {
    return null;
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowModal(true)}
        className="hidden sm:flex items-center"
      >
        <Settings className="w-4 h-4 mr-2" />
        Notificaciones
      </Button>

      <Modal
        title="🔔 Gestión de Notificaciones"
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        size="lg"
      >
        <div className="space-y-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            </div>
          ) : config ? (
            <>
              {/* Estado General */}
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Estado General</h3>
                  <Button
                    variant={config.settings.enabled ? "outline" : "default"}
                    size="sm"
                    onClick={handleToggleGlobalNotifications}
                  >
                    {config.settings.enabled ? (
                      <><Bell className="w-4 h-4 mr-2" />Activado</>
                    ) : (
                      <><BellOff className="w-4 h-4 mr-2" />Desactivado</>
                    )}
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Gmail configurado:</span>
                    <div className="flex items-center">
                      {config.gmail_configured ? (
                        <><Check className="w-4 h-4 text-green-600 mr-1" /><span className="text-green-600">Sí</span></>
                      ) : (
                        <><X className="w-4 h-4 text-red-600 mr-1" /><span className="text-red-600">No</span></>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Email configurado:</span>
                    <span className="font-mono text-xs">{config.gmail_user}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Emails activos:</span>
                    <Badge variant="default" size="sm">{config.totalActiveEmails}</Badge>
                  </div>
                </div>
              </Card>

              {/* Usuarios del Sistema */}
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">👥 Usuarios del Sistema</h3>
                  <Button variant="outline" size="sm" onClick={handleSyncUsers}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Sincronizar
                  </Button>
                </div>

                <Table>
                  <Table.Header>
                    <Table.Row>
                      <Table.Head>Usuario</Table.Head>
                      <Table.Head>Email</Table.Head>
                      <Table.Head>Estado</Table.Head>
                      <Table.Head>Acción</Table.Head>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {config.userNotifications.map((user) => (
                      <Table.Row key={user.userId}>
                        <Table.Cell>
                          <div className="font-medium">{user.name}</div>
                        </Table.Cell>
                        <Table.Cell>
                          <div className="font-mono text-sm">{user.email}</div>
                        </Table.Cell>
                        <Table.Cell>
                          <Badge
                            variant={user.enabled ? "default" : "secondary"}
                            size="sm"
                          >
                            {user.enabled ? "Activo" : "Desactivado"}
                          </Badge>
                        </Table.Cell>
                        <Table.Cell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleUserNotification(user.userId, user.enabled)}
                          >
                            {user.enabled ? <BellOff className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                          </Button>
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table>
              </Card>

              {/* Emails Extra */}
              <Card>
                <h3 className="font-semibold text-gray-900 mb-4">📧 Emails Adicionales</h3>

                {/* Formulario para agregar */}
                <form onSubmit={handleAddExtraEmail} className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                  <Input
                    placeholder="nombre@email.com"
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    disabled={addingEmail}
                  />
                  <Input
                    placeholder="Nombre completo"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    disabled={addingEmail}
                  />
                  <Button
                    type="submit"
                    size="sm"
                    loading={addingEmail}
                    disabled={!newEmail.trim() || !newName.trim()}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar
                  </Button>
                </form>

                {/* Lista de emails extra */}
                {config.extraEmails.length > 0 ? (
                  <Table>
                    <Table.Header>
                      <Table.Row>
                        <Table.Head>Nombre</Table.Head>
                        <Table.Head>Email</Table.Head>
                        <Table.Head>Estado</Table.Head>
                        <Table.Head>Acciones</Table.Head>
                      </Table.Row>
                    </Table.Header>
                    <Table.Body>
                      {config.extraEmails.map((extra) => (
                        <Table.Row key={extra.email}>
                          <Table.Cell>
                            <div className="font-medium">{extra.name}</div>
                          </Table.Cell>
                          <Table.Cell>
                            <div className="font-mono text-sm">{extra.email}</div>
                          </Table.Cell>
                          <Table.Cell>
                            <Badge
                              variant={extra.enabled ? "default" : "secondary"}
                              size="sm"
                            >
                              {extra.enabled ? "Activo" : "Desactivado"}
                            </Badge>
                          </Table.Cell>
                          <Table.Cell>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleToggleExtraEmail(extra.email, extra.enabled)}
                              >
                                {extra.enabled ? <BellOff className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteExtraEmail(extra.email)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </Table.Cell>
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    No hay emails adicionales configurados
                  </div>
                )}
              </Card>

              {/* Enviar Email de Prueba */}
              {config.gmail_configured && config.settings.enabled && (
                <Card>
                  <h3 className="font-semibold text-gray-900 mb-4">🧪 Enviar Email de Prueba</h3>
                  <form onSubmit={handleTestEmail} className="flex gap-3">
                    <Input
                      placeholder="email@prueba.com"
                      type="email"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                      className="flex-1"
                      disabled={sendingTest}
                    />
                    <Button
                      type="submit"
                      loading={sendingTest}
                      disabled={!testEmail.trim()}
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Enviar
                    </Button>
                  </form>
                </Card>
              )}

              {/* Información */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">ℹ️ Información</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Las notificaciones se envían automáticamente al crear pedidos</li>
                  <li>• Solo se notifica a usuarios y emails marcados como "Activo"</li>
                  <li>• Los emails del sistema se sincronizan automáticamente</li>
                  <li>• Los errores de email no afectan la funcionalidad del sistema</li>
                </ul>
              </div>
            </>
          ) : null}
        </div>
      </Modal>
    </>
  );
};

export default NotificationManager;