const {Timer} = require('./timer');

function getRandomInt(min, max) { //The maximum is exclusive and the minimum is inclusive
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min) + min);
}

exports.getRandomInt = getRandomInt;

function currentTimeString() {
	const date = new Date();
	return `${makeTwoDigit(date.getHours())}:${makeTwoDigit(date.getMinutes())}:${makeTwoDigit(date.getSeconds())}`;
}

exports.currentTimeString = currentTimeString;

function makeTwoDigit(value) {
	if (value < 10)
		return '0' + value;
	return '' + value;
}

exports.makeTwoDigit = makeTwoDigit;

function isModerator(context) {
	return context.userInfo.isMod || context.userInfo.isBroadcaster;
}

exports.isModerator = isModerator;

function createClothingTimer(time, name, streamerName) {
	return new Timer(time, `${streamerName} muss ${name} bis <TIME> tragen.`, `Du kannst jetzt ${name} abnehmen ${streamerName}.`, `${streamerName} muss ${name} derzeit nicht tragen.`);
}

exports.createClothingTimer = createClothingTimer;

function checkCommand(msg, command) {
	return msg.match(`^!${command}(\\s.*)?$`);
}

exports.checkCommand = checkCommand;