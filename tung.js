const se = require('./streamelements');
const {say, run, chatClient, pubSubClient, currentTimeString, isModerator, makeTwoDigit} = require("./bot");

const targetChannel = '#tungdiiltv';
const targetChannelID = '444384436';

const addTime = 30 * 60000;
const CAPE = 0, BART = 1, HELM = 2;
const clothing = [{
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

let waterCount = 0; //TODO save value

startup();

async function startup() {
	await run(targetChannel, true);

	chatClient.on('message', se.onMessageHandler);
	chatClient.on('message', onMessageHandler);
	chatClient.on('raided', onRaidHandler);
	chatClient.on('hosted', onHostHandler);
	await pubSubClient.onRedemption(targetChannelID, onChannelPointHandler);
}

function onMessageHandler(target, context, message, self) {
	const msg = message.trim();
	const lmsg = msg.toLowerCase();

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
	} else if (lmsg.match('^!top\\d*')) {
		const num = parseInt(lmsg.substring(4)) || 5;
		se.getTopList(num, target)
			.then(topList => {
				if (topList)
					say(topList);
			}).catch(e => console.log(e));
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
		se.addPoints(message.userName, 500)
			.then(response => {
				if (response)
					say(response);
			}).catch(e => console.error(e));
	} else if (message.rewardId === 'cfce5fc5-0da5-4078-a905-90a92ffdffd4') {
		se.addPoints(message.userName, 6000).then(response => {
			if (response)
				say(response);
		}).catch(e => console.error(e));
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

function onRaidHandler(channel, username, viewers) {
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
		setTimeout(() => say(`!so ${username}`), 7500);
	}
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
		say(`Tung muss ${clothing[slot].name} derzeit nicht tragen.`, target);
	else {
		const timeStr = `${makeTwoDigit(clothing[slot].time.getHours())}:${makeTwoDigit(clothing[slot].time.getMinutes())}`;
		say(`Tung muss ${clothing[slot].name} bis ${timeStr} tragen.`, target);
	}
}

function updateZwergTimeout(slot, target = targetChannel) {
	if (clothing[slot].handler !== null) {
		clearTimeout(clothing[slot].handler);
	}
	clothing[slot].handler = setTimeout(function () {
		say(`Du kannst jetzt ${clothing[slot].name} abnehmen Tung.`, target);
		clothing[slot].time = null;
		clothing[slot].handler = null;
	}, clothing[slot].time.getTime() - new Date().getTime());
}

function rewardAll(target = targetChannel) {
	for (let i = 0; i < 3; i++) {
		updateTime(i, getTime(i));
		updateZwergTimeout(i, target);
	}
	say('Tung hat die Zwergenrüstung angezogen! CoolCat', target);
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