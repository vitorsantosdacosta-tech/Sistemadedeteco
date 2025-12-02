import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  Bell, 
  Plus, 
  Trash2,
  Clock,
  Wifi,
  AlertCircle
} from 'lucide-react';

interface AlertRule {
  id: string;
  name: string;
  mac: string;
  state: string;
  startTime: string;
  endTime: string;
  enabled: boolean;
}

interface AlertConfigPageProps {
  onSaveRules: (rules: AlertRule[]) => void;
  initialRules: AlertRule[];
}

export function AlertConfigPage({ onSaveRules, initialRules }: AlertConfigPageProps) {
  const [rules, setRules] = useState<AlertRule[]>(initialRules);
  const [editingRule, setEditingRule] = useState<AlertRule | null>(null);

  useEffect(() => {
    setRules(initialRules);
  }, [initialRules]);

  const createNewRule = (): AlertRule => ({
    id: Date.now().toString(),
    name: 'Nova Regra',
    mac: '',
    state: 'move',
    startTime: '00:00',
    endTime: '23:59',
    enabled: true
  });

  const handleAddRule = () => {
    const newRule = createNewRule();
    setEditingRule(newRule);
  };

  const handleSaveRule = () => {
    if (!editingRule) return;

    const existingIndex = rules.findIndex(r => r.id === editingRule.id);
    let updatedRules: AlertRule[];

    if (existingIndex >= 0) {
      updatedRules = [...rules];
      updatedRules[existingIndex] = editingRule;
    } else {
      updatedRules = [...rules, editingRule];
    }

    setRules(updatedRules);
    onSaveRules(updatedRules);
    setEditingRule(null);
  };

  const handleDeleteRule = (id: string) => {
    const updatedRules = rules.filter(r => r.id !== id);
    setRules(updatedRules);
    onSaveRules(updatedRules);
  };

  const handleToggleRule = (id: string) => {
    const updatedRules = rules.map(r => 
      r.id === id ? { ...r, enabled: !r.enabled } : r
    );
    setRules(updatedRules);
    onSaveRules(updatedRules);
  };

  const getStateLabel = (state: string) => {
    switch (state) {
      case 'move': return 'Movimento';
      case 'static': return 'Vazio';
      case 'someone': return 'Presença';
      default: return state;
    }
  };

  const getStateColor = (state: string) => {
    switch (state) {
      case 'move': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'static': return 'bg-green-100 text-green-800 border-green-300';
      case 'someone': return 'bg-blue-100 text-blue-800 border-blue-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Configuração de Alertas</h1>
          <p className="text-gray-600">
            Configure regras de alerta baseadas em dispositivo, estado e horário
          </p>
        </div>
        <Button onClick={handleAddRule}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Regra
        </Button>
      </div>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <AlertCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-blue-900 mb-1">Como funciona</h3>
              <p className="text-sm text-blue-700">
                Quando uma mensagem MQTT for recebida, o sistema verificará se ela corresponde 
                a alguma regra ativa. Se sim, um alerta visual será exibido na tela.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Rule Modal */}
      {editingRule && (
        <Card className="border-2 border-blue-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              {rules.find(r => r.id === editingRule.id) ? 'Editar Regra' : 'Nova Regra'}
            </CardTitle>
            <CardDescription>
              Configure quando e para quais dispositivos exibir alertas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="rule-name">Nome da Regra</Label>
              <Input
                id="rule-name"
                value={editingRule.name}
                onChange={(e) => setEditingRule({ ...editingRule, name: e.target.value })}
                placeholder="Ex: Alerta de Movimento Noturno"
              />
            </div>

            <div>
              <Label htmlFor="rule-mac">MAC do Dispositivo ESP32</Label>
              <Input
                id="rule-mac"
                value={editingRule.mac}
                onChange={(e) => setEditingRule({ ...editingRule, mac: e.target.value })}
                placeholder="Ex: AA:BB:CC:DD:EE:FF ou deixe vazio para todos"
              />
              <p className="text-xs text-gray-500 mt-1">
                Deixe vazio para monitorar todos os dispositivos
              </p>
            </div>

            <div>
              <Label htmlFor="rule-state">Estado do Sensor</Label>
              <Select
                value={editingRule.state}
                onValueChange={(value) => setEditingRule({ ...editingRule, state: value })}
              >
                <SelectTrigger id="rule-state">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="move">Movimento</SelectItem>
                  <SelectItem value="static">Vazio</SelectItem>
                  <SelectItem value="someone">Presença</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="rule-start">Horário Inicial</Label>
                <Input
                  id="rule-start"
                  type="time"
                  value={editingRule.startTime}
                  onChange={(e) => setEditingRule({ ...editingRule, startTime: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="rule-end">Horário Final</Label>
                <Input
                  id="rule-end"
                  type="time"
                  value={editingRule.endTime}
                  onChange={(e) => setEditingRule({ ...editingRule, endTime: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setEditingRule(null)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveRule}>
                Salvar Regra
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rules List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Regras Configuradas
          </CardTitle>
          <CardDescription>
            {rules.length} regra(s) de alerta configurada(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rules.length > 0 ? (
            <div className="space-y-3">
              {rules.map((rule) => (
                <div
                  key={rule.id}
                  className={`p-4 rounded-lg border ${
                    rule.enabled ? 'bg-white' : 'bg-gray-50 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium">{rule.name}</h3>
                        <Badge className={getStateColor(rule.state)}>
                          {getStateLabel(rule.state)}
                        </Badge>
                        {!rule.enabled && (
                          <Badge variant="outline" className="bg-gray-100">
                            Desativada
                          </Badge>
                        )}
                      </div>

                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Wifi className="w-4 h-4" />
                          <span>
                            {rule.mac || 'Todos os dispositivos'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>
                            {rule.startTime} às {rule.endTime}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingRule(rule)}
                      >
                        Editar
                      </Button>
                      <Button
                        variant={rule.enabled ? "outline" : "default"}
                        size="sm"
                        onClick={() => handleToggleRule(rule.id)}
                      >
                        {rule.enabled ? 'Desativar' : 'Ativar'}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteRule(rule.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Bell className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 mb-2">Nenhuma regra configurada</p>
              <p className="text-sm text-gray-500 mb-4">
                Clique em "Nova Regra" para começar
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
