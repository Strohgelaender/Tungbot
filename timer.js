const util = require("./util");
const bot = require("./bot");

class Timer {
	constructor(addTime, startMessage, endMessage, notTimeMessage, calcTime = true, appendBot = true) {
		this.addTime = addTime;
		this.startMessage = startMessage;
		this.endMessage = endMessage;
		this.notTimeMessage = notTimeMessage;
		this.time = null;
		this.handler = null;
		this.calcTime = calcTime;
		this.appendBot = appendBot;
	}

	reward(addTime = this.addTime, talk = true) {
		if (this.calcTime)
			addTime = this.getTime(addTime);

		this.updateTime(addTime);
		if (talk)
			this.sendTime();
		this.updateTimeout();
	}

	updateTime(time = this.addTime) {
		if (this.time === null)
			this.time = new Date(new Date().getTime() + time);
		else
			this.time = new Date(this.time.getTime() + time);
	}

	sendTime() {
		if (this.time === null) {
			bot.say(this.notTimeMessage, this.appendBot);
		} else {
			const timeStr = `${util.makeTwoDigit(this.time.getHours())}:${util.makeTwoDigit(this.time.getMinutes())}`;
			bot.say(this.startMessage.replace('<TIME>', timeStr), this.appendBot);
		}
	}

	updateTimeout() {
		if (this.handler !== null) {
			clearTimeout(this.handler);
		}
		this.handler = setTimeout(() => {
			bot.say(this.endMessage, this.appendBot);
			this.time = null;
			this.handler = null;
		}, this.time.getTime() - new Date().getTime());
	}

	//adds one Minute addition time
	//if the clothes are not being worn currently.
	getTime(addTime) {
		if (this.time === null)
			return addTime + 60000;
		return addTime;
	}
}

exports.Timer = Timer;