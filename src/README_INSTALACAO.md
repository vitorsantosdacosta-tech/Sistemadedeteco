# Sistema de Monitoramento MQTT ESP32

Sistema de monitoramento em tempo real para sensores de presença ESP32 via MQTT.

## 🚀 Instalação e Execução

### Requisitos
- Node.js 18+ 
- npm ou yarn
- Broker MQTT (Mosquitto) configurado com WebSocket na porta 9001

### Instalação

```bash
# Instalar dependências
npm install

# Executar em modo desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview da build de produção
npm run preview
```

O sistema será aberto automaticamente em `http://localhost:3000`

## 📡 Configuração do Broker MQTT

### Mosquitto com WebSocket

Adicione ao arquivo `mosquitto.conf`:

```
# Porta TCP padrão
listener 1883
protocol mqtt

# Porta WebSocket para navegador
listener 9001
protocol websockets

# Permitir conexões anônimas (ajuste conforme necessário)
allow_anonymous true
```

Reinicie o Mosquitto:
```bash
sudo systemctl restart mosquitto
```

## 🔧 Configuração no Sistema

1. Acesse **Configurações** no header
2. Configure:
   - **Broker IP**: IP do broker Mosquitto (ex: 192.168.0.19)
   - **Porta WebSocket**: 9001 (padrão para WebSocket)
   - **Tópico**: esp32/motion (ou seu tópico personalizado)
   - **Conexão Segura**: Marque se estiver usando HTTPS
3. Clique em **Conectar**

## 📋 Formato das Mensagens MQTT

O sistema espera mensagens JSON no seguinte formato:

```json
{
  "mac": "AA:BB:CC:DD:EE:FF",
  "state": "move"
}
```

### Estados disponíveis:
- `move`: Presença com movimento detectada
- `static`: Lugar vazio
- `someone`: Alguém presente parado

### Exemplo de publicação manual (teste):

```bash
mosquitto_pub -h 192.168.0.19 -t esp32/motion -m '{"mac":"AA:BB:CC:DD:EE:FF","state":"move"}'
```

## 🚨 Configuração de Alertas

1. Acesse a aba **Regras**
2. Clique em **Nova Regra**
3. Configure:
   - **Nome**: Nome descritivo da regra
   - **MAC do Dispositivo**: MAC específico ou vazio para todos
   - **Estado do Sensor**: Qual estado deve acionar o alerta
   - **Horário**: Período em que a regra está ativa
4. Salve a regra

### Exemplo de Regra:
- Nome: "Movimento Noturno"
- MAC: AA:BB:CC:DD:EE:FF
- Estado: Movimento
- Horário: 22:00 às 06:00

Quando o ESP32 com MAC AA:BB:CC:DD:EE:FF enviar estado "move" entre 22h e 6h, um alerta vermelho aparecerá na tela.

## 📱 Funcionalidades

### Página Inicial (Home)
- Resumo de eventos (total, dispositivos, movimentos, presenças)
- Últimos 5 eventos recentes
- Lista de dispositivos únicos detectados
- Estatísticas em tempo real

### Logs (Alerts)
- Histórico completo de todos os eventos
- Filtros por tipo de evento
- Busca por MAC
- Limpeza de logs
- **Nota**: Logs são armazenados apenas durante a sessão

### Regras de Alerta
- Criar regras personalizadas
- Filtro por dispositivo, estado e horário
- Ativar/desativar regras
- Editar e excluir regras
- Alertas visuais em tempo real

## 🔐 Notas de Segurança

### HTTP vs HTTPS
- **HTTP/Localhost**: Use WebSocket normal (WS)
- **HTTPS**: Marque "Usar conexão segura (WSS)" e configure certificado SSL no Mosquitto

### WebSocket Seguro (WSS)
Se sua aplicação estiver em HTTPS, configure o Mosquitto com SSL:

```
listener 9001
protocol websockets
cafile /etc/mosquitto/certs/ca.crt
certfile /etc/mosquitto/certs/server.crt
keyfile /etc/mosquitto/certs/server.key
```

## 💾 Armazenamento

- **Logs de eventos**: Armazenados apenas na sessão (memória)
- **Regras de alerta**: Salvos no localStorage do navegador
- **Configurações MQTT**: Salvos no localStorage do navegador

**Importante**: Recarregar a página limpa todos os logs, mas mantém regras e configurações.

## 🛠️ Tecnologias Utilizadas

- React 18
- TypeScript
- Vite
- Tailwind CSS 4
- MQTT.js
- Radix UI
- Lucide Icons
- Sonner (toasts)
- Recharts

## 📝 Estrutura do Projeto

```
/
├── components/
│   ├── AlertConfigPage.tsx    # Página de configuração de regras
│   ├── AlertsPage.tsx          # Página de logs
│   ├── HomePage.tsx            # Dashboard principal
│   ├── Layout.tsx              # Layout com header e conexão MQTT
│   └── ui/                     # Componentes UI reutilizáveis
├── styles/
│   └── globals.css             # Estilos globais + Tailwind
├── App.tsx                     # Componente principal
├── main.tsx                    # Entry point
├── index.html                  # HTML base
└── package.json                # Dependências

## 🐛 Troubleshooting

### Erro: "Failed to construct 'WebSocket'"
- **Solução**: Marque a opção "Usar conexão segura (WSS)" se estiver em HTTPS, ou acesse via HTTP

### Não recebe mensagens MQTT
- Verifique se o broker está rodando: `sudo systemctl status mosquitto`
- Confirme se a porta WebSocket (9001) está aberta
- Teste com `mosquitto_pub` manualmente
- Verifique o tópico configurado

### Alertas não disparam
- Verifique se a regra está **ativada**
- Confirme se o MAC corresponde exatamente
- Verifique se está dentro do horário configurado
- Observe o console do navegador para erros

## 📞 Suporte

Para problemas ou dúvidas, verifique:
1. Logs do console do navegador (F12)
2. Logs do Mosquitto: `sudo journalctl -u mosquitto -f`
3. Conectividade de rede entre dispositivos
