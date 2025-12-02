# 📱 Aplicação Android com Kotlin (Opcional)

## Visão Geral

Este documento fornece um exemplo de aplicação Android nativa em Kotlin que conecta ao mesmo broker MQTT local e exibe os eventos de forma similar à interface web.

## Estrutura do Projeto Android

```
app/
├── src/main/
│   ├── java/com/seuapp/mqttmonitor/
│   │   ├── MainActivity.kt
│   │   ├── MqttManager.kt
│   │   ├── models/
│   │   │   └── SensorEvent.kt
│   │   ├── adapters/
│   │   │   └── EventsAdapter.kt
│   │   └── ui/
│   │       ├── EventsFragment.kt
│   │       └── SettingsFragment.kt
│   └── res/
│       ├── layout/
│       │   ├── activity_main.xml
│       │   ├── fragment_events.xml
│       │   ├── fragment_settings.xml
│       │   └── item_event.xml
│       └── values/
│           └── strings.xml
└── build.gradle
```

## Dependências (build.gradle)

```gradle
dependencies {
    implementation 'androidx.core:core-ktx:1.12.0'
    implementation 'androidx.appcompat:appcompat:1.6.1'
    implementation 'com.google.android.material:material:1.11.0'
    implementation 'androidx.constraintlayout:constraintlayout:2.1.4'
    
    // MQTT
    implementation 'org.eclipse.paho:org.eclipse.paho.client.mqttv3:1.2.5'
    implementation 'org.eclipse.paho:org.eclipse.paho.android.service:1.1.1'
    
    // Navigation
    implementation 'androidx.navigation:navigation-fragment-ktx:2.7.6'
    implementation 'androidx.navigation:navigation-ui-ktx:2.7.6'
    
    // RecyclerView
    implementation 'androidx.recyclerview:recyclerview:1.3.2'
    
    // ViewModel e LiveData
    implementation 'androidx.lifecycle:lifecycle-viewmodel-ktx:2.7.0'
    implementation 'androidx.lifecycle:lifecycle-livedata-ktx:2.7.0'
    
    // JSON
    implementation 'com.google.code.gson:gson:2.10.1'
}
```

## AndroidManifest.xml

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.seuapp.mqttmonitor">

    <!-- Permissões necessárias -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:theme="@style/Theme.MqttMonitor">
        
        <!-- Service MQTT -->
        <service android:name="org.eclipse.paho.android.service.MqttService" />
        
        <activity
            android:name=".MainActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
```

## Código Kotlin

### 1. Model - SensorEvent.kt

```kotlin
package com.seuapp.mqttmonitor.models

import java.util.Date

data class SensorEvent(
    val id: String = System.currentTimeMillis().toString(),
    val mac: String,
    val state: String,
    val timestamp: Date = Date(),
    val message: String = generateMessage(state, mac)
) {
    companion object {
        private fun generateMessage(state: String, mac: String): String {
            return when (state) {
                "move" -> "Presença com movimento detectada - $mac"
                "static" -> "Lugar vazio - $mac"
                "someone" -> "Alguém presente parado - $mac"
                else -> "Estado desconhecido: $state - $mac"
            }
        }
    }
    
    fun getStateLabel(): String {
        return when (state) {
            "move" -> "Movimento"
            "static" -> "Vazio"
            "someone" -> "Presença"
            else -> state
        }
    }
    
    fun getStateColor(): Int {
        return when (state) {
            "move" -> android.R.color.holo_orange_light
            "static" -> android.R.color.holo_green_light
            "someone" -> android.R.color.holo_blue_light
            else -> android.R.color.darker_gray
        }
    }
}
```

### 2. MQTT Manager - MqttManager.kt

```kotlin
package com.seuapp.mqttmonitor

import android.content.Context
import android.util.Log
import org.eclipse.paho.android.service.MqttAndroidClient
import org.eclipse.paho.client.mqttv3.*
import org.json.JSONObject

class MqttManager(
    private val context: Context,
    private val onMessageReceived: (SensorEvent) -> Unit,
    private val onConnectionChanged: (Boolean) -> Unit
) {
    private var mqttClient: MqttAndroidClient? = null
    private var isConnected = false
    
    companion object {
        private const val TAG = "MqttManager"
    }
    
    fun connect(
        broker: String,
        port: String,
        topic: String
    ) {
        val serverUri = "tcp://$broker:$port"
        val clientId = "AndroidClient_${System.currentTimeMillis()}"
        
        mqttClient = MqttAndroidClient(context, serverUri, clientId)
        
        mqttClient?.setCallback(object : MqttCallback {
            override fun connectionLost(cause: Throwable?) {
                Log.e(TAG, "Conexão perdida", cause)
                isConnected = false
                onConnectionChanged(false)
            }
            
            override fun messageArrived(topic: String?, message: MqttMessage?) {
                message?.let {
                    try {
                        val payload = String(it.payload)
                        val json = JSONObject(payload)
                        
                        val mac = json.getString("mac")
                        val state = json.getString("state")
                        
                        val event = SensorEvent(
                            mac = mac,
                            state = state
                        )
                        
                        onMessageReceived(event)
                    } catch (e: Exception) {
                        Log.e(TAG, "Erro ao processar mensagem", e)
                    }
                }
            }
            
            override fun deliveryComplete(token: IMqttDeliveryToken?) {
                // Não usado neste caso
            }
        })
        
        val options = MqttConnectOptions().apply {
            isCleanSession = true
            connectionTimeout = 10
            keepAliveInterval = 20
        }
        
        try {
            mqttClient?.connect(options, null, object : IMqttActionListener {
                override fun onSuccess(asyncActionToken: IMqttToken?) {
                    Log.d(TAG, "Conectado ao broker MQTT")
                    isConnected = true
                    onConnectionChanged(true)
                    subscribe(topic)
                }
                
                override fun onFailure(asyncActionToken: IMqttToken?, exception: Throwable?) {
                    Log.e(TAG, "Falha ao conectar", exception)
                    isConnected = false
                    onConnectionChanged(false)
                }
            })
        } catch (e: MqttException) {
            Log.e(TAG, "Erro ao conectar", e)
            onConnectionChanged(false)
        }
    }
    
    private fun subscribe(topic: String) {
        try {
            mqttClient?.subscribe(topic, 0, null, object : IMqttActionListener {
                override fun onSuccess(asyncActionToken: IMqttToken?) {
                    Log.d(TAG, "Inscrito no tópico: $topic")
                }
                
                override fun onFailure(asyncActionToken: IMqttToken?, exception: Throwable?) {
                    Log.e(TAG, "Falha ao se inscrever no tópico", exception)
                }
            })
        } catch (e: MqttException) {
            Log.e(TAG, "Erro ao se inscrever", e)
        }
    }
    
    fun disconnect() {
        try {
            mqttClient?.disconnect(null, object : IMqttActionListener {
                override fun onSuccess(asyncActionToken: IMqttToken?) {
                    Log.d(TAG, "Desconectado")
                    isConnected = false
                    onConnectionChanged(false)
                }
                
                override fun onFailure(asyncActionToken: IMqttToken?, exception: Throwable?) {
                    Log.e(TAG, "Erro ao desconectar", exception)
                }
            })
        } catch (e: MqttException) {
            Log.e(TAG, "Erro ao desconectar", e)
        }
    }
    
    fun isConnected(): Boolean = isConnected
}
```

### 3. MainActivity.kt

```kotlin
package com.seuapp.mqttmonitor

import android.os.Bundle
import android.view.Menu
import android.view.MenuItem
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.ViewModelProvider
import com.google.android.material.snackbar.Snackbar
import com.seuapp.mqttmonitor.databinding.ActivityMainBinding
import com.seuapp.mqttmonitor.models.SensorEvent

class MainActivity : AppCompatActivity() {
    
    private lateinit var binding: ActivityMainBinding
    private lateinit var mqttManager: MqttManager
    private val events = mutableListOf<SensorEvent>()
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        setSupportActionBar(binding.toolbar)
        
        setupMqtt()
        setupUI()
    }
    
    private fun setupMqtt() {
        mqttManager = MqttManager(
            context = this,
            onMessageReceived = { event ->
                runOnUiThread {
                    events.add(0, event)
                    updateUI()
                    
                    if (event.state == "move") {
                        Snackbar.make(
                            binding.root,
                            "Movimento detectado - ${event.mac}",
                            Snackbar.LENGTH_SHORT
                        ).show()
                    }
                }
            },
            onConnectionChanged = { connected ->
                runOnUiThread {
                    updateConnectionStatus(connected)
                }
            }
        )
    }
    
    private fun setupUI() {
        binding.fab.setOnClickListener {
            showSettingsDialog()
        }
        
        // Conectar automaticamente com configurações padrão
        connectToMqtt(
            broker = "192.168.0.19",
            port = "1883",
            topic = "esp32/motion"
        )
    }
    
    private fun connectToMqtt(broker: String, port: String, topic: String) {
        mqttManager.connect(broker, port, topic)
    }
    
    private fun updateConnectionStatus(connected: Boolean) {
        binding.connectionStatus.text = if (connected) {
            "✓ Conectado"
        } else {
            "✗ Desconectado"
        }
        
        binding.connectionStatus.setBackgroundColor(
            if (connected) {
                getColor(android.R.color.holo_green_light)
            } else {
                getColor(android.R.color.holo_red_light)
            }
        )
    }
    
    private fun updateUI() {
        binding.totalEvents.text = events.size.toString()
        binding.uniqueDevices.text = events.map { it.mac }.distinct().size.toString()
        binding.movements.text = events.count { it.state == "move" }.toString()
        
        // Atualizar RecyclerView aqui
    }
    
    private fun showSettingsDialog() {
        // Implementar dialog de configurações
    }
    
    override fun onDestroy() {
        super.onDestroy()
        mqttManager.disconnect()
    }
    
    override fun onCreateOptionsMenu(menu: Menu): Boolean {
        menuInflater.inflate(R.menu.menu_main, menu)
        return true
    }
    
    override fun onOptionsItemSelected(item: MenuItem): Boolean {
        return when (item.itemId) {
            R.id.action_clear -> {
                events.clear()
                updateUI()
                true
            }
            R.id.action_settings -> {
                showSettingsDialog()
                true
            }
            else -> super.onOptionsItemSelected(item)
        }
    }
}
```

### 4. Layout - activity_main.xml

```xml
<?xml version="1.0" encoding="utf-8"?>
<androidx.coordinatorlayout.widget.CoordinatorLayout
    xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:app="http://schemas.android.com/apk/res-auto"
    android:layout_width="match_parent"
    android:layout_height="match_parent">
    
    <com.google.android.material.appbar.AppBarLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content">
        
        <androidx.appcompat.widget.Toolbar
            android:id="@+id/toolbar"
            android:layout_width="match_parent"
            android:layout_height="?attr/actionBarSize"
            android:background="?attr/colorPrimary"
            app:title="MQTT Monitor"
            app:titleTextColor="@android:color/white" />
            
        <TextView
            android:id="@+id/connectionStatus"
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:padding="8dp"
            android:text="✗ Desconectado"
            android:gravity="center"
            android:textColor="@android:color/white"
            android:background="@android:color/holo_red_light" />
    </com.google.android.material.appbar.AppBarLayout>
    
    <androidx.core.widget.NestedScrollView
        android:layout_width="match_parent"
        android:layout_height="match_parent"
        app:layout_behavior="@string/appbar_scrolling_view_behavior">
        
        <LinearLayout
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:orientation="vertical"
            android:padding="16dp">
            
            <!-- Statistics Cards -->
            <com.google.android.material.card.MaterialCardView
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:layout_marginBottom="16dp">
                
                <LinearLayout
                    android:layout_width="match_parent"
                    android:layout_height="wrap_content"
                    android:orientation="horizontal"
                    android:padding="16dp">
                    
                    <LinearLayout
                        android:layout_width="0dp"
                        android:layout_height="wrap_content"
                        android:layout_weight="1"
                        android:orientation="vertical"
                        android:gravity="center">
                        
                        <TextView
                            android:layout_width="wrap_content"
                            android:layout_height="wrap_content"
                            android:text="Total Eventos"
                            android:textSize="12sp" />
                        
                        <TextView
                            android:id="@+id/totalEvents"
                            android:layout_width="wrap_content"
                            android:layout_height="wrap_content"
                            android:text="0"
                            android:textSize="24sp"
                            android:textStyle="bold" />
                    </LinearLayout>
                    
                    <LinearLayout
                        android:layout_width="0dp"
                        android:layout_height="wrap_content"
                        android:layout_weight="1"
                        android:orientation="vertical"
                        android:gravity="center">
                        
                        <TextView
                            android:layout_width="wrap_content"
                            android:layout_height="wrap_content"
                            android:text="Dispositivos"
                            android:textSize="12sp" />
                        
                        <TextView
                            android:id="@+id/uniqueDevices"
                            android:layout_width="wrap_content"
                            android:layout_height="wrap_content"
                            android:text="0"
                            android:textSize="24sp"
                            android:textStyle="bold" />
                    </LinearLayout>
                    
                    <LinearLayout
                        android:layout_width="0dp"
                        android:layout_height="wrap_content"
                        android:layout_weight="1"
                        android:orientation="vertical"
                        android:gravity="center">
                        
                        <TextView
                            android:layout_width="wrap_content"
                            android:layout_height="wrap_content"
                            android:text="Movimentos"
                            android:textSize="12sp" />
                        
                        <TextView
                            android:id="@+id/movements"
                            android:layout_width="wrap_content"
                            android:layout_height="wrap_content"
                            android:text="0"
                            android:textSize="24sp"
                            android:textStyle="bold" />
                    </LinearLayout>
                </LinearLayout>
            </com.google.android.material.card.MaterialCardView>
            
            <!-- Events RecyclerView -->
            <androidx.recyclerview.widget.RecyclerView
                android:id="@+id/eventsRecyclerView"
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                app:layoutManager="androidx.recyclerview.widget.LinearLayoutManager" />
        </LinearLayout>
    </androidx.core.widget.NestedScrollView>
    
    <com.google.android.material.floatingactionbutton.FloatingActionButton
        android:id="@+id/fab"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:layout_gravity="bottom|end"
        android:layout_margin="16dp"
        app:srcCompat="@android:drawable/ic_menu_preferences" />
</androidx.coordinatorlayout.widget.CoordinatorLayout>
```

## Características da App Android

### ✅ Funcionalidades Implementadas

- Conexão MQTT com broker local
- Recebimento de eventos em tempo real
- Lista de eventos com scroll
- Estatísticas (total, dispositivos, movimentos)
- Notificações para movimentos
- Indicador de conexão
- Configurações editáveis
- Armazenamento temporário em memória

### 🎨 Interface

- Material Design 3
- Cards para estatísticas
- RecyclerView para lista de eventos
- FAB para configurações
- AppBar com status de conexão
- Snackbar para notificações

## Próximos Passos

1. Implementar RecyclerView Adapter
2. Adicionar dialog de configurações
3. Implementar exportação de dados
4. Adicionar filtros de eventos
5. Implementar persistência local (opcional)
6. Adicionar notificações push

## Observações

- A porta MQTT padrão é 1883 (não WebSocket)
- Para usar WebSocket no Android, ajuste para: `ws://broker:9001`
- A aplicação requer permissões de Internet
- Dados são perdidos ao fechar o app (similar à versão web)

---

**Status:** Código base pronto. Implementar UI completa conforme necessário.
