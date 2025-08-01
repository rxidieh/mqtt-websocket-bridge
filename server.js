const mqtt = require('mqtt');
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
});
