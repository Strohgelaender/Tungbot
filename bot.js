const { ApiClient, RefreshableAuthProvider, StaticAuthProvider, ClientCredentialsAuthProvider } = require('twitch');
const { PubSubClient } = require('twitch-pubsub-client');
const tmi = require('tmi.js');

require('dotenv').config();

const scopes = 'channel:read:redemptions user:read:email chat:edit chat:read'
const authProvider = new StaticAuthProvider(process.env.CLIENT_ID, process.env.CHANNEL_OAUTH_TOKEN);
const refresh = new RefreshableAuthProvider(authProvider, {
	clientSecret: process.env.CLIENT_SECRET,
	refreshToken: process.env.CHANNEL_REFRESH_TOKEN
} );
const apiClient = new ApiClient({ authProvider });
const pubSubClient = new PubSubClient();

const opts = {
	identity: {
		username: process.env.CHAT_USERNAME,
		password: process.env.CHAT_OAUTH_TOKEN
	},
	channels: [
		'strohgelaender',
		'tungdiiltv'
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
		console.log(message);
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
	} else if (context.hasOwnProperty('custom-reward-id')) {
		if (context['custom-reward-id'] === '3918cc27-4b68-4cd1-90c2-c7f39165485d') {
			onZwergReward(target, CAPE, 60000);
		} else if (context['custom-reward-id'] === '7485f8d7-d39c-4530-a32e-eb35e3f6d5b9') {
			onZwergReward(target, BART, 60000);
		} else if (context['custom-reward-id'] === 'd17a39e8-6a12-4fe9-95dc-25cf20b8f66f') {
			onZwergReward(target, HELM, 60000);
		} else if (context['custom-reward-id'] === '2e6518e0-eba3-4ace-b219-233d4374f0ab') {
			rewardAll(target, 60000);
		} else if (context['custom-reward-id'] === '1c845b56-5e7d-48b2-82ec-a78a41486fdd') {
			chatClient.say(target, '!addpoints ' + context['display-name'] + ' 500 🤖');
		} else if (context['custom-reward-id'] === 'cfce5fc5-0da5-4078-a905-90a92ffdffd4') {
			chatClient.say(target, '!addpoints ' + context['display-name'] + ' 6000 🤖');
		}
	} else if (isModerator(context)) {
		if (lmsg === '!cape') {
			onZwergReward(target, CAPE);
		} else if (lmsg === '!bart') {
			onZwergReward(target, BART);
		} else if (lmsg === '!helm') {
			onZwergReward(target, HELM);
		} else if (lmsg === '!rüstung' || lmsg === '!kraft' || lmsg === '!all') {
			rewardAll(target);
		}
	}
}

function isModerator(context) {
	return context['mod'] || (context['badges'] !== null && context['badges'].hasOwnProperty('broadcaster'));
}

function onZwergReward(target, slotID, additionalTime) {
	const time = additionalTime === undefined ? 0 : additionalTime;
	updateTime(slotID, time);
	chatClient.say(target, 'Tung muss ' + zwergStrings[slotID] + ' bis ' + makeTwoDigit(zwergTime[slotID].getHours()) + ':' + makeTwoDigit(zwergTime[slotID].getMinutes()) + ' tragen. 🤖');
	setTimeout(function() {
		checkTime(target, slotID);
	}, addTime + 5 + time);
}

function rewardAll(target, additionalTime) {
	const time = additionalTime === undefined ? 0 : additionalTime;
	updateTime(CAPE, time);
	updateTime(BART, time);
	updateTime(HELM, time);
	chatClient.say(target, 'Tung hat die Zwergenrüstung angezogen! CoolCat 🤖');
	setTimeout(function() {
		checkTime(target, CAPE);
		checkTime(target, BART);
		checkTime(target, HELM);
	}, addTime + 5 + time);
}

function updateTime(slotID, additionalTime) {
	const time = additionalTime === undefined ? 0 : additionalTime;
	if (zwergTime[slotID] === undefined)
		zwergTime[slotID] = new Date(new Date().getTime() + addTime + time);
	else
		zwergTime[slotID] = new Date(zwergTime[slotID].getTime() + addTime + time);
}

function checkTime(target, slotID) {
	if (zwergTime[slotID] === undefined)
		return;
	if (zwergTime[slotID] <= new Date()) {
		chatClient.say(target, 'Du kannst jetzt ' + zwergStrings[slotID] + ' abnehmen Tung. 🤖');
		zwergTime[slotID] = undefined;
	} else {
		setTimeout(function() {
			checkTime(target, slotID);
		}, addTime);
	}
}

function makeTwoDigit(value) {
	if (value < 10)
		return '0' + value;
	return '' + value;
}