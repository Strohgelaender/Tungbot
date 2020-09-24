const {Timer} = require('./timer');

exports.getRandomInt = (min, max) => { //The maximum is exclusive and the minimum is inclusive
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min) + min);
}

exports.currentTimeString = () => {
	const date = new Date();
	return `${makeTwoDigit(date.getHours())}:${makeTwoDigit(date.getMinutes())}:${makeTwoDigit(date.getSeconds())}`;
}

function makeTwoDigit(value) {
	if (value < 10)
		return '0' + value;
	return '' + value;
}

exports.makeTwoDigit = makeTwoDigit;

exports.isModerator = context => context.userInfo.isMod || context.userInfo.isBroadcaster;

exports.createClothingTimer = (time, name, streamerName) => new Timer(time,
	`${streamerName} muss ${name} bis <TIME> tragen.`,
	`Du kannst jetzt ${name} abnehmen ${streamerName}.`,
	`${streamerName} muss ${name} derzeit nicht tragen.`);

exports.checkCommand = (msg, command) => msg.match(`^!${command}(\\s.*)?$`);
