require('dotenv').config();

//TODO use only one websocket library!
const io = require('socket.io-client');

const seSocket = io('https://realtime.streamelements.com', {
	transports: ['websocket']
});

const followHandlers = [];
const bitHandlers = [];

const debug = false;

let subscriber;
let subPoints;
let follower;

let bitsTotal;
let bitsMonthly;
let bitsWeekly;
let bitsDaily;

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
		switch (event.type) {
			case 'follow':
				handleEvent(event, followHandlers);
				break;
			case 'cheer':
				handleEvent(event, bitHandlers);
				break;
		}
	});
	seSocket.on('event:update', event => {
		switch (event.name) {
			case 'subscriber-total':
				subscriber = event.data.count;
				break;
			case 'subscriber-points':
				subPoints = event.data.count;
				break;
			case 'follower-total':
				follower = event.data.count;
				break;
			case 'cheer-total':
				bitsTotal = event.data.amount;
				break;
			case 'cheer-month':
				bitsMonthly = event.data.amount;
				break;
			case 'cheer-week':
				bitsWeekly = event.data.amount;
				break;
			case 'cheer-session':
				bitsDaily = event.data.amount;
				break;
		}
	});
	if (debug) {
		seSocket.on('*', (event, data) => console.log('SE Websocket Event', event, data));
		const onevent = seSocket.onevent;
		seSocket.onevent = function (packet) {
			const args = packet.data || [];
			onevent.call(this, packet);    // original call
			packet.data = ["*"].concat(args);
			onevent.call(this, packet);      // additional call to catch-all
		};
		await io.connect();
	}
	console.log('SE WebSocket setup finished.');
}

function handleEvent(event, handlers) {
	for (const handler of handlers) {
		handler(event.data);
	}
}

exports.setupStreamelementsClient = setupStreamelementsClient;
exports.onCounter = handler => {
	seSocket.on('bot:counter', handler);
};

exports.onFollow = handler => {
	followHandlers.push(handler);
};