const { ApiClient, RefreshableAuthProvider, StaticAuthProvider } = require('twitch');
const { PubSubClient } = require('twitch-pubsub-client');
const tmi = require('tmi.js');

require('dotenv').config();

const scopes = 'channel:read:redemptions user:read:email chat:edit chat:read'
const authProvider = new RefreshableAuthProvider(
	new StaticAuthProvider(process.env.CLIENT_ID, process.env.CHANNEL_OAUTH_TOKEN),
	{
		clientSecret: process.env.CLIENT_SECRET,
		refreshToken: process.env.CHANNEL_REFRESH_TOKEN,
	}
);
const apiClient = new ApiClient({ authProvider });
const pubSubClient = new PubSubClient();
const targetChannel = 'tungdiiltv';

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

const addTime = 30 * 60000;
const CAPE = 0;
const BART = 1;
const HELM = 2;
let zwergTime = [undefined, undefined, undefined];
const zwergStrings = ['das Cape', 'den Bart', 'den Helm'];

startup().then(r => console.log('chat client started')).catch(e => console.error('startup failed', e));

async function startup() {
	chatClient.on('message', onMessageHandler);
	chatClient.on('connected', onConnectedHandler);

	await chatClient.connect();
	await pubSubClient.registerUserListener(apiClient);

	//Tung: 444384436
	pubSubClient.onRedemption('444384436', function(message) {
		if (message.id === '3918cc27-4b68-4cd1-90c2-c7f39165485d') {
			onZwergReward(CAPE, 60000);
		} else if (message.id  === '7485f8d7-d39c-4530-a32e-eb35e3f6d5b9') {
			onZwergReward(BART, 60000);
		} else if (message.id  === 'd17a39e8-6a12-4fe9-95dc-25cf20b8f66f') {
			onZwergReward(HELM, 60000);
		} else if (message.id  === '2e6518e0-eba3-4ace-b219-233d4374f0ab') {
			rewardAll(60000);
		} else if (message.id  === '1c845b56-5e7d-48b2-82ec-a78a41486fdd') {
			chatClient.say(targetChannel, '!addpoints ' + message.userName + ' 500 🤖');
		} else if (message.id  === 'cfce5fc5-0da5-4078-a905-90a92ffdffd4') {
			chatClient.say(targetChannel, '!addpoints ' + message.userName + ' 6000 🤖');
		}
	}).catch(reason => console.error(reason));
}

function onConnectedHandler(addr, port) {
	console.log(`* Connected to ${addr}:${port}`);
}

function onMessageHandler(target, context, message, self) {
	if (self) { return; } // Ignore messages from the bot

	const msg = message.trim();
	const lmsg = msg.toLowerCase();

	//log
	const currentdate = new Date();
	console.log(currentdate.getHours() + ":" + currentdate.getMinutes() + ":"  + currentdate.getSeconds() + ` ` + context['display-name'] + ': ' + msg);

	if (lmsg.includes('tungdoof') && !msg.includes('tungdiDoof')) {
		chatClient.say(target, 'tungdiDoof');
	} else if ((msg.match('.* went all in and lost every single one of their \\d* .* LUL')
		|| msg.match('.* ist all in gegangen und .* verloren. .*'))
		&& context['user-id'] === '100135110') {
		chatClient.say(target, 'LUL');
	} else if (lmsg.startsWith('!leaderboard') || lmsg.match('!top.*')) {
		chatClient.say(target, 'Hier findest du die Nutzer, die am meisten Bier besitzen: https://streamelements.com/tungdiiltv/leaderboard 🤖');
	} /* else if (lmsg === '!arena') {
		//Smash Arena - Activate only at Smash Streams
		client.say(target, 'Tungs Smash Arena ist offen für jeden. Joined mit diesen Daten: ID: 3CF23 PW: 111 🤖');
	} */ else if (lmsg.startsWith('!level')) {
		chatClient.say(target, 'Mit !add LEV-ELC-ODE können SMM2-Level zur Queue hinzugefügt werden.');
	} else if (lmsg === '!queue') {
		chatClient.say(target, 'https://warp.world/streamqueue?streamer=tungdiiltv');
	} else if (isModerator(context)) {
		if (lmsg === '!cape') {
			onZwergReward(CAPE, 0, target);
		} else if (lmsg === '!bart') {
			onZwergReward(BART, 0, target);
		} else if (lmsg === '!helm') {
			onZwergReward(HELM, 0, target);
		} else if (lmsg === '!rüstung' || lmsg === '!kraft' || lmsg === '!all') {
			rewardAll(0, target);
		}
	}
}

function isModerator(context) {
	return context['mod'] || (context['badges'] !== null && context['badges'].hasOwnProperty('broadcaster'));
}

function onZwergReward(slotID, time = 0, target = targetChannel) {
	updateTime(slotID, time);
	chatClient.say(target, 'Tung muss ' + zwergStrings[slotID] + ' bis ' + makeTwoDigit(zwergTime[slotID].getHours()) + ':' + makeTwoDigit(zwergTime[slotID].getMinutes()) + ' tragen. 🤖');
	setTimeout(function() {
		checkTime(slotID, target);
	}, addTime + 5 + time);
}

function rewardAll(time = 0, target = targetChannel) {
	updateTime(CAPE, time);
	updateTime(BART, time);
	updateTime(HELM, time);
	chatClient.say(target, 'Tung hat die Zwergenrüstung angezogen! CoolCat 🤖');
	setTimeout(function() {
		checkTime(CAPE, target);
		checkTime(BART, target);
		checkTime(HELM, target);
	}, addTime + 5 + time);
}

function updateTime(slotID, time = 0) {
	if (zwergTime[slotID] === undefined)
		zwergTime[slotID] = new Date(new Date().getTime() + addTime + time);
	else
		zwergTime[slotID] = new Date(zwergTime[slotID].getTime() + addTime + time);
}

function checkTime(slotID, target) {
	if (zwergTime[slotID] === undefined)
		return;
	if (zwergTime[slotID] <= new Date()) {
		chatClient.say(target, 'Du kannst jetzt ' + zwergStrings[slotID] + ' abnehmen Tung. 🤖');
		zwergTime[slotID] = undefined;
	} else {
		setTimeout(function() {
			checkTime(slotID, target);
		}, addTime);
	}
}

function makeTwoDigit(value) {
	if (value < 10)
		return '0' + value;
	return '' + value;
}