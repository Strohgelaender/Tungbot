const {ApiClient, RefreshableAuthProvider, StaticAuthProvider} = require('twitch');
const {InvalidTokenError} = require('twitch-auth');
const {PubSubClient} = require('twitch-pubsub-client');
const tmi = require('tmi.js');
const axios = require('axios');

require('dotenv').config();

const scopes = 'channel:read:redemptions user:read:email chat:edit chat:read'
const authProvider = new RefreshableAuthProvider(
	new StaticAuthProvider(process.env.CLIENT_ID, process.env.CHANNEL_OAUTH_TOKEN),
	{
		clientSecret: process.env.CLIENT_SECRET,
		refreshToken: process.env.CHANNEL_REFRESH_TOKEN,
		onRefresh: token => {
			console.log('refreshed Token.');
			//TODO save
		}
	}
);
const apiClient = new ApiClient({authProvider});
const pubSubClient = new PubSubClient();

const targetChannel = '#tungdiiltv';
const targetChannelID = '444384436';

const opts = {
	identity: {
		username: process.env.CHAT_USERNAME,
		password: process.env.CHAT_OAUTH_TOKEN
	},
	connection: {cluster: 'aws', timeout: 2000, reconnect: true},
	channels: [
		targetChannel,
		'strohgelaender' //debug channel
	]
};
const chatClient = new tmi.client(opts);

const streamelements = axios.create({
	baseURL: 'https://api.streamelements.com/kappa/v2/',
	headers: {
		'Content-Type': 'application/json',
		'Authorization': 'Bearer ' + process.env.STREAMELEMENTS_TOKEN
	}
});

let waterCount = 0; //TODO save value

const addTime = 30 * 60000;
const CAPE = 0, BART = 1, HELM = 2;
let clothing = [{
	name: 'das Cape',
	handler: null,
	time: null
}, {
	name: 'den Bart',
	handler: null,
	time: null
}, {
	name: 'den Helm',
	handler: null,
	time: null
}];

startup().then(() => console.log('chat client started')).catch(e => {
	if (e instanceof InvalidTokenError)
		authProvider.refresh()
			.then(() => connectPubSubClient())
			.then(() => console.log('chat client started after refresh'))
			.catch(e => console.error('startup failed', e));
	else
		console.error('startup failed', e);
});

async function startup() {
	await connectChatClient();
	await connectPubSubClient();
}

async function connectChatClient() {
	chatClient.on('message', onMessageHandler);
	chatClient.on('connected', onConnectedHandler);
	chatClient.on('raided', onRadiHandler);
	chatClient.on('hosted', onHostHandler);

	await chatClient.connect();
}

async function connectPubSubClient() {
	await pubSubClient.registerUserListener(apiClient);
	await pubSubClient.onRedemption(targetChannelID, onChannelPointHandler);
}

function onConnectedHandler(addr, port) {
	console.log(`* Connected to ${addr}:${port}`);
}

function onMessageHandler(target, context, message, self) {
	const msg = message.trim();
	const lmsg = msg.toLowerCase();

	//log
	console.log(`${currentTimeString()} ${context['display-name']}: ${msg}`);

	if (self) // Ignore messages from the bot
		return;

	if (lmsg.includes('tungdoof') && !msg.includes('tungdiDoof')) {
		chatClient.say(target, 'tungdiDoof');
	} else if ((msg.match('.* went all in and lost every single one of their \\d* .* LUL')
		|| msg.match('.* ist all in gegangen und .* verloren. .*'))
		&& context['user-id'] === '100135110') {
		chatClient.say(target, 'LUL');
	} else if (lmsg === '!queue') {
		say('https://warp.world/streamqueue?streamer=tungdiiltv', target);
	} else if (lmsg.match('!(cape|bart|helm) time') || (!isModerator(context) && lmsg.match('!(cape|bart|helm)'))) {
		sendTime(text2Slot(lmsg));
	} else if (lmsg.match('!top\\d*')) {
		const num = parseInt(lmsg.substring(4)) || 5;
		sendTopList(num, target);
	} else if (isModerator(context)) {
		if (lmsg.match('^!(cape|bart|helm)$')) {
			//manual reward call
			onZwergReward(text2Slot(lmsg), undefined, target); //undefined -> default time
		} else if (lmsg === '!rüstung' || lmsg === '!kraft' || lmsg === '!all') {
			rewardAll(target);
		} else if (lmsg.match('^!(cape|bart|helm) add -?\\d+$')) {
			//add / remove time
			const id = text2Slot(lmsg);
			const time = parseInt(lmsg.substring(10)) * 60000;
			onZwergReward(id, time, target);
		}
	}
}

function onChannelPointHandler(message) {
	//Log
	console.log(`${currentTimeString()} [Redemption] ${message.userDisplayName}: ${message.rewardName} (${message.rewardCost})`);

	if (message.rewardId === '3918cc27-4b68-4cd1-90c2-c7f39165485d') {
		onZwergReward(CAPE);
	} else if (message.rewardId === '7485f8d7-d39c-4530-a32e-eb35e3f6d5b9') {
		onZwergReward(BART);
	} else if (message.rewardId === 'd17a39e8-6a12-4fe9-95dc-25cf20b8f66f') {
		onZwergReward(HELM);
	} else if (message.rewardId === '2e6518e0-eba3-4ace-b219-233d4374f0ab') {
		rewardAll();
	} else if (message.rewardId === '1c845b56-5e7d-48b2-82ec-a78a41486fdd') {
		addPoints(message.userName, 500);
	} else if (message.rewardId === 'cfce5fc5-0da5-4078-a905-90a92ffdffd4') {
		addPoints(message.userName, 6000);
	} else if (message.rewardId === '4134f9e6-aeb6-43fa-a501-5cf3410b7d78') {
		chatClient.say(targetChannel, '/emoteonly');
		setTimeout(function () {
			chatClient.say(targetChannel, '/emoteonlyoff');
		}, 2 * 60000);
	} else if (message.rewardId === 'b28d8dc9-adf6-4ab7-b75e-6ae55102d148') {
		say(`/timeout ${message.userName} 120 Kanalbelohnung eingelöst.`);
	} else if (message.rewardId === '6da58703-f497-4483-ac97-45ed011644e9') {
		waterCount++;
		say(`🚰 Der Chat hat heute ${waterCount} mal dafür gesorgt, dass Tung genug Wasser trinkt. Prost!`);
	}
}

function onRadiHandler(channel, username, viewers) {
	console.log(`${currentTimeString()} [Raid] ${username} (${viewers})`)
	shoutout(channel, username, viewers);
}

function onHostHandler(channel, username, viewers, autohost) {
	console.log(`${currentTimeString()} [Host] ${username} (${viewers})`);
	if (!autohost)
		shoutout(channel, username, viewers);
}

function shoutout(channel, username, viewers) {
	if (viewers >= 2) {
		setTimeout(function () {
			say(`!so ${username}`);
		}, 7500);
	}
}

function addPoints(user, amount) {
	streamelements
		.put(`points/${process.env.STREAMELEMENTS_USER_ID}/${user}/${amount}`)
		.then(response => {
			if (response.status === 200) {
				say( `${user} hat an der Bar ${amount} Bier bestellt und besitzt jetzt ${response.data.newAmount} Bier.`);
			} else {
				console.log(response);
			}
		}).catch(e => console.log(e));
}

function sendTopList(limit = 5, target = targetChannel) {
	streamelements.get(`points/${process.env.STREAMELEMENTS_USER_ID}/top?limit=${limit}`)
		.then(response => {
			if (response.status === 200) {
				let toplist = `Die Top ${limit} Nutzer mit am meisten Bier: `
				for (let i = 0; i < response.data.users.length; i++) {
					const user = response.data.users[i];
					toplist += `${i + 1}: ${user.username} (${user.points}), `;
				}
				say(toplist.slice(0, -2));
			} else {
				console.log(response);
			}
		}).catch(e => console.log(e))
}

function isModerator(context) {
	return context['mod'] || (context['badges'] !== null && context['badges'].hasOwnProperty('broadcaster'));
}

function say(message, target = targetChannel) {
	chatClient.say(target, message + ' 🤖');
}

function text2Slot(msg) {
	if (msg.length < 5)
		return -1;
	else if (msg.length > 5)
		msg = msg.substring(0, 5);

	switch (msg) {
		case '!cape':
			return CAPE;
		case '!bart':
			return BART;
		case '!helm':
			return HELM;
		default:
			return -1;
	}
}

function onZwergReward(slot, time = getTime(slot), target = targetChannel) {
	updateTime(slot, time);
	sendTime(slot, target);
	updateZwergTimeout(slot, target);
}

function sendTime(slot, target = targetChannel) {
	if (clothing[slot].time === null)
		say( `Tung muss ${clothing[slot].name} derzeit nicht tragen.`, target);
	else {
		const timeStr = `${makeTwoDigit(clothing[slot].time.getHours())}:${makeTwoDigit(clothing[slot].time.getMinutes())}`;
		say( `Tung muss ${clothing[slot].name} bis ${timeStr} tragen.`, target);
	}
}

function updateZwergTimeout(slot, target = targetChannel) {
	if (clothing[slot].handler !== null) {
		clearTimeout(clothing[slot].handler);
	}
	clothing[slot].handler = setTimeout(function () {
		say( `Du kannst jetzt ${clothing[slot].name} abnehmen Tung.`, target);
		clothing[slot].time = null;
		clothing[slot].handler = null;
	}, clothing[slot].time.getTime() - new Date().getTime());
}

function rewardAll(target = targetChannel) {
	for (let i = 0; i < 3; i++) {
		updateTime(i, getTime(i));
		updateZwergTimeout(i, target);
	}
	say( 'Tung hat die Zwergenrüstung angezogen! CoolCat', target);
}

//adds one Minute addition time
//if the clothes are not being worn currently.
function getTime(slot) {
	if (clothing[slot].time === null)
		return addTime + 60000;
	return addTime;
}

function updateTime(slot, time = addTime) {
	if (clothing[slot].time === null)
		clothing[slot].time = new Date(new Date().getTime() + time);
	else
		clothing[slot].time = new Date(clothing[slot].time.getTime() + time);
}

function currentTimeString() {
	const date = new Date();
	return `${makeTwoDigit(date.getHours())}:${makeTwoDigit(date.getMinutes())}:${makeTwoDigit(date.getSeconds())}`;
}

function makeTwoDigit(value) {
	if (value < 10)
		return '0' + value;
	return '' + value;
}