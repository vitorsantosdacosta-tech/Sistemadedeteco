/**
 * Exemplo de servidor Node.js que ouve o broker MQTT
 * Este arquivo é apenas para referência e testes
 * O frontend usa WebSocket diretamente no navegador
 */

import mqtt from "mqtt";
import dotenv from "dotenv";

dotenv.config();

const MQTT_BROKER_URI = process.env.MQTT_BROKER_URI ?? "mqtt://192.168.0.19:1883";
const MQTT_TOPIC = process.env.MQTT_TOPIC ?? "esp32/motion";

const client = mqtt.connect(MQTT_BROKER_URI);

client.on("connect", () => {
  console.log(`✅ Conectado ao broker MQTT em ${MQTT_BROKER_URI}`);

  client.subscribe(MQTT_TOPIC, (err) => {
    if (err) {
      console.error("❌ Erro ao se inscrever no tópico:", err);
    } else {
      console.log(`📡 Inscrito no tópico: ${MQTT_TOPIC}`);
    }
  });
});

client.on("message", (topic, payload) => {
  const message = payload.toString();
  console.log(`📥 [${topic}] ${message}`);
  
  try {
    const data = JSON.parse(message);
    console.log(`   MAC: ${data.mac}`);
    console.log(`   Estado: ${data.state}`);
    console.log(`   Timestamp: ${new Date().toLocaleString('pt-BR')}`);
    console.log('---');
  } catch (err) {
    console.error("⚠️  Mensagem não é JSON válido");
  }
});

client.on("error", (err) => {
  console.error("❌ Erro MQTT:", err);
});

client.on("close", () => {
  console.log("⚠️  Desconectado do broker MQTT");
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log("\n👋 Encerrando conexão...");
  client.end();
  process.exit(0);
});
