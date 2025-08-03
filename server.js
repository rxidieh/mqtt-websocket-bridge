/*const mqtt = require('mqtt');
const WebSocket = require('ws');

const mqttClient = mqtt.connect('mqtt://broker.hivemq.com');
const wss = new WebSocket.Server({ port: process.env.PORT || 8080 });

mqttClient.on('connect', () => {
  mqttClient.subscribe('HOFFEResp32/dados');
  console.log("MQTT conectado");
});

mqttClient.on('message', (topic, message) => {
  const msg = message.toString();
  console.log("Mensagem recebida:", msg);

  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  });
});

wss.on('connection', ws => {
  console.log("WebSocket conectado");
  ws.send("WebSocket ativo");
});*/


const mqtt = require('mqtt');
const WebSocket = require('ws');

// Conexão com o broker MQTT
const mqttClient = mqtt.connect('mqtt://broker.hivemq.com');

// Criação do servidor WebSocket
const wss = new WebSocket.Server({ port: process.env.PORT || 8080 });

// Tópicos utilizados
const TOPICO_RECEBER = 'HOFFEResp32/dados';     // ESP32 → servidor
const TOPICO_ENVIAR  = 'HOFFEResp32/comando';   // servidor → ESP32

// Lista de clientes conectados via WebSocket
let clientesWebSocket = [];

// Conexão com o broker MQTT
mqttClient.on('connect', () => {
  console.log("🔌 Conectado ao broker MQTT");
  mqttClient.subscribe(TOPICO_RECEBER, (err) => {
    if (err) console.error("Erro ao se inscrever no tópico:", err);
    else console.log(`📡 Inscrito no tópico: ${TOPICO_RECEBER}`);
  });
});

// Quando o ESP32 publica dados no tópico "esp32/dados"
mqttClient.on('message', (topic, message) => {
  if (topic === TOPICO_RECEBER) {
    try {
      const json = JSON.parse(message.toString());
      console.log("📥 JSON recebido do ESP32:", json);

      // Envia o JSON para todos os WebSocket clients conectados
      clientesWebSocket.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(json));
        }
      });
    } catch (err) {
      console.error("❌ Erro ao interpretar JSON do ESP32:", err);
    }
  }
});

// WebSocket: quando o Bubble.io se conecta
wss.on('connection', (ws) => {
  console.log("🌐 Cliente WebSocket conectado");
  clientesWebSocket.push(ws);

  ws.send(JSON.stringify({ status: "WebSocket conectado" }));

  // Quando o Bubble envia um comando
  ws.on('message', (data) => {
    try {
      const json = JSON.parse(data);
      console.log("📤 Comando JSON recebido do Bubble:", json);

      // Envia o JSON para o ESP32 via MQTT
      mqttClient.publish(TOPICO_ENVIAR, JSON.stringify(json));
    } catch (err) {
      console.error("❌ Erro ao interpretar JSON do Bubble:", err);
    }
  });

  // Remove cliente desconectado
  ws.on('close', () => {
    console.log("🔌 Cliente WebSocket desconectado");
    clientesWebSocket = clientesWebSocket.filter(c => c !== ws);
  });
});


