# 📦 Instalação Completa - Sistema MQTT ESP32 Monitor

Este guia garante que você tenha um sistema 100% funcional em qualquer máquina.

---

## 🔧 Pré-requisitos

### 1. Node.js e npm
Instale Node.js versão 18 ou superior:

**Ubuntu/Debian:**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**Windows:**
- Baixe de: https://nodejs.org/
- Instale a versão LTS (18.x ou superior)

**MacOS:**
```bash
brew install node
```

Verifique a instalação:
```bash
node --version  # Deve mostrar v18.x.x ou superior
npm --version   # Deve mostrar 9.x.x ou superior
```

### 2. Mosquitto MQTT Broker

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install -y mosquitto mosquitto-clients
```

**Windows:**
- Baixe de: https://mosquitto.org/download/
- Instale o executável

**MacOS:**
```bash
brew install mosquitto
```

---

## 🚀 Instalação do Sistema

### Passo 1: Clone ou baixe o projeto
```bash
# Se você tem o projeto em um diretório
cd /caminho/para/mqtt-esp32-monitor
```

### Passo 2: Instale as dependências
```bash
npm install
```

Se houver erro com peer dependencies:
```bash
npm install --legacy-peer-deps
```

### Passo 3: Configure o Mosquitto

#### Linux/MacOS:

Edite o arquivo de configuração:
```bash
sudo nano /etc/mosquitto/mosquitto.conf
```

Adicione estas linhas:
```conf
# Porta TCP padrão (para Node.js e ESP32)
listener 1883
protocol mqtt

# Porta WebSocket (para o navegador)
listener 9001
protocol websockets

# Permitir conexões sem autenticação (ajuste conforme sua necessidade)
allow_anonymous true
```

Reinicie o Mosquitto:
```bash
sudo systemctl restart mosquitto
sudo systemctl enable mosquitto  # Inicia automaticamente no boot
```

Verifique se está rodando:
```bash
sudo systemctl status mosquitto
```

#### Windows:

1. Vá para: `C:\Program Files\mosquitto`
2. Crie/edite o arquivo `mosquitto.conf`
3. Adicione o conteúdo acima
4. Reinicie o serviço Mosquitto pelo Gerenciador de Serviços

---

## 🎮 Executando o Sistema

### Terminal 1: Iniciar o Frontend
```bash
npm run dev
```

O navegador abrirá automaticamente em: `http://localhost:3000`

### Primeira Configuração no Sistema

1. Clique em **Configurações** (ícone de engrenagem no header)
2. Configure:
   - **Broker IP**: 
     - `localhost` (se o broker está na mesma máquina)
     - `192.168.x.x` (se o broker está em outra máquina na rede)
   - **Porta WebSocket**: `9001`
   - **Tópico**: `esp32/motion`
   - **Conexão Segura**: Deixe DESMARCADO (para HTTP/localhost)
3. Clique em **Conectar**

Você deve ver "Conectado ao broker MQTT" ✅

---

## 🧪 Testando o Sistema

### Teste 1: Script Automático (Recomendado)

Em um segundo terminal:
```bash
npm run test-mqtt
```

Isso enviará 20 mensagens de teste automaticamente. Você verá:
- Logs aparecendo na aba "Logs"
- Contadores atualizando na aba "Início"
- Toasts de notificação

### Teste 2: Publicação Manual

```bash
# Teste de movimento
mosquitto_pub -h localhost -t esp32/motion -m '{"mac":"AA:BB:CC:DD:EE:01","state":"move"}'

# Teste de lugar vazio
mosquitto_pub -h localhost -t esp32/motion -m '{"mac":"AA:BB:CC:DD:EE:01","state":"static"}'

# Teste de presença parada
mosquitto_pub -h localhost -t esp32/motion -m '{"mac":"AA:BB:CC:DD:EE:01","state":"someone"}'
```

### Teste 3: Verificar MQTT diretamente

Terminal separado para ouvir mensagens:
```bash
mosquitto_sub -h localhost -t esp32/motion -v
```

---

## 📱 Configurando Regras de Alerta

1. Vá na aba **Regras**
2. Clique em **Nova Regra**
3. Exemplo de configuração:

```
Nome: Alerta de Movimento Noturno
MAC do Dispositivo: (deixe vazio para todos) ou AA:BB:CC:DD:EE:01
Estado: Movimento
Horário Início: 22:00
Horário Fim: 06:00
```

4. Clique em **Salvar Regra**
5. Certifique-se que a regra está **ATIVADA**

Agora teste:
```bash
mosquitto_pub -h localhost -t esp32/motion -m '{"mac":"AA:BB:CC:DD:EE:01","state":"move"}'
```

Se estiver dentro do horário configurado, você verá um alerta vermelho! 🚨

---

## 🔍 Verificando se tudo está funcionando

### Checklist:

- [ ] Node.js instalado (v18+)
- [ ] Mosquitto instalado e rodando
- [ ] WebSocket configurado na porta 9001
- [ ] `npm run dev` executando sem erros
- [ ] Sistema abre em http://localhost:3000
- [ ] Conectado ao broker MQTT (ícone verde no header)
- [ ] `npm run test-mqtt` envia mensagens com sucesso
- [ ] Mensagens aparecem na aba "Logs"
- [ ] Contadores atualizam na aba "Início"

---

## 🌐 Usando em Rede Local

Se você quiser acessar o sistema de outros dispositivos na mesma rede:

### 1. Descubra seu IP local

**Linux/MacOS:**
```bash
ip addr show | grep "inet "
# ou
ifconfig | grep "inet "
```

**Windows:**
```cmd
ipconfig
```

Procure por algo como: `192.168.1.100`

### 2. Configure o Vite para aceitar conexões externas

Edite `vite.config.ts`:
```typescript
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',  // Aceita conexões de qualquer IP
    port: 3000,
    open: true,
  },
});
```

### 3. Acesse de outro dispositivo

No outro dispositivo, acesse:
```
http://192.168.1.100:3000
```

**IMPORTANTE**: No sistema, configure o Broker IP como o IP da máquina que está rodando o Mosquitto (exemplo: `192.168.1.100`)

---

## 🐛 Solução de Problemas

### Erro: "EADDRINUSE: address already in use"
A porta 3000 já está em uso. Mate o processo ou mude a porta no `vite.config.ts`.

```bash
# Linux/MacOS
lsof -ti:3000 | xargs kill -9

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Erro: "Failed to construct 'WebSocket'"
- Se estiver em **HTTP/localhost**: DESMARQUE "Usar conexão segura (WSS)"
- Se estiver em **HTTPS**: MARQUE "Usar conexão segura (WSS)" e configure SSL no Mosquitto

### Erro: "Connection refused" ao conectar MQTT
```bash
# Verifique se Mosquitto está rodando
sudo systemctl status mosquitto

# Verifique se a porta 9001 está aberta
sudo netstat -tulpn | grep 9001

# Teste conexão local
mosquitto_pub -h localhost -t test -m "hello"
```

### Erro: CSS quebrado / Tailwind não funciona
```bash
# Limpe o cache e reinstale
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Mosquitto não aceita WebSocket
Certifique-se que a configuração tem:
```conf
listener 9001
protocol websockets
```

E NÃO apenas:
```conf
port 9001
```

---

## 📊 Arquitetura do Sistema

```
┌─────────────┐         WebSocket (9001)         ┌──────────────┐
│   Frontend  │ ←─────────────────────────────→ │  Mosquitto   │
│   (React)   │                                  │    Broker    │
└─────────────┘                                  └──────────────┘
                                                        ↑
                                                        │ TCP (1883)
                                                        │
                                                  ┌─────┴──────┐
                                                  │   ESP32    │
                                                  │  Sensores  │
                                                  └────────────┘
```

---

## 📝 Formato das Mensagens ESP32

Seus sensores ESP32 devem publicar no tópico `esp32/motion` com este formato:

```json
{
  "mac": "AA:BB:CC:DD:EE:FF",
  "state": "move"
}
```

### Estados válidos:
- `"move"` - Movimento detectado
- `"static"` - Lugar vazio
- `"someone"` - Alguém presente parado

### Exemplo de código ESP32 (Arduino):

```cpp
#include <WiFi.h>
#include <PubSubClient.h>

const char* ssid = "SUA_REDE";
const char* password = "SUA_SENHA";
const char* mqtt_server = "192.168.1.100";
const int mqtt_port = 1883;
const char* mqtt_topic = "esp32/motion";

WiFiClient espClient;
PubSubClient client(espClient);

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  client.setServer(mqtt_server, mqtt_port);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("WiFi conectado!");
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();
  
  // Detectou movimento? Publique
  String payload = "{\"mac\":\"" + WiFi.macAddress() + "\",\"state\":\"move\"}";
  client.publish(mqtt_topic, payload.c_str());
  
  delay(5000);
}

void reconnect() {
  while (!client.connected()) {
    if (client.connect("ESP32Client")) {
      Serial.println("Conectado ao MQTT!");
    } else {
      delay(5000);
    }
  }
}
```

---

## 🎓 Comandos Úteis

```bash
# Desenvolvimento
npm run dev              # Inicia servidor de desenvolvimento
npm run build            # Build de produção
npm run preview          # Preview da build

# MQTT
npm run test-mqtt        # Envia mensagens de teste
npm run server           # Servidor Node.js de exemplo (ouve MQTT)

# Mosquitto
sudo systemctl start mosquitto      # Inicia Mosquitto
sudo systemctl stop mosquitto       # Para Mosquitto
sudo systemctl restart mosquitto    # Reinicia Mosquitto
sudo systemctl status mosquitto     # Status do Mosquitto

# Publicar manualmente
mosquitto_pub -h localhost -t esp32/motion -m '{"mac":"TEST","state":"move"}'

# Escutar tópico
mosquitto_sub -h localhost -t esp32/motion -v

# Ver logs do Mosquitto
sudo journalctl -u mosquitto -f
```

---

## ✅ Sistema Pronto!

Agora você tem um sistema completo e funcional de monitoramento MQTT para sensores ESP32!

- ✅ Frontend React responsivo
- ✅ Conexão MQTT em tempo real
- ✅ Sistema de alertas com regras personalizáveis
- ✅ Logs de eventos
- ✅ Dashboard com estatísticas
- ✅ Funciona em qualquer máquina

**Dica**: Adicione o comando `npm run dev` no seu shell startup para iniciar automaticamente!

---

## 📞 Suporte

Se tiver problemas:
1. Verifique os logs do navegador (F12 → Console)
2. Verifique os logs do Mosquitto: `sudo journalctl -u mosquitto -f`
3. Teste a conexão com `mosquitto_pub` e `mosquitto_sub`
4. Verifique firewall e portas abertas
