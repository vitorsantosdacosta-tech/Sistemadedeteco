# 🚀 Quick Start - Início Rápido

## Instalação em 3 passos

### 1️⃣ Instalar dependências
```bash
npm install
```

**Nota**: Se houver erro com Tailwind v4, o sistema usará a versão alpha mais estável. Caso persista, rode:
```bash
npm install --legacy-peer-deps
```

### 2️⃣ Rodar o sistema
```bash
npm run dev
```

O sistema abrirá automaticamente em `http://localhost:3000`

### 3️⃣ Configurar conexão MQTT

Na interface web:
1. Clique em **Configurações** (ícone de engrenagem)
2. Configure:
   - **Broker IP**: `192.168.0.19` (ou o IP do seu broker)
   - **Porta WebSocket**: `9001`
   - **Tópico**: `esp32/motion`
3. Clique em **Conectar**

✅ Pronto! O sistema já está monitorando.

---

## 🧪 Testar sem hardware ESP32

### Opção 1: Usar script de teste
```bash
# Terminal 1: Rodar o frontend
npm run dev

# Terminal 2: Enviar mensagens de teste
npm run test-mqtt
```

### Opção 2: Publicar manualmente
```bash
mosquitto_pub -h 192.168.0.19 -t esp32/motion -m '{"mac":"AA:BB:CC","state":"move"}'
```

---

## 📋 Scripts disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Inicia o servidor de desenvolvimento |
| `npm run build` | Cria build de produção |
| `npm run preview` | Preview da build de produção |
| `npm run server` | Exemplo de servidor Node.js que ouve MQTT |
| `npm run test-mqtt` | Envia 20 mensagens de teste ao broker |

---

## ⚙️ Configuração do Mosquitto

Se você ainda não tem o Mosquitto configurado com WebSocket:

### Editar `/etc/mosquitto/mosquitto.conf`
```conf
# Porta TCP (Node.js)
listener 1883
protocol mqtt

# Porta WebSocket (Navegador)
listener 9001
protocol websockets

allow_anonymous true
```

### Reiniciar Mosquitto
```bash
sudo systemctl restart mosquitto
```

---

## 🎯 Criar uma regra de alerta

1. Vá na aba **Regras**
2. Clique em **Nova Regra**
3. Preencha:
   ```
   Nome: Movimento Noturno
   MAC: AA:BB:CC (ou vazio para todos)
   Estado: Movimento
   Horário: 22:00 às 06:00
   ```
4. Salve

Agora quando um ESP32 enviar movimento entre 22h e 6h, você receberá um alerta vermelho! 🚨

---

## 📱 Formato da mensagem ESP32

Seu ESP32 deve publicar neste formato:

```json
{
  "mac": "AA:BB:CC:DD:EE:FF",
  "state": "move"
}
```

Estados válidos: `move`, `static`, `someone`

---

## ❓ Problemas comuns

### "Failed to construct WebSocket"
- ✅ Solução: Marque "Usar conexão segura (WSS)" se estiver em HTTPS

### Não conecta ao broker
- ✅ Verifique se Mosquitto está rodando: `sudo systemctl status mosquitto`
- ✅ Confirme que a porta 9001 está configurada para WebSocket

### Não recebe mensagens
- ✅ Teste com: `mosquitto_pub -h 192.168.0.19 -t esp32/motion -m '{"mac":"TEST","state":"move"}'`
- ✅ Verifique o tópico configurado no sistema

---

## 📚 Documentação completa

Veja `README_INSTALACAO.md` para documentação detalhada.

---

**Dica**: Use `Ctrl+C` nos terminais para parar os processos.