const OBSWebSocket = require('obs-websocket-js');
const obs = new OBSWebSocket();

require('dotenv').config();

let currentScene;
exports.getCurrentScene = () => currentScene;

exports.connect = async () => {
	await obs.connect({address: process.env.OBS_WEBSOCKET_ADDRESS, password: process.env.OBS_WEBSOCKET_PASSWORD});
	obs.on('SwitchScenes', scene => currentScene = scene['scene-name']);
	console.log('connected to OBS Websocket');
}

exports.switchScene = name => obs.send('SetCurrentScene', {
	'scene-name': name
});

//Gaming
//Gaming - FC Chatting