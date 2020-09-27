exports.getRandomInt = (min, max) => { //The maximum is exclusive and the minimum is inclusive
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min) + min);
};

exports.currentTimeString = () => {
	const date = new Date();
	return `${makeTwoDigit(date.getHours())}:${makeTwoDigit(date.getMinutes())}:${makeTwoDigit(date.getSeconds())}`;
};

function makeTwoDigit(value) {
	if (value < 10)
		return '0' + value;
	return '' + value;
}

exports.makeTwoDigit = makeTwoDigit;

exports.makeTimeString = (time) => time ? `${makeTwoDigit(time.getHours())}:${makeTwoDigit(time.getMinutes())}` : '';

exports.isModerator = context => context.userInfo.isMod || context.userInfo.isBroadcaster;

exports.checkCommand = (msg, command) => msg.match(`^!${command}(\\s.*)?$`);
