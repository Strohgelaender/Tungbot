const {Timer} = require('./timer');
const {isModerator, checkCommand} = require('./util');

const timerCommands = new Map();
const timerRewards = new Map();

function onMessageHandler(target, context, message, self) {
	if (self)
		return;

	const msg = message.trim().toLowerCase();

	for (const [command, timer] of timerCommands) {
		if (checkCommand(msg, command)) {
			const args = msg.substring(command.length + 1).trim();
			if (!isModerator(context) || args.startsWith('time')) {
				timer.sendTime();
			} else if (isModerator(context)) {
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

function onChannelPointHandler(message) {
	for (const [rewardId, timer] of timerRewards) {
		if (message.rewardId === rewardId) {
			timer.reward();
		}
	}
}

function registerTimer(timer, command, rewardId) {
	if (command)
		timerCommands.set(command, timer);
	if (rewardId)
		timerRewards.set(rewardId, timer);
}

exports.onMessageHandler = onMessageHandler;
exports.onChannelPointHandler = onChannelPointHandler;
exports.registerTimer = registerTimer;