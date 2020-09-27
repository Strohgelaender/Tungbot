const {say} = require("./bot");
const {Timer, START, RENEW, END, NOT_TIME} = require('./timer');
const {isModerator, checkCommand, makeTimeString} = require('./util');

const timerCommands = new Map();
const timerRewards = new Map();

exports.onMessageHandler = (target, user, message, context) => {
	const msg = message.trim().toLowerCase();

	for (const [command, timer] of timerCommands) {
		if (checkCommand(msg, command)) {
			const args = msg.substring(command.length + 1).trim();
			const mod = isModerator(context);
			if (!mod || args.startsWith('time')) {
				timer.sendTime();
			} else if (mod) {
				if (args.match('^add -?\\d+$')) {
					//add / remove time
					const time = parseInt(args.substring(4)) * 60000;
					timer.reward(time);
				} else {
					timer.reward();
				}
			}
			break;
		}
	}
}

exports.onChannelPointHandler = message => {
	for (const [rewardId, timer] of timerRewards) {
		if (message.rewardId === rewardId) {
			timer.reward();
		}
	}
}

exports.registerTimer = (timer, command, rewardId) => {
	if (command)
		timerCommands.set(command, timer);
	if (rewardId)
		timerRewards.set(rewardId, timer);
}

exports.createClothingTimer = (time, name, streamerName) => {
	const timer = new Timer(time);
	const timeHandler = time => say(`${streamerName} muss ${name} bis ${makeTimeString(time)} tragen.`);
	timer.on(START, timeHandler);
	timer.on(RENEW, timeHandler);
	timer.on(END, () => say(`Du kannst jetzt ${name} abnehmen ${streamerName}.`));
	timer.on(NOT_TIME, () => say(`${streamerName} muss ${name} derzeit nicht tragen.`));
	return timer;
};