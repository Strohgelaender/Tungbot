const {getRandomInt} = require("./util");
const {say} = require("./bot");

const greetings = ['Moin', 'Moinsen', 'Servus', 'Hey', 'Willkommen im Stream', 'Hi', 'Hallo', 'Grüß dich', 'Tach', 'Grüß Gott', 'Grüezi'];
const emotes = ['tungdiHype', 'tungdiYoshi', 'tazzHey', 'luckwuHi', 'bytethHi', 'daskueHi', 'daskueHype', 'revedHi', 'sicuiCool', 'akunzaHelloi', 'CoolCat', 'nralieSmile', 'PrideHeyyy'];

const greetedUsers = [];

const ignoredUsers = ['tungdiiltv', 'nightbot', 'streamelements', 'strohgelaender', 'warpworldbot'];

const active = false;

function onMessageHandler(target, user, message, context) {
	if (!active)
		return;

	if (!ignoredUsers.includes(user) && !greetedUsers.includes(user)) {
		greetedUsers.push(user);
		const greeting = greetings[getRandomInt(0, greetings.length)];
		const emote = emotes[getRandomInt(0, emotes.length)];
		say(`${greeting} ${context.userInfo.displayName} ${emote} `);
	}

}

exports.onMessageHandler = onMessageHandler;