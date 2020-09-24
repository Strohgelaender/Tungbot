const OBSWebSocket = require('obs-websocket-js');
const obs = new OBSWebSocket();

require('dotenv').config();

exports.connect = async () => {
	await obs.connect({address: process.env.OBS_WEBSOCKET_ADDRESS, password: process.env.OBS_WEBSOCKET_PASSWORD});
	console.log('connected to OBS Websocket');
}

exports.switchScene = async name => obs.send('SetCurrentScene', {
	'scene-name': name
});

//Gaming
//Gaming - FC Chatting