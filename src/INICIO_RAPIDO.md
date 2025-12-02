# 🚀 Início Rápido - Sistema MQTT ESP32

## Configuração em 5 Minutos

### 1️⃣ Instalar e Configurar Mosquitto

#### No Ubuntu/Debian:
```bash
# Instalar Mosquitto
sudo apt update
sudo apt install mosquitto mosquitto-clients

# Editar configuração
sudo nano /etc/mosquitto/mosquitto.conf
```

Adicione estas linhas ao arquivo:
```conf
listener 1883
listener 9001
protocol websockets
allow_anonymous true
```

```bash
# Reiniciar serviço
sudo systemctl restart mosquitto
sudo systemctl enable mosquitto
```

#### No Windows:
1. Baixe o instalador em: https://mosquitto.org/download/
2. Instale o Mosquitto
3. Edite `C:\Program Files\mosquitto\mosquitto.conf`
4. Adicione as mesmas configurações acima
5. Reinicie o serviço Mosquitto

### 2️⃣ Testar a Conexão

```bash
# Em um terminal, monitore as mensagens
mosquitto_sub -h localhost -t esp32/motion

# Em outro terminal, envie uma mensagem de teste
mosquitto_pub -h localhost -t esp32/motion -m '{"mac":"AA:BB:CC:DD:EE:FF","state":"move"}'
```

Se você ver a mensagem no primeiro terminal, está funcionando! ✅

### 3️⃣ Abrir a Aplicação

1. Abra a aplicação no navegador
2. Clique em **Configurações** (ícone de engrenagem)
3. Configure:
   - **Broker IP**: `192.168.0.19` (ou `localhost` se estiver testando no mesmo PC)
   - **Porta WebSocket**: `9001`
   - **Tópico**: `esp32/motion`
4. Clique em **Conectar**

### 4️⃣ Verificar Funcionamento

Envie mensagens de teste e veja aparecerem na interface:

```bash
# Movimento detectado
mosquitto_pub -h 192.168.0.19 -t esp32/motion -m '{"mac":"ESP32_001","state":"move"}'

# Local vazio
mosquitto_pub -h 192.168.0.19 -t esp32/motion -m '{"mac":"ESP32_001","state":"static"}'

# Presença parada
mosquitto_pub -h 192.168.0.19 -t esp32/motion -m '{"mac":"ESP32_001","state":"someone"}'
```

## 📱 Configuração do ESP32

### Código Básico Arduino/ESP32

```cpp
#include <WiFi.h>
#include <PubSubClient.h>

// Configurações WiFi
const char* ssid = "SUA_REDE_WIFI";
const char* password = "SUA_SENHA_WIFI";

// Configurações MQTT
const char* mqtt_server = "192.168.0.19";  // IP do seu broker
const int mqtt_port = 1883;
const char* mqtt_topic = "esp32/motion";

// Pino do sensor PIR
const int PIR_PIN = 4;  // Ajuste conforme seu hardware

WiFiClient espClient;
PubSubClient client(espClient);

void setup() {
  Serial.begin(115200);
  pinMode(PIR_PIN, INPUT);
  
  // Conectar WiFi
  Serial.print("Conectando ao WiFi");
  WiFi.begin(ssid, password);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println("\nWiFi conectado!");
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());
  Serial.print("MAC: ");
  Serial.println(WiFi.macAddress());
  
  // Configurar MQTT
  client.setServer(mqtt_server, mqtt_port);
  
  // Conectar ao broker MQTT
  conectarMQTT();
}

void conectarMQTT() {
  while (!client.connected()) {
    Serial.print("Conectando ao MQTT...");
    
    String clientId = "ESP32-" + WiFi.macAddress();
    
    if (client.connect(clientId.c_str())) {
      Serial.println("conectado!");
    } else {
      Serial.print("falhou, rc=");
      Serial.print(client.state());
      Serial.println(" tentando novamente em 5s");
      delay(5000);
    }
  }
}

void enviarEvento(String estado) {
  String mac = WiFi.macAddress();
  String payload = "{\"mac\":\"" + mac + "\",\"state\":\"" + estado + "\"}";
  
  if (client.publish(mqtt_topic, payload.c_str())) {
    Serial.println("Evento enviado: " + payload);
  } else {
    Serial.println("Falha ao enviar evento");
  }
}

void loop() {
  // Manter conexão MQTT
  if (!client.connected()) {
    conectarMQTT();
  }
  client.loop();
  
  // Ler sensor PIR
  int movimento = digitalRead(PIR_PIN);
  
  if (movimento == HIGH) {
    enviarEvento("move");
    Serial.println("Movimento detectado!");
    delay(2000);  // Evitar spam de mensagens
  } else {
    enviarEvento("static");
    delay(5000);  // Checar a cada 5 segundos
  }
}
```

### Bibliotecas Necessárias

No Arduino IDE, instale:
1. **PubSubClient** by Nick O'Leary
   - Menu: Sketch → Include Library → Manage Libraries
   - Busque por "PubSubClient"
   - Instale a versão mais recente

### Pinagem Sugerida (Sensor PIR)

```
ESP32          Sensor PIR
-----          ----------
3.3V    <-->   VCC
GND     <-->   GND
GPIO4   <-->   OUT
```

## 🔍 Troubleshooting

### Problema: Não conecta ao MQTT

**Solução:**
```bash
# Verificar se Mosquitto está rodando
sudo systemctl status mosquitto

# Ver logs do Mosquitto
sudo tail -f /var/log/mosquitto/mosquitto.log

# Testar porta WebSocket
telnet 192.168.0.19 9001
```

### Problema: ESP32 não conecta

**Soluções:**
1. Verifique se o ESP32 está na mesma rede WiFi
2. Confirme o IP do broker MQTT
3. Verifique o monitor serial para ver os erros
4. Teste a conectividade:
   ```bash
   ping [IP_DO_ESP32]
   ```

### Problema: Mensagens não aparecem na interface

**Soluções:**
1. Verifique se está conectado ao broker (indicador verde)
2. Confirme o tópico MQTT correto
3. Teste com mosquitto_pub manualmente
4. Verifique o console do navegador (F12) para erros

## 📊 Formato Correto das Mensagens

✅ **CORRETO:**
```json
{"mac":"AA:BB:CC:DD:EE:FF","state":"move"}
```

❌ **INCORRETO:**
```json
{mac:"AA:BB:CC:DD:EE:FF",state:"move"}  // Sem aspas nas chaves
{"MAC":"AA:BB:CC:DD:EE:FF","STATE":"move"}  // Maiúsculas
{"device":"AA:BB:CC:DD:EE:FF","status":"moving"}  // Nomes errados
```

## 🎯 Próximos Passos

1. ✅ Sistema funcionando com mensagens de teste
2. 📱 Programar ESP32 real
3. 🔌 Conectar sensor PIR ao ESP32
4. 🏠 Instalar sensores nos ambientes
5. 📊 Monitorar e ajustar conforme necessário

## 💡 Dicas

- Use MACs diferentes para identificar cada sensor
- Ajuste os delays no código ESP32 conforme necessidade
- Monitore o consumo de energia dos ESP32
- Considere usar deep sleep para economizar bateria
- Documente a localização de cada sensor

## 🆘 Precisa de Ajuda?

Comandos úteis para debug:

```bash
# Ver mensagens em tempo real
mosquitto_sub -h 192.168.0.19 -t esp32/motion -v

# Ver todas as mensagens de todos os tópicos
mosquitto_sub -h 192.168.0.19 -t '#' -v

# Verificar conexões ativas no broker
sudo netstat -tulpn | grep mosquitto
```

---

**Pronto!** Seu sistema deve estar funcionando agora. 🎉
