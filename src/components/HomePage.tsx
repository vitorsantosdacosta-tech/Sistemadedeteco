import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  Activity,
  AlertTriangle,
  Wifi,
  Bell,
  Clock,
  Radio,
} from "lucide-react";

interface HomePageProps {
  alerts: any[];
  onNavigate: (page: string) => void;
}

export function HomePage({ alerts, onNavigate }: HomePageProps) {
  const getStateColor = (state: string) => {
    switch (state) {
      case "move":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "static":
        return "bg-green-100 text-green-800 border-green-300";
      case "someone":
        return "bg-blue-100 text-blue-800 border-blue-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getStateLabel = (state: string) => {
    switch (state) {
      case "move":
        return "Movimento";
      case "static":
        return "Vazio";
      case "someone":
        return "Presença";
      default:
        return state;
    }
  };

  const recentAlerts = alerts.slice(0, 5);

  // Get unique MACs
  const uniqueMacs = [...new Set(alerts.map((a) => a.mac))];

  // Count states
  const moveCount = alerts.filter((a) => a.state === "move").length;
  const staticCount = alerts.filter((a) => a.state === "static").length;
  const someoneCount = alerts.filter((a) => a.state === "someone").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Motion Monitor
        </h1>
        <p className="text-gray-600">
          Monitoramento em tempo real de sensores de presença
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total de Eventos
                </p>
                <p className="text-2xl font-bold">{alerts.length}</p>
                <p className="text-xs text-gray-500 mt-1">Nesta sessão</p>
              </div>
              <Activity className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Dispositivos
                </p>
                <p className="text-2xl font-bold">{uniqueMacs.length}</p>
                <p className="text-xs text-gray-500 mt-1">MACs únicos</p>
              </div>
              <Wifi className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Movimentos</p>
                <p className="text-2xl font-bold">{moveCount}</p>
                <p className="text-xs text-gray-500 mt-1">Detectados</p>
              </div>
              <Radio className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Presenças</p>
                <p className="text-2xl font-bold">{someoneCount}</p>
                <p className="text-xs text-gray-500 mt-1">Registradas</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Eventos Recentes
          </CardTitle>
          <CardDescription>
            Últimos 5 eventos detectados pelos sensores
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentAlerts.length > 0 ? (
            <div className="space-y-3">
              {recentAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="p-3 rounded-lg border bg-gray-50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getStateColor(alert.state)}>
                          {getStateLabel(alert.state)}
                        </Badge>
                        <span className="text-xs text-gray-600">
                          {new Date(alert.timestamp).toLocaleString("pt-BR")}
                        </span>
                      </div>
                      <p className="text-sm font-medium">{alert.message}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        MAC: {alert.mac}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {alerts.length > 5 && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => onNavigate("alerts")}
                >
                  <Bell className="w-4 h-4 mr-2" />
                  Ver todos os eventos ({alerts.length})
                </Button>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Activity className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 mb-2">Nenhum evento registrado</p>
              <p className="text-sm text-gray-500">
                Conecte-se ao broker MQTT para começar a receber eventos
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Device List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wifi className="w-5 h-5" />
            Dispositivos Detectados
          </CardTitle>
          <CardDescription>
            Lista de MACs únicos detectados nesta sessão
          </CardDescription>
        </CardHeader>
        <CardContent>
          {uniqueMacs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {uniqueMacs.map((mac) => {
                const deviceAlerts = alerts.filter((a) => a.mac === mac);
                const lastAlert = deviceAlerts[0];

                return (
                  <div key={mac} className="p-3 bg-gray-50 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium">{mac}</p>
                      <Badge className={getStateColor(lastAlert.state)}>
                        {getStateLabel(lastAlert.state)}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600">
                      {deviceAlerts.length} evento(s) registrado(s)
                    </p>
                    <p className="text-xs text-gray-500">
                      Último:{" "}
                      {new Date(lastAlert.timestamp).toLocaleString("pt-BR")}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6">
              <Wifi className="w-10 h-10 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">
                Nenhum dispositivo detectado ainda
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Activity className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-blue-900 mb-1">
                Armazenamento Temporário
              </h3>
              <p className="text-sm text-blue-700">
                Todos os eventos são armazenados apenas durante a sessão atual.
                Ao recarregar a página, os dados serão perdidos.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
