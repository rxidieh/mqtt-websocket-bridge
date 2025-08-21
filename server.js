const mqtt = require('mqtt');
const WebSocket = require('ws');

// 🔐 Configuração de conexão segura com HiveMQ Cloud
const mqttOptions = {
  host: '2df0c5c0ede74eb88f846ad7b816f47c.s1.eu.hivemq.cloud',
  port: 8883,
  protocol: 'mqtts', // conexão TLS implícita
  username: 'Hoffer002',
  password: 'Hoffer@@2020',
  rejectUnauthorized: false // desativa verificação do certificado
};

// Conecta ao HiveMQ Cloud com TLS + user/pass (sem certificados)
const mqttClient = mqtt.connect(mqttOptions);

// Criação do servidor WebSocket
const wss = new WebSocket.Server({ port: process.env.PORT || 8080 });

const TOPICO_RECEBER = 'HOFFEResp32/dados';
const TOPICO_ENVIAR = 'HOFFEResp32/comando';

let clientesWebSocket = [];

// Conexão ao MQTT
mqttClient.on('connect', () => {
  console.log("✅ Conectado ao HiveMQ Cloud");
  mqttClient.subscribe(TOPICO_RECEBER, (err) => {
    if (err) console.error("Erro ao se inscrever:", err);
    else console.log(`📡 Inscrito no tópico: ${TOPICO_RECEBER}`);
  });
});

mqttClient.on('error', (err) => {
  console.error("❌ Erro MQTT:", err);
});

// Quando recebe mensagem do ESP32
mqttClient.on('message', (topic, message) => {
  if (topic === TOPICO_RECEBER) {
    try {
      const json = JSON.parse(message.toString());
      console.log("📥 JSON recebido do ESP32:", json);

      clientesWebSocket.forEach(ws => {
        if (ws.readyState == WebSocket.OPEN) {
          ws.send(JSON.stringify(json));
        }
      });
    } catch (err) {
      console.error("❌ Erro ao interpretar JSON:", err);
    }
  }
});

// Conexão com cliente WebSocket (ex: Bubble)
wss.on('connection', (ws) => {
  console.log("🌐 Cliente WebSocket conectado");
  clientesWebSocket.push(ws);

  ws.send(JSON.stringify({ status: "WebSocket ativo" }));

  ws.on('message', (data) => {
    try {
      const json = JSON.parse(data);
      console.log("📤 Comando do Bubble:", json);
      mqttClient.publish(TOPICO_ENVIAR, JSON.stringify(json));
    } catch (err) {
      console.error("❌ Erro ao processar comando do Bubble:", err);
    }
  });

  ws.on('close', () => {
    console.log("🔌 Cliente WebSocket desconectado");
    clientesWebSocket = clientesWebSocket.filter(c => c !== ws);
  });
});







