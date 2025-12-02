import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { 
  Bell, 
  Trash2, 
  Search,
  Filter,
  Clock,
  Wifi,
  Download
} from 'lucide-react';

interface AlertsPageProps {
  alerts: any[];
  onClearAlerts: () => void;
}

export function AlertsPage({ alerts, onClearAlerts }: AlertsPageProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterState, setFilterState] = useState<string>('all');

  const getStateColor = (state: string) => {
    switch (state) {
      case 'move':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'static':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'someone':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStateLabel = (state: string) => {
    switch (state) {
      case 'move':
        return 'Movimento';
      case 'static':
        return 'Vazio';
      case 'someone':
        return 'Presença';
      default:
        return state;
    }
  };

  // Filter alerts
  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = 
      alert.mac.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.message.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = 
      filterState === 'all' || alert.state === filterState;
    
    return matchesSearch && matchesFilter;
  });

  const exportToJSON = () => {
    const dataStr = JSON.stringify(alerts, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mqtt-logs-${new Date().toISOString()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportToCSV = () => {
    const headers = ['Timestamp', 'MAC', 'State', 'Message'];
    const rows = alerts.map(alert => [
      new Date(alert.timestamp).toISOString(),
      alert.mac,
      alert.state,
      alert.message
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const dataBlob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mqtt-logs-${new Date().toISOString()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Logs de Eventos</h1>
          <p className="text-gray-600">
            Histórico completo de eventos da sessão atual
          </p>
        </div>
        
        {alerts.length > 0 && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportToJSON}>
              <Download className="w-4 h-4 mr-2" />
              JSON
            </Button>
            <Button variant="outline" size="sm" onClick={exportToCSV}>
              <Download className="w-4 h-4 mr-2" />
              CSV
            </Button>
            <Button variant="destructive" size="sm" onClick={onClearAlerts}>
              <Trash2 className="w-4 h-4 mr-2" />
              Limpar
            </Button>
          </div>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Buscar por MAC ou mensagem..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* State Filter */}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={filterState === 'all' ? 'default' : 'outline'}
                onClick={() => setFilterState('all')}
              >
                Todos
              </Button>
              <Button
                size="sm"
                variant={filterState === 'move' ? 'default' : 'outline'}
                onClick={() => setFilterState('move')}
              >
                Movimento
              </Button>
              <Button
                size="sm"
                variant={filterState === 'static' ? 'default' : 'outline'}
                onClick={() => setFilterState('static')}
              >
                Vazio
              </Button>
              <Button
                size="sm"
                variant={filterState === 'someone' ? 'default' : 'outline'}
                onClick={() => setFilterState('someone')}
              >
                Presença
              </Button>
            </div>
          </div>

          {/* Results Count */}
          <div className="mt-3 text-sm text-gray-600">
            Mostrando {filteredAlerts.length} de {alerts.length} evento(s)
          </div>
        </CardContent>
      </Card>

      {/* Alerts List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Eventos Registrados
          </CardTitle>
          <CardDescription>
            Lista completa de todos os eventos MQTT recebidos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredAlerts.length > 0 ? (
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {filteredAlerts.map((alert, index) => (
                <div
                  key={alert.id}
                  className="p-3 rounded-lg border bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-mono text-gray-500">
                          #{alerts.length - index}
                        </span>
                        <Badge className={getStateColor(alert.state)}>
                          {getStateLabel(alert.state)}
                        </Badge>
                        <span className="text-xs text-gray-600 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(alert.timestamp).toLocaleString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                          })}
                        </span>
                      </div>
                      
                      <p className="text-sm font-medium text-gray-900 mb-1">
                        {alert.message}
                      </p>
                      
                      <div className="flex items-center gap-4 text-xs text-gray-600">
                        <span className="flex items-center gap-1">
                          <Wifi className="w-3 h-3" />
                          MAC: <code className="font-mono bg-gray-200 px-1 rounded">{alert.mac}</code>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Bell className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 mb-2">
                {searchTerm || filterState !== 'all' 
                  ? 'Nenhum evento encontrado com os filtros aplicados' 
                  : 'Nenhum evento registrado'}
              </p>
              <p className="text-sm text-gray-500">
                {searchTerm || filterState !== 'all'
                  ? 'Tente ajustar os filtros de busca'
                  : 'Conecte-se ao broker MQTT para começar a receber eventos'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistics */}
      {alerts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Eventos com Movimento</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {alerts.filter(a => a.state === 'move').length}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Locais Vazios</p>
                <p className="text-2xl font-bold text-green-600">
                  {alerts.filter(a => a.state === 'static').length}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Presenças Detectadas</p>
                <p className="text-2xl font-bold text-blue-600">
                  {alerts.filter(a => a.state === 'someone').length}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
