# 🧪 Teste do Sistema MQTT

## Script de Teste Rápido

Use este script bash para testar o sistema enviando eventos simulados:

### teste_mqtt.sh

```bash
#!/bin/bash

# Configurações
BROKER="192.168.0.19"
TOPIC="esp32/motion"

echo "🧪 Iniciando teste do sistema MQTT..."
echo "Broker: $BROKER"
echo "Tópico: $TOPIC"
echo ""

# Função para enviar mensagem
enviar_evento() {
    local mac=$1
    local estado=$2
    local mensagem="{\"mac\":\"$mac\",\"state\":\"$estado\"}"
    
    echo "📤 Enviando: $mensagem"
    mosquitto_pub -h $BROKER -t $TOPIC -m "$mensagem"
    sleep 1
}

# Teste 1: Sequência de eventos de um sensor
echo "=== Teste 1: Sensor ESP32_001 ==="
enviar_evento "AA:BB:CC:DD:EE:01" "static"
enviar_evento "AA:BB:CC:DD:EE:01" "move"
enviar_evento "AA:BB:CC:DD:EE:01" "someone"
enviar_evento "AA:BB:CC:DD:EE:01" "static"

# Teste 2: Múltiplos sensores
echo ""
echo "=== Teste 2: Múltiplos Sensores ==="
enviar_evento "AA:BB:CC:DD:EE:01" "move"
enviar_evento "AA:BB:CC:DD:EE:02" "static"
enviar_evento "AA:BB:CC:DD:EE:03" "someone"

# Teste 3: Sequência de movimentos
echo ""
echo "=== Teste 3: Sequência de Movimentos ==="
for i in {1..5}; do
    enviar_evento "AA:BB:CC:DD:EE:01" "move"
done

# Teste 4: Simulação realista
echo ""
echo "=== Teste 4: Simulação Realista ==="
echo "Simulando 30 segundos de atividade..."

for i in {1..10}; do
    # Gerar estado aleatório
    rand=$((RANDOM % 3))
    case $rand in
        0) estado="move" ;;
        1) estado="static" ;;
        2) estado="someone" ;;
    esac
    
    # Gerar sensor aleatório (1-3)
    sensor=$((RANDOM % 3 + 1))
    mac=$(printf "AA:BB:CC:DD:EE:%02d" $sensor)
    
    enviar_evento "$mac" "$estado"
    sleep 3
done

echo ""
echo "✅ Teste concluído!"
echo "Verifique a interface web para ver os eventos registrados."
```

## Como Usar

### Linux/Mac:

```bash
# Salvar o script
nano teste_mqtt.sh

# Dar permissão de execução
chmod +x teste_mqtt.sh

# Executar
./teste_mqtt.sh
```

### Windows (PowerShell):

```powershell
# Configurações
$broker = "192.168.0.19"
$topic = "esp32/motion"

# Função para enviar evento
function Send-Event {
    param($mac, $state)
    $message = "{`"mac`":`"$mac`",`"state`":`"$state`"}"
    Write-Host "Enviando: $message"
    mosquitto_pub -h $broker -t $topic -m $message
    Start-Sleep -Seconds 1
}

# Testes
Write-Host "Teste 1: Sensor único"
Send-Event "AA:BB:CC:DD:EE:01" "static"
Send-Event "AA:BB:CC:DD:EE:01" "move"
Send-Event "AA:BB:CC:DD:EE:01" "someone"

Write-Host "`nTeste 2: Múltiplos sensores"
Send-Event "AA:BB:CC:DD:EE:01" "move"
Send-Event "AA:BB:CC:DD:EE:02" "static"
Send-Event "AA:BB:CC:DD:EE:03" "someone"

Write-Host "`nTeste concluído!"
```

## Testes Manuais Individuais

### Teste 1: Movimento Detectado
```bash
mosquitto_pub -h 192.168.0.19 -t esp32/motion -m '{"mac":"TEST_01","state":"move"}'
```

### Teste 2: Local Vazio
```bash
mosquitto_pub -h 192.168.0.19 -t esp32/motion -m '{"mac":"TEST_01","state":"static"}'
```

### Teste 3: Presença Parada
```bash
mosquitto_pub -h 192.168.0.19 -t esp32/motion -m '{"mac":"TEST_01","state":"someone"}'
```

### Teste 4: Múltiplos Sensores
```bash
mosquitto_pub -h 192.168.0.19 -t esp32/motion -m '{"mac":"SALA_01","state":"move"}'
mosquitto_pub -h 192.168.0.19 -t esp32/motion -m '{"mac":"QUARTO_01","state":"static"}'
mosquitto_pub -h 192.168.0.19 -t esp32/motion -m '{"mac":"COZINHA_01","state":"someone"}'
```

## Monitorar em Tempo Real

Em um terminal separado, monitore todas as mensagens:

```bash
mosquitto_sub -h 192.168.0.19 -t esp32/motion -v
```

## Verificações

### ✅ Sistema Funcionando Corretamente

Você deve ver:
- ✅ Eventos aparecendo na página inicial em tempo real
- ✅ Contador de eventos aumentando
- ✅ Dispositivos únicos sendo listados
- ✅ Estados corretos (Movimento/Vazio/Presença)
- ✅ Timestamps precisos
- ✅ Notificações toast para movimentos

### ⚠️ Problemas Comuns

**Eventos não aparecem:**
- Verifique se está conectado ao MQTT (indicador verde)
- Confirme o IP e porta do broker
- Teste com mosquitto_sub primeiro

**Mensagens com erro:**
- Verifique o formato JSON
- Confirme que as chaves são "mac" e "state" (minúsculas)
- Valide os valores de state (move/static/someone)

**Desconexões frequentes:**
- Verifique a estabilidade da rede
- Confirme que o broker MQTT está rodando
- Veja os logs do Mosquitto

## Performance

### Teste de Carga

Para testar como o sistema lida com muitos eventos:

```bash
#!/bin/bash
# Enviar 100 eventos rapidamente
for i in {1..100}; do
    mosquitto_pub -h 192.168.0.19 -t esp32/motion -m "{\"mac\":\"LOAD_TEST\",\"state\":\"move\"}"
done
```

O sistema deve:
- ✅ Processar todos os eventos
- ✅ Manter a interface responsiva
- ✅ Atualizar contadores corretamente
- ✅ Permitir scroll na lista de eventos

## Teste de Exportação

1. Gere alguns eventos de teste
2. Vá para a página **Logs**
3. Clique em **JSON** para baixar
4. Abra o arquivo e verifique o formato
5. Clique em **CSV** para baixar
6. Abra no Excel/LibreOffice e verifique

## Teste de Filtros

1. Gere eventos com diferentes estados
2. Na página Logs, use os filtros:
   - Clique em **Movimento** - deve mostrar só eventos "move"
   - Clique em **Vazio** - deve mostrar só eventos "static"
   - Clique em **Presença** - deve mostrar só eventos "someone"
3. Use a busca para filtrar por MAC específico

## Teste de Sessão

1. Gere alguns eventos
2. Anote o número total
3. Recarregue a página (F5)
4. Verifique que os eventos foram limpos
5. Confirme que o sistema está pronto para novos eventos

## Checklist Final

- [ ] Conexão MQTT estabelecida
- [ ] Eventos sendo recebidos em tempo real
- [ ] Notificações toast funcionando
- [ ] Contadores atualizando corretamente
- [ ] Filtros funcionando
- [ ] Busca operacional
- [ ] Exportação JSON funcionando
- [ ] Exportação CSV funcionando
- [ ] Limpar logs funcionando
- [ ] Interface responsiva em mobile
- [ ] Reconexão automática após desconexão

---

**Status:** ✅ Todos os testes passaram? Sistema pronto para produção!
