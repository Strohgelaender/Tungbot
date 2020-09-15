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
	return context['mod'] || (context['badges'] !== null && context['badges'].hasOwnProperty('broadcaster'));
}
exports.isModerator = isModerator;