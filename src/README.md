# Sistema de Monitoramento MQTT ESP32

Sistema simplificado de monitoramento em tempo real de sensores de presença ESP32 via MQTT local.

## 📋 Visão Geral

Este sistema permite monitorar sensores ESP32 que detectam presença e movimento através de um broker MQTT local. Todos os dados são armazenados temporariamente apenas durante a sessão atual, sem necessidade de banco de dados ou autenticação.

## ✨ Características Principais

- ✅ **Conexão MQTT Local**: Conecta diretamente a um broker MQTT na mesma rede
- ✅ **Monitoramento em Tempo Real**: Recebe e exibe eventos instantaneamente
- ✅ **Armazenamento Temporário**: Dados mantidos apenas durante a sessão
- ✅ **Interface Responsiva**: Funciona em desktop e mobile
- ✅ **Exportação de Dados**: Exporta logs em JSON ou CSV
- ✅ **Sem Autenticação**: Sistema simples e direto

## 🎯 Estados de Detecção

O sistema reconhece três estados enviados pelos sensores ESP32:

- **move**: Presença com movimento detectado
- **static**: Local vazio, sem presença
- **someone**: Alguém presente, mas parado

## 📊 Formato das Mensagens MQTT

Os sensores ESP32 devem enviar mensagens no seguinte formato JSON:

```json
{"mac":"AA:BB:CC:DD:EE:FF","state":"move"}
```

Onde:
- `mac`: Endereço MAC do sensor ESP32
- `state`: Um dos estados: `move`, `static` ou `someone`

## 🔧 Configuração

### Requisitos

1. **Broker MQTT** configurado na rede local com suporte WebSocket
2. **Sensores ESP32** programados para enviar mensagens no formato esperado

### Configuração do Broker MQTT

O sistema usa as seguintes configurações padrão (todas editáveis na interface):

- **Host**: `192.168.0.19`
- **Porta WebSocket**: `9001`
- **Tópico**: `esp32/motion`

### Configuração do Mosquitto

Para usar o Mosquitto como broker MQTT, adicione ao arquivo `mosquitto.conf`:

```conf
# Porta padrão MQTT
listener 1883

# WebSocket para conexão do navegador
listener 9001
protocol websockets

# Permitir conexões anônimas (ajuste conforme sua necessidade de segurança)
allow_anonymous true
```

Reinicie o Mosquitto:
```bash
sudo systemctl restart mosquitto
```

## 🚀 Como Usar

### 1. Iniciar o Sistema

Abra a aplicação no navegador. A interface será carregada automaticamente.

### 2. Conectar ao Broker MQTT

1. Clique no botão **Configurações** no canto superior direito
2. Configure o IP do broker, porta e tópico (se diferente do padrão)
3. Clique em **Conectar**
4. Aguarde a confirmação da conexão

### 3. Monitorar Eventos

- Os eventos aparecem em tempo real na página inicial
- Acesse **Logs** para ver o histórico completo da sessão
- Use os filtros para buscar eventos específicos

### 4. Exportar Dados

Na página de Logs:
- Clique em **JSON** para exportar em formato JSON
- Clique em **CSV** para exportar em formato CSV
- Clique em **Limpar** para remover todos os logs

## 📱 Interface

### Página Inicial
- Resumo de estatísticas da sessão
- Últimos 5 eventos recebidos
- Lista de dispositivos detectados
- Indicador de conexão MQTT

### Página de Logs
- Histórico completo de eventos
- Busca por MAC ou mensagem
- Filtros por estado (move/static/someone)
- Exportação de dados
- Estatísticas detalhadas

## 🧪 Testar o Sistema

### Com Mosquitto Publish

Você pode testar o sistema enviando mensagens manualmente:

```bash
# Enviar evento de movimento
mosquitto_pub -h 192.168.0.19 -t esp32/motion -m '{"mac":"AA:BB:CC:DD:EE:FF","state":"move"}'

# Enviar evento de local vazio
mosquitto_pub -h 192.168.0.19 -t esp32/motion -m '{"mac":"AA:BB:CC:DD:EE:FF","state":"static"}'

# Enviar evento de presença parada
mosquitto_pub -h 192.168.0.19 -t esp32/motion -m '{"mac":"AA:BB:CC:DD:EE:FF","state":"someone"}'
```

### Monitorar Mensagens

Para verificar se as mensagens estão sendo enviadas:

```bash
mosquitto_sub -h 192.168.0.19 -t esp32/motion
```

## 🔒 Segurança

⚠️ **Importante**: Este sistema é destinado para uso em redes locais confiáveis.

- Não há autenticação de usuários
- Dados são temporários e não persistentes
- Configure o firewall para bloquear acesso externo ao broker MQTT
- Use VPN se precisar acessar remotamente

## 🛠️ Tecnologias

- **React** - Interface do usuário
- **Tailwind CSS** - Estilização
- **mqtt.js** - Cliente MQTT para navegador
- **Lucide React** - Ícones
- **Sonner** - Notificações toast

## 📝 Estrutura do Projeto

```
/
├── App.tsx                 # Componente principal
├── components/
│   ├── Layout.tsx         # Layout com header e conexão MQTT
│   ├── HomePage.tsx       # Página inicial com resumo
│   └── AlertsPage.tsx     # Página de logs completos
└── styles/
    └── globals.css        # Estilos globais
```

## ⚙️ Programação do ESP32

Exemplo básico de código para ESP32 (Arduino):

```cpp
#include <WiFi.h>
#include <PubSubClient.h>

const char* ssid = "SUA_REDE";
const char* password = "SUA_SENHA";
const char* mqtt_server = "192.168.0.19";
const char* mqtt_topic = "esp32/motion";

WiFiClient espClient;
PubSubClient client(espClient);

void setup() {
  Serial.begin(115200);
  
  // Conectar WiFi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  // Configurar MQTT
  client.setServer(mqtt_server, 1883);
  
  // Conectar MQTT
  while (!client.connected()) {
    if (client.connect("ESP32Client")) {
      Serial.println("MQTT conectado");
    }
  }
}

void loop() {
  if (!client.connected()) {
    // Reconectar se necessário
  }
  
  client.loop();
  
  // Detectar movimento (exemplo simplificado)
  bool movement = detectMovement(); // Sua lógica aqui
  
  String mac = WiFi.macAddress();
  String state = movement ? "move" : "static";
  String payload = "{\"mac\":\"" + mac + "\",\"state\":\"" + state + "\"}";
  
  client.publish(mqtt_topic, payload.c_str());
  
  delay(1000); // Aguardar 1 segundo
}
```

## 📄 Licença

Este projeto é fornecido como está, sem garantias de qualquer tipo.

## 🤝 Contribuições

Sugestões e melhorias são bem-vindas!

---

**Nota**: Este sistema armazena dados apenas durante a sessão. Ao recarregar a página, todos os logs são perdidos.
