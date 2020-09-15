require('dotenv').config();

//TODO use only one websocket library!
const io = require('socket.io-client');

const seSocket = io('https://realtime.streamelements.com', {
	transports: ['websocket']
});

const followHandlers = [];

async function setupStreamelementsClient() {
	seSocket.on('connect', () => {
		console.log('connecting to Streamelements Realtime Service...');
		seSocket.emit('authenticate', {
			method: 'jwt',
			token: process.env.STREAMELEMENTS_TOKEN
		});
	});
	seSocket.on('disconnect', () => console.log('disconnect'));
	seSocket.on('authenticated', () => console.log('authenticated'));
	seSocket.on('unauthorized', (data) => {
		console.log(data);
	});
	seSocket.on('event', event => {
		if (event.type === 'follow') {
			for (const handler of followHandlers) {
				handler(event.data);
			}
		}
	})
	//code for local testing only
	/*seSocket.on('*', (event, data) => console.log('SE Websocket Event', event, data));
	const onevent = seSocket.onevent;
	seSocket.onevent = function (packet) {
		const args = packet.data || [];
		onevent.call(this, packet);    // original call
		packet.data = ["*"].concat(args);
		onevent.call(this, packet);      // additional call to catch-all
	};
	await io.connect();
	console.log('connected.'); */

}
exports.setupStreamelementsClient = setupStreamelementsClient;
exports.onCounter = handler => {
	seSocket.on('bot:counter', handler);
};

exports.onFollow = handler => {
	followHandlers.push(handler);
};