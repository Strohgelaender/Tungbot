const se = require('./streamelements');
const seSocket = require('./streamelementsWebSocket');
const obs = require('./obs');
const {getCurrentScene, switchScene, setFilterVisibility} = obs;
const server = require('./server');
const {say, run, getChatClient, pubSubClient} = require("./bot");
const greeting = require('./greeting');
const {makeTwoDigit, isModerator, currentTimeString, createClothingTimer, checkCommand} = require("./util");
const timerManager = require('./timerManager');
const {Timer} = require('./timer');

//OBS Scenes
const GAMING = 'Gaming';
const GAMING_FC = 'Gaming - FC Chatting';
const JUST_CHATTING = 'Just Chatting';
const JUST_CHATTING_SMALL = 'Bildschirm Just Chatting';

const targetChannel = 'tungdiiltv';
const targetChannelID = '444384436';
let chatClient;

const addTime = 30 * 60000;
const timerData = [{
	name: 'das Cape',
	command: 'cape',
	rewardId: '3918cc27-4b68-4cd1-90c2-c7f39165485d',
	timer: null
}, {
	name: 'den Bart',
	command: 'bart',
	rewardId: '7485f8d7-d39c-4530-a32e-eb35e3f6d5b9',
	timer: null
}, {
	name: 'den Helm',
	command: 'helm',
	rewardId: 'd17a39e8-6a12-4fe9-95dc-25cf20b8f66f',
	timer: null
}];

let waterCount = 0; //TODO save value

startup().then(() => console.log('setup finished')).catch(e => console.error(e));

async function startup() {
	await run(targetChannel, true);

	chatClient = getChatClient();

	chatClient.onMessage(se.onMessageHandler);
	chatClient.onMessage(onMessageHandler);
	chatClient.onMessage(timerManager.onMessageHandler);
	chatClient.onMessage(greeting.onMessageHandler);
	chatClient.onRaid(onRaidHandler);
	chatClient.onHosted(onHostHandler);

	se.setChannelName(targetChannel);
	await seSocket.setupStreamelementsClient();
	seSocket.onFollow(onFollowHandler);

	setupTimers();
	await pubSubClient.onRedemption(targetChannelID, onChannelPointHandler);
	await pubSubClient.onRedemption(targetChannelID, timerManager.onChannelPointHandler);

	await obs.connect();
}

function setupTimers() {
	for (const data of timerData) {
		const timer = createClothingTimer(addTime, data.name, 'Tung');
		timerManager.registerTimer(timer, data.command, data.rewardId);
		data.timer = timer;
	}
	timerManager.registerTimer(new Timer(2 * 60000, '/emoteonly', '/emoteonlyoff', null, false, false), null, '4134f9e6-aeb6-43fa-a501-5cf3410b7d78');
}

function onMessageHandler(target, user, message, context) {
	const msg = message.trim();
	const lmsg = msg.toLowerCase();

	if (lmsg.match('^!top\\s?\\d*$')) {
		const num = parseInt(lmsg.substring(4).trim()) || 5;
		se.getTopList(num, target).then(say).catch(console.log);
	} else if (isModerator(context)) {
		if (lmsg === '!rüstung' || lmsg === '!kraft' || lmsg === '!all') {
			rewardAll(target);
		} else if (checkCommand(lmsg, 'cam')) {
			switchCamScene().catch(console.error);
		} else if (checkCommand(lmsg, 'bigcam')) {
			switchScene(JUST_CHATTING).catch(console.error);
		}
	}
}

function onChannelPointHandler(message) {
	//Log
	console.log(`${currentTimeString()} [Redemption] ${message.userDisplayName}: ${message.rewardName} (${message.rewardCost})`);

	if (message.rewardId === '2e6518e0-eba3-4ace-b219-233d4374f0ab') {
		rewardAll();
	} else if (message.rewardId === '1c845b56-5e7d-48b2-82ec-a78a41486fdd') {
		se.addPoints(message.userName, 500).then(say).catch(e => console.error(e.response.data));
	} else if (message.rewardId === 'cfce5fc5-0da5-4078-a905-90a92ffdffd4') {
		se.addPoints(message.userName, 6000).then(say).catch(e => console.error(e.response.data));
	} else if (message.rewardId === 'b28d8dc9-adf6-4ab7-b75e-6ae55102d148') {
		say(`/timeout ${message.userName} 120 Kanalbelohnung eingelöst.`);
	} else if (message.rewardId === '6da58703-f497-4483-ac97-45ed011644e9') {
		waterCount++;
		say(`🚰 Der Chat hat heute ${waterCount} mal dafür gesorgt, dass Tung genug Wasser trinkt. Prost!`);
	}
}

function onFollowHandler(followEvent) {
	say(`Danke für deinen Follow ${followEvent.username} tungdiHype `);
}

function onRaidHandler(channel, username, raidInfo) {
	console.log(`${currentTimeString()} [Raid] ${username} (${raidInfo.viewerCount})`)
	shoutout(channel, raidInfo.displayName, raidInfo.viewerCount);
}

function onHostHandler(channel, username, autohost, viewers) {
	console.log(`${currentTimeString()} [Host] ${username} (${viewers})`);
	if (!autohost)
		shoutout(channel, username, viewers);
}

function shoutout(channel, username, viewers) {
	if (viewers >= 2) {
		setTimeout(() => say(`!so ${username}`), 7500);
	}
}

function rewardAll() {
	let message = 'Tung muss';
	for (const data of timerData) {
		data.timer.reward(undefined, false);
		const time = data.timer.getTimeString();
		message += ` ${data.name} bis ${time},`;
	}
	message = message.slice(0, -1) + ' tragen.';
	say(message);
}

async function switchCamScene() {
	const currentScene = getCurrentScene();
	if (currentScene === GAMING)
		await switchScene(GAMING_FC);
	else if (currentScene === GAMING_FC)
		await switchScene(GAMING);
	else if (currentScene === JUST_CHATTING_SMALL)
		await switchScene(GAMING);
	else if (currentScene === JUST_CHATTING)
		await switchScene(JUST_CHATTING_SMALL);
}