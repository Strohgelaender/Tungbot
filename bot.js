const {ApiClient, RefreshableAuthProvider, StaticAuthProvider} = require('twitch');
const {InvalidTokenError} = require('twitch-auth');
const {PubSubClient} = require('twitch-pubsub-client');
const tmi = require('tmi.js');

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

const opts = {
	identity: {
		username: process.env.CHAT_USERNAME,
		password: process.env.CHAT_OAUTH_TOKEN
	},
	channels: [
		targetChannel,
		'strohgelaender' //debug channel
	]
};
const chatClient = new tmi.client(opts);

let waterCount = 0; //TODO save value

const addTime = 30 * 60000;
const CAPE = 0;
const BART = 1;
const HELM = 2;
let zwergTime = [undefined, undefined, undefined];
const zwergStrings = ['das Cape', 'den Bart', 'den Helm'];
let zwergHandlers = [undefined, undefined, undefined];

startup().then(r => console.log('chat client started')).catch(e => {
	if (e instanceof InvalidTokenError)
		authProvider.refresh()
			.then(r => connectPubSubClient())
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

	await chatClient.connect();
}

async function connectPubSubClient() {
	await pubSubClient.registerUserListener(apiClient);
	//Tung: 444384436
	await pubSubClient.onRedemption('444384436', onChannelPointHandler);
}

function onConnectedHandler(addr, port) {
	console.log(`* Connected to ${addr}:${port}`);
}

function onMessageHandler(target, context, message, self) {
	if (self) // Ignore messages from the bot
		return;

	const msg = message.trim();
	const lmsg = msg.toLowerCase();

	//log
	console.log(`${currentTimeString()} ${context['display-name']}: ${msg}`);

	if (lmsg.includes('tungdoof') && !msg.includes('tungdiDoof')) {
		chatClient.say(target, 'tungdiDoof');
	} else if ((msg.match('.* went all in and lost every single one of their \\d* .* LUL')
		|| msg.match('.* ist all in gegangen und .* verloren. .*'))
		&& context['user-id'] === '100135110') {
		chatClient.say(target, 'LUL');
	} else if (lmsg === '!queue') {
		chatClient.say(target, 'https://warp.world/streamqueue?streamer=tungdiiltv');
	} else if (isModerator(context)) {
		if (lmsg.match('^!(cape|bart|helm)$')) {
			//manual reward call
			onZwergReward(text2Slot(lmsg), addTime, target);
		} else if (lmsg === '!rüstung' || lmsg === '!kraft' || lmsg === '!all') {
			rewardAll(target);
		} else if (lmsg.match('^!(cape|bart|helm) add -?\\d+$')) {
			//add / remove time
			const id = text2Slot(lmsg.substring(0, 5));
			const time = parseInt(lmsg.substring(10)) * 60000;
			onZwergReward(id, time, target);
		}
	}
}

function onChannelPointHandler(message) {
	//Log
	console.log(`${currentTimeString()} ${message.userDisplayName}: redemption: ${message.rewardName} (${message.rewardCost})`);

	if (message.rewardId === '3918cc27-4b68-4cd1-90c2-c7f39165485d') {
		onZwergReward(CAPE, getTime(CAPE));
	} else if (message.rewardId === '7485f8d7-d39c-4530-a32e-eb35e3f6d5b9') {
		onZwergReward(BART, getTime(BART));
	} else if (message.rewardId === 'd17a39e8-6a12-4fe9-95dc-25cf20b8f66f') {
		onZwergReward(HELM, getTime(HELM));
	} else if (message.rewardId === '2e6518e0-eba3-4ace-b219-233d4374f0ab') {
		rewardAll();
	} else if (message.rewardId === '1c845b56-5e7d-48b2-82ec-a78a41486fdd') {
		chatClient.say(targetChannel, `!addpoints ${message.userName} 500 🤖`);
	} else if (message.rewardId === 'cfce5fc5-0da5-4078-a905-90a92ffdffd4') {
		chatClient.say(targetChannel, `!addpoints ${message.userName} 6000 🤖`);
	} else if (message.rewardId === '4134f9e6-aeb6-43fa-a501-5cf3410b7d78') {
		chatClient.say(targetChannel, '/emoteonly');
		setTimeout(function() {
			chatClient.say(targetChannel, '/emoteonlyoff');
		}, 2 * 60000);
	} else if (message.rewardId === 'b28d8dc9-adf6-4ab7-b75e-6ae55102d148') {
		chatClient.say(targetChannel, `/timeout ${message.userName} 120 Kanalbelohnung eingelöst. 🤖 `);
	} else if (message.rewardId === '6da58703-f497-4483-ac97-45ed011644e9') {
		waterCount++;
		chatClient.say(targetChannel, `🚰 Tung hat heute ${waterCount} Schluck Wasser getrunken. Prost! 🤖`);
	}
}

function isModerator(context) {
	return context['mod'] || (context['badges'] !== null && context['badges'].hasOwnProperty('broadcaster'));
}

function text2Slot(msg) {
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

function onZwergReward(slotID, time, target = targetChannel) {
	updateTime(slotID, time);
	chatClient.say(target, `Tung muss ${zwergStrings[slotID]} bis ${makeTwoDigit(zwergTime[slotID].getHours())}:${makeTwoDigit(zwergTime[slotID].getMinutes())} tragen. 🤖`);
	updateZwergTimeout(slotID, target);
}

function updateZwergTimeout(slotID, target = targetChannel) {
	if (zwergHandlers[slotID] !== undefined) {
		clearTimeout(zwergHandlers[slotID]);
	}
	zwergHandlers[slotID] = setTimeout(function() {
		chatClient.say(target, `Du kannst jetzt ${zwergStrings[slotID]} abnehmen Tung. 🤖`);
		zwergTime[slotID] = undefined;
		zwergHandlers[slotID] = undefined;
	}, zwergTime[slotID].getTime() - new Date().getTime());
}

function rewardAll(target = targetChannel) {
	for (let i = 0; i < 3; i++) {
		updateTime(i, getTime(i));
		updateZwergTimeout(i, target);
	}
	chatClient.say(target, 'Tung hat die Zwergenrüstung angezogen! CoolCat 🤖');
}

//adds one Minute addition time
//if the clothes are not being worn currently.
function getTime(slotID) {
	if (zwergTime[slotID] === undefined)
		return addTime + 60000;
	return addTime;
}

function updateTime(slotID, time = addTime) {
	if (zwergTime[slotID] === undefined)
		zwergTime[slotID] = new Date(new Date().getTime() + time);
	else
		zwergTime[slotID] = new Date(zwergTime[slotID].getTime() + time);
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