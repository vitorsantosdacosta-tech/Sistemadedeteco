import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { 
  Home, 
  Bell, 
  Wifi,
  Menu,
  X,
  Settings,
  Activity,
  Lock,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import mqtt from 'mqtt';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
  alertCount?: number;
  onAddAlert: (alert: any) => void;
  alertRules: any[];
}

export function Layout({ children, currentPage, onNavigate, alertCount = 0, onAddAlert, alertRules }: LayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [mqttClient, setMqttClient] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  // MQTT Settings
  const [mqttHost, setMqttHost] = useState(() => 
    localStorage.getItem('mqtt_host') || '192.168.0.19'
  );
  const [mqttPort, setMqttPort] = useState(() => 
    localStorage.getItem('mqtt_port') || '9001'
  );
  const [mqttTopic, setMqttTopic] = useState(() => 
    localStorage.getItem('mqtt_topic') || 'esp32/motion'
  );
  const [useSecure, setUseSecure] = useState(() => 
    localStorage.getItem('mqtt_secure') === 'true'
  );

  const navigation = [
    { id: 'home', label: 'Início', icon: Home },
    { id: 'alerts', label: 'Logs', icon: Bell, badge: alertCount > 0 ? alertCount : undefined },
    { id: 'config', label: 'Regras', icon: AlertTriangle },
  ];

  useEffect(() => {
    // Save settings to localStorage
    localStorage.setItem('mqtt_host', mqttHost);
    localStorage.setItem('mqtt_port', mqttPort);
    localStorage.setItem('mqtt_topic', mqttTopic);
    localStorage.setItem('mqtt_secure', useSecure.toString());
  }, [mqttHost, mqttPort, mqttTopic, useSecure]);

  const checkAlertRules = (mac: string, state: string) => {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    const matchingRules = alertRules.filter(rule => {
      if (!rule.enabled) return false;
      
      // Check MAC (empty means all devices)
      if (rule.mac && rule.mac.trim() !== '' && rule.mac !== mac) return false;
      
      // Check state
      if (rule.state !== state) return false;
      
      // Check time range
      if (currentTime < rule.startTime || currentTime > rule.endTime) return false;
      
      return true;
    });
    
    // Show alert for each matching rule
    matchingRules.forEach(rule => {
      toast.error(`🚨 ${rule.name}`, {
        description: `Dispositivo: ${mac} - Estado: ${getStateLabel(state)}`,
        duration: 5000,
      });
    });
    
    return matchingRules.length > 0;
  };

  const getStateLabel = (state: string): string => {
    switch (state) {
      case 'move': return 'Movimento';
      case 'static': return 'Vazio';
      case 'someone': return 'Presença';
      default: return state;
    }
  };

  const connectMQTT = () => {
    try {
      // Disconnect if already connected
      if (mqttClient) {
        mqttClient.end();
      }

      // Use wss:// if secure mode is enabled, otherwise use ws://
      const protocol = useSecure ? 'wss://' : 'ws://';
      const url = `${protocol}${mqttHost}:${mqttPort}`;
      
      const client = mqtt.connect(url, {
        clientId: 'mqtt_client_' + Math.random().toString(16).substr(2, 8),
        clean: true,
        reconnectPeriod: 1000,
      });

      client.on('connect', () => {
        setIsConnected(true);
        toast.success('Conectado ao broker MQTT');
        
        client.subscribe(mqttTopic, (err) => {
          if (err) {
            toast.error('Erro ao se inscrever no tópico');
          } else {
            toast.success(`Inscrito no tópico: ${mqttTopic}`);
          }
        });
      });

      client.on('message', (topic, message) => {
        try {
          const data = JSON.parse(message.toString());
          
          // Validate message format
          if (data.mac && data.state) {
            const alert = {
              id: Date.now().toString(),
              mac: data.mac,
              state: data.state,
              timestamp: new Date().toISOString(),
              message: getStateMessage(data.state, data.mac)
            };
            
            onAddAlert(alert);
            
            // Show toast for important states
            if (data.state === 'move') {
              toast.info(`Movimento detectado - ${data.mac}`);
            }
            
            // Check alert rules
            checkAlertRules(data.mac, data.state);
          }
        } catch (err) {
          console.error('Erro ao processar mensagem MQTT:', err);
        }
      });

      client.on('error', (err) => {
        console.error('Erro MQTT:', err);
        toast.error('Erro na conexão MQTT');
        setIsConnected(false);
      });

      client.on('close', () => {
        setIsConnected(false);
        toast.warning('Desconectado do broker MQTT');
      });

      setMqttClient(client);
    } catch (err) {
      console.error('Erro ao conectar:', err);
      toast.error('Erro ao conectar ao broker MQTT');
    }
  };

  const disconnectMQTT = () => {
    if (mqttClient) {
      mqttClient.end();
      setMqttClient(null);
      setIsConnected(false);
      toast.info('Desconectado do broker MQTT');
    }
  };

  const getStateMessage = (state: string, mac: string): string => {
    switch (state) {
      case 'move':
        return `Presença com movimento detectada - ${mac}`;
      case 'static':
        return `Lugar vazio - ${mac}`;
      case 'someone':
        return `Alguém presente parado - ${mac}`;
      default:
        return `Estado desconhecido: ${state} - ${mac}`;
    }
  };

  const handleNavigation = (pageId: string) => {
    onNavigate(pageId);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className={`${isConnected ? 'bg-green-600' : 'bg-gray-600'} p-2 rounded-lg transition-colors`}>
                <Wifi className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  Sistema MQTT Monitor
                </h1>
                <p className="text-xs text-gray-600 hidden sm:block">
                  {isConnected ? 'Conectado' : 'Desconectado'}
                </p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-4">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                
                return (
                  <Button
                    key={item.id}
                    variant={isActive ? "default" : "ghost"}
                    size="sm"
                    onClick={() => handleNavigation(item.id)}
                    className="relative"
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.label}
                    {item.badge && (
                      <Badge 
                        variant="destructive" 
                        className="ml-2 px-1.5 py-0.5 text-xs"
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </Button>
                );
              })}
            </nav>

            {/* Settings Button */}
            <div className="flex items-center gap-2">
              <Button 
                variant={showSettings ? "default" : "ghost"}
                size="sm" 
                onClick={() => setShowSettings(!showSettings)}
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:ml-2 sm:inline">Configurações</span>
              </Button>

              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t bg-white">
            <div className="px-4 py-2 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                
                return (
                  <Button
                    key={item.id}
                    variant={isActive ? "default" : "ghost"}
                    size="sm"
                    onClick={() => handleNavigation(item.id)}
                    className="w-full justify-start relative"
                  >
                    <Icon className="w-4 h-4 mr-3" />
                    {item.label}
                    {item.badge && (
                      <Badge 
                        variant="destructive" 
                        className="ml-auto px-1.5 py-0.5 text-xs"
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </Button>
                );
              })}
            </div>
          </div>
        )}

        {/* Settings Panel */}
        {showSettings && (
          <div className="border-t bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="bg-white rounded-lg p-4 border">
                <h3 className="font-semibold mb-4">Configurações MQTT</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <Label htmlFor="mqtt-host">Broker IP</Label>
                    <Input
                      id="mqtt-host"
                      value={mqttHost}
                      onChange={(e) => setMqttHost(e.target.value)}
                      placeholder="192.168.0.19"
                      disabled={isConnected}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="mqtt-port">Porta WebSocket</Label>
                    <Input
                      id="mqtt-port"
                      value={mqttPort}
                      onChange={(e) => setMqttPort(e.target.value)}
                      placeholder="9001"
                      disabled={isConnected}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="mqtt-topic">Tópico</Label>
                    <Input
                      id="mqtt-topic"
                      value={mqttTopic}
                      onChange={(e) => setMqttTopic(e.target.value)}
                      placeholder="esp32/motion"
                      disabled={isConnected}
                    />
                  </div>
                </div>

                {/* Secure connection checkbox */}
                <div className="mb-4 p-3 border rounded-lg bg-gray-50">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="mqtt-secure"
                      checked={useSecure}
                      onCheckedChange={(checked) => setUseSecure(checked === true)}
                      disabled={isConnected}
                    />
                    <div className="flex-1">
                      <Label 
                        htmlFor="mqtt-secure" 
                        className="cursor-pointer flex items-center gap-2"
                      >
                        <Lock className="w-4 h-4" />
                        Usar conexão segura (WSS)
                      </Label>
                      <p className="text-xs text-gray-600 mt-1">
                        {useSecure 
                          ? 'A conexão usará WSS (WebSocket Secure). Necessário se a página estiver em HTTPS.' 
                          : 'A conexão usará WS (WebSocket não seguro). Só funciona em HTTP ou localhost.'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                  {!isConnected ? (
                    <Button onClick={connectMQTT} className="w-full sm:w-auto">
                      <Activity className="w-4 h-4 mr-2" />
                      Conectar
                    </Button>
                  ) : (
                    <Button onClick={disconnectMQTT} variant="destructive" className="w-full sm:w-auto">
                      <X className="w-4 h-4 mr-2" />
                      Desconectar
                    </Button>
                  )}
                  
                  <p className="text-sm text-gray-600">
                    {isConnected 
                      ? `Conectado a ${useSecure ? 'wss' : 'ws'}://${mqttHost}:${mqttPort}` 
                      : 'Aguardando conexão'}
                  </p>
                </div>

                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-900">
                    <strong>Formato esperado:</strong> {`{"mac":"AA:BB:CC:DD:EE:FF","state":"move"}`}
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    Estados: <strong>move</strong> (movimento), <strong>static</strong> (vazio), <strong>someone</strong> (parado)
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
}