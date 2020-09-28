const START = 'start';
const RENEW = 'renew';
const END = 'end';
const NOT_TIME = 'notTime';

exports.START = START;
exports.RENEW = RENEW;
exports.END = END;
exports.NOT_TIME = NOT_TIME;

exports.Timer = class Timer {

	constructor(addTime, calcTime = true) {
		this.addTime = addTime;
		this.time = null;
		this.timeoutHandler = null;
		this.calcTime = calcTime;
	}

	on(event, handler) {
		switch (event) {
			case START:
				this.startHandler = handler;
				break;
			case RENEW:
				this.renewHandler = handler;
				break;
			case END:
				this.endHandler = handler;
				break;
			case NOT_TIME:
				this.notTimeHandler = handler;
				break;
		}
	}

	reward(addTime = this.addTime, talk = true) {
		if (this.calcTime)
			addTime = this.getTime(addTime);

		const isStart = this.updateTime(addTime);
		if (talk)
			this.sendTime(isStart);
		this.updateTimeout();
	}

	updateTime(time = this.addTime) {
		if (this.time === null) {
			this.time = new Date(new Date().getTime() + time);
			return true;
		} else {
			this.time = new Date(this.time.getTime() + time);
			return false;
		}
	}

	sendTime(isStart = false) {
		if (this.time === null) {
			if (this.notTimeHandler)
				this.notTimeHandler();
		} else if (isStart) {
			if (this.startHandler)
				this.startHandler(this.time);
		} else if (this.renewHandler) {
			this.renewHandler(this.time);
		}
	}

	updateTimeout() {
		if (this.timeoutHandler !== null) {
			clearTimeout(this.timeoutHandler);
		}
		this.timeoutHandler = setTimeout(() => {
			if (this.endHandler)
				this.endHandler();
			this.time = null;
			this.timeoutHandler = null;
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