# 🚀 Quick Start - Início Rápido

## Instalação em 3 passos

### 1️⃣ Verificar ambiente (opcional mas recomendado)
```bash
npm run check
```

Este comando verifica se tudo está instalado corretamente.

### 2️⃣ Instalar dependências
```bash
npm install
```

Se houver erro:
```bash
npm install --legacy-peer-deps
```

### 3️⃣ Rodar o sistema
```bash
npm run dev
```

O sistema abrirá automaticamente em `http://localhost:3000`

---

## ⚙️ Configuração Rápida

1. Clique em **Configurações** (ícone de engrenagem)
2. Configure:
   - **Broker IP**: `localhost` (auto-detectado)
   - **Porta**: `9001`
   - **Tópico**: `esp32/motion`
   - **Conexão Segura**: DESMARCADO
3. Clique em **Conectar**

✅ **Pronto!** Sistema conectado e monitorando.

---

## 🧪 Testar sem ESP32

### Opção 1: Script Automático (RECOMENDADO)
```bash
npm run test-mqtt
```

### Opção 2: Manual
```bash
mosquitto_pub -h localhost -t esp32/motion -m '{"mac":"AA:BB:CC","state":"move"}'
```

---

## 🔧 Configurar Mosquitto (Se necessário)

Edite `/etc/mosquitto/mosquitto.conf`:
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

## 📋 Comandos Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run check` | Verifica ambiente e dependências |
| `npm run dev` | Inicia servidor (porta 3000) |
| `npm run build` | Build de produção |
| `npm run test-mqtt` | Envia mensagens de teste |
| `npm run server` | Servidor Node.js de exemplo |

---

## 🎯 Criar Regra de Alerta

1. Aba **Regras** → **Nova Regra**
2. Configure:
   - Nome: `Movimento Noturno`
   - MAC: (vazio = todos)
   - Estado: `Movimento`
   - Horário: `22:00` até `06:00`
3. Salvar

Teste:
```bash
mosquitto_pub -h localhost -t esp32/motion -m '{"mac":"TEST","state":"move"}'
```

---

## 📱 Formato ESP32

```json
{
  "mac": "AA:BB:CC:DD:EE:FF",
  "state": "move"
}
```

**Estados**: `move`, `static`, `someone`

---

## 🐛 Problemas Comuns

### CSS quebrado
```bash
rm -rf node_modules package-lock.json
npm install
```

### Mosquitto não conecta
```bash
sudo systemctl status mosquitto
sudo systemctl restart mosquitto
```

### WebSocket não funciona
Certifique-se que tem no `mosquitto.conf`:
```conf
listener 9001
protocol websockets
```

---

## 📚 Documentação Completa

- `INSTALACAO_COMPLETA.md` - Guia detalhado
- `README_INSTALACAO.md` - Documentação técnica

---

## ✅ Checklist Rápido

- [ ] Node.js 18+ instalado
- [ ] `npm install` executado
- [ ] Mosquitto rodando
- [ ] WebSocket porta 9001 configurado
- [ ] `npm run dev` funcionando
- [ ] Sistema conectado ao broker
- [ ] `npm run test-mqtt` envia mensagens

**Tudo OK?** Você está pronto! 🎉
