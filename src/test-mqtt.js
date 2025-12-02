/**
 * Script de teste para enviar mensagens MQTT simuladas
 * Útil para testar o sistema sem hardware ESP32
 * 
 * Uso: node test-mqtt.js
 */

import mqtt from "mqtt";

const BROKER = "mqtt://192.168.0.19:1883";
const TOPIC = "esp32/motion";

// MACs de exemplo para teste
const TEST_MACS = [
  "AA:BB:CC:DD:EE:01",
  "AA:BB:CC:DD:EE:02",
  "AA:BB:CC:DD:EE:03"
];

// Estados possíveis
const STATES = ["move", "static", "someone"];

const client = mqtt.connect(BROKER);

client.on("connect", () => {
  console.log("✅ Conectado ao broker para testes\n");
  
  let count = 0;
  
  // Enviar mensagem de teste a cada 3 segundos
  const interval = setInterval(() => {
    const mac = TEST_MACS[Math.floor(Math.random() * TEST_MACS.length)];
    const state = STATES[Math.floor(Math.random() * STATES.length)];
    
    const message = JSON.stringify({ mac, state });
    
    client.publish(TOPIC, message, (err) => {
      if (err) {
        console.error("❌ Erro ao publicar:", err);
      } else {
        count++;
        console.log(`📤 [${count}] Publicado: ${message}`);
      }
    });
    
    // Parar após 20 mensagens
    if (count >= 20) {
      clearInterval(interval);
      setTimeout(() => {
        console.log("\n✅ Teste concluído!");
        client.end();
        process.exit(0);
      }, 1000);
    }
  }, 3000);
});

client.on("error", (err) => {
  console.error("❌ Erro de conexão:", err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log("\n👋 Encerrando teste...");
  client.end();
  process.exit(0);
});

console.log("🧪 Iniciando teste MQTT...");
console.log(`📡 Broker: ${BROKER}`);
console.log(`📋 Tópico: ${TOPIC}`);
console.log("⏱️  Enviando mensagem a cada 3 segundos\n");
