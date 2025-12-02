# 🌐 Sistema MQTT ESP32 Monitor

Sistema completo de monitoramento em tempo real para sensores ESP32 via MQTT, com interface web React e sistema de alertas personalizáveis.

![Status](https://img.shields.io/badge/status-production-green)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)

---

## 🚀 Instalação Rápida

```bash
# 1. Verificar ambiente
npm run check

# 2. Instalar dependências
npm install

# 3. Rodar o sistema
npm run dev
```

**Pronto!** Acesse: `http://localhost:3000`

---

## ✨ Funcionalidades

- ✅ **Monitoramento em Tempo Real** via MQTT WebSocket
- ✅ **Dashboard Interativo** com estatísticas e gráficos
- ✅ **Sistema de Alertas** com regras personalizáveis por horário
- ✅ **Logs Completos** de todos os eventos
- ✅ **Multi-dispositivos** suporta múltiplos ESP32
- ✅ **Responsivo** funciona em desktop e mobile
- ✅ **Auto-detecção** de broker localhost
- ✅ **Sem Backend** tudo funciona no frontend

---

## 📋 Pré-requisitos

- Node.js 18+
- Mosquitto MQTT Broker com WebSocket (porta 9001)
- ESP32 com sensor de movimento (opcional para testes)

---

## 📖 Documentação

- **[QUICK_START.md](QUICK_START.md)** - Início rápido em 3 minutos
- **[INSTALACAO_COMPLETA.md](INSTALACAO_COMPLETA.md)** - Guia detalhado passo a passo
- **[README_INSTALACAO.md](README_INSTALACAO.md)** - Documentação técnica completa

---

## 🎮 Testando o Sistema

### Com script automático:
```bash
npm run test-mqtt
```

### Manual com mosquitto_pub:
```bash
mosquitto_pub -h localhost -t esp32/motion -m '{"mac":"AA:BB:CC","state":"move"}'
```

---

## 📱 Formato de Mensagem

```json
{
  "mac": "AA:BB:CC:DD:EE:FF",
  "state": "move"
}
```

### Estados suportados:
- `move` - Movimento detectado
- `static` - Lugar vazio  
- `someone` - Presença parada

---

## 🏗️ Arquitetura

```
Frontend (React + Vite)
    ↓ WebSocket (ws://localhost:9001)
Mosquitto Broker
    ↑ MQTT TCP (mqtt://localhost:1883)
ESP32 Sensores
```

---

## 🔧 Configuração do Mosquitto

Adicione ao `/etc/mosquitto/mosquitto.conf`:

```conf
listener 1883
protocol mqtt

listener 9001
protocol websockets

allow_anonymous true
```

Reinicie:
```bash
sudo systemctl restart mosquitto
```

---

## 📊 Stack Tecnológico

| Categoria | Tecnologia |
|-----------|------------|
| Frontend | React 18 + TypeScript |
| Build | Vite 5 |
| Styling | Tailwind CSS 3 |
| MQTT | MQTT.js |
| UI Components | Radix UI |
| Charts | Recharts |
| Icons | Lucide React |
| Notifications | Sonner |

---

## 🎯 Criando Regras de Alerta

1. Acesse a aba **Regras**
2. Clique em **Nova Regra**
3. Configure:
   - Nome da regra
   - MAC do dispositivo (ou vazio para todos)
   - Estado do sensor
   - Horário de monitoramento
4. Ative a regra

Quando as condições forem atendidas, você receberá alertas visuais na tela! 🚨

---

## 📝 Comandos Disponíveis

```bash
npm run dev          # Desenvolvimento (porta 3000)
npm run build        # Build de produção
npm run preview      # Preview da build
npm run check        # Verificar ambiente
npm run test-mqtt    # Enviar mensagens de teste
npm run server       # Servidor Node.js exemplo
```

---

## 🌐 Usando em Rede Local

Para acessar de outros dispositivos:

1. Descubra seu IP: `ip addr` ou `ifconfig`
2. Configure Vite para aceitar conexões externas:
   ```typescript
   // vite.config.ts
   server: {
     host: '0.0.0.0',
     port: 3000
   }
   ```
3. Acesse de outro dispositivo: `http://192.168.x.x:3000`

---

## 🐛 Troubleshooting

### CSS quebrado?
```bash
rm -rf node_modules package-lock.json
npm install
```

### MQTT não conecta?
```bash
sudo systemctl status mosquitto
sudo systemctl restart mosquitto
```

### WebSocket não funciona?
Verifique se tem no `mosquitto.conf`:
```conf
listener 9001
protocol websockets
```

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se livre para:

1. Fazer fork do projeto
2. Criar uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abrir um Pull Request

---

## 📄 Licença

Este projeto é open source e está disponível sob a licença MIT.

---

## 👨‍💻 Autor

Sistema desenvolvido para monitoramento de sensores ESP32 via MQTT.

---

## 🙏 Agradecimentos

- Eclipse Mosquitto
- React Team
- Vite Team
- Tailwind CSS
- Radix UI

---

## 📞 Suporte

Problemas? Consulte:
1. [INSTALACAO_COMPLETA.md](INSTALACAO_COMPLETA.md) - Guia detalhado
2. Logs do navegador (F12 → Console)
3. Logs do Mosquitto: `sudo journalctl -u mosquitto -f`

---

**⭐ Se este projeto foi útil, considere dar uma estrela!**

