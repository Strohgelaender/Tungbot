const {getRandomInt} = require("./util");
const {say} = require("./bot");

const greetings = ['Moin', 'Moinsen', 'Servus', 'Hey', 'Willkommen im Stream', 'Hi', 'Hallo', 'Grüß dich', 'Tach', 'Grüß Gott', 'Grüezi'];
const emotes = ['tungdiHype', 'tungdiYoshi', 'tazzHey', 'luckwuHi', 'bytethHi', 'daskueHi', 'daskueHype', 'revedHi', 'sicuiCool', 'nralieSmile', 'PrideHeyyy'];

const greetedUsers = [];

const ignoredUsers = ['tungdiiltv', 'nightbot', 'streamelements', 'strohgelaender'];

const active = false;

function onMessageHandler(target, context, message, self) {
	if (self || !active)
		return;

	const username = context['username'];
	if (!ignoredUsers.includes(username) && !greetedUsers.includes(username)) {
		greetedUsers.push(username);
		const greeting = greetings[getRandomInt(0, greetings.length)];
		const emote = emotes[getRandomInt(0, emotes.length)];
		say(`${greeting} ${context['display-name']} ${emote} `);
	}

}

exports.onMessageHandler = onMessageHandler;