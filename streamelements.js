const axios = require('axios');
const {say} = require("./bot");
const {checkCommand} = require('./util');
require('dotenv').config();

let items;
let pointsName;
let channelName;

const streamelements = axios.create({
	baseURL: 'https://api.streamelements.com/kappa/v2/',
	headers: {
		'Content-Type': 'application/json',
		'Authorization': 'Bearer ' + process.env.STREAMELEMENTS_TOKEN
	}
});

exports.setChannelName = name => channelName = name;

async function downloadStreamelementsItems() {
	try {
		let response = await streamelements.get(`store/${process.env.STREAMELEMENTS_USER_ID}/items`);
		if (response.status !== 200) {
			console.log(response.data);
			return;
		}
		items = response.data;
		console.log('SE Items downloaded');

		response = await streamelements.get(`loyalty/${process.env.STREAMELEMENTS_USER_ID}`);
		if (response.status !== 200) {
			console.log(response.data);
			return;
		}
		pointsName = response.data.loyalty.name;
	} catch (e) {
		console.error('Streamelements Setup failed', e.response.data);
	}
}

function onMessageHandler(target, context, message, self) {
	if (self)
		return;

	const msg = message.trim();
	const lmsg = msg.toLowerCase();

	if (items) {
		for (const item of items) {
			if (checkCommand(lmsg, item.bot.identifier.toLowerCase())) {
				redeemSound(item, context['username']).then(say);
				break;
			}
		}
	}
}

async function addPoints(user, amount) {
	const response = await streamelements.put(`points/${process.env.STREAMELEMENTS_USER_ID}/${user}/${amount}`);
	if (response.status !== 200) {
		console.log(response.data);
		return;
	}
	return `${user} hat an der Bar ${amount} ${pointsName} bestellt und besitzt jetzt ${response.data.newAmount} ${pointsName}.`;
}

async function getTopList(limit = 5) {
	try {
		const response = await streamelements.get(`points/${process.env.STREAMELEMENTS_USER_ID}/top?limit=${limit}`);
		if (response.status !== 200) {
			console.log(response.data);
			return;
		}
		let toplist = `Die Top ${limit} Nutzer mit am meisten ${pointsName}: `
		for (let i = 0; i < response.data.users.length; i++) {
			const user = response.data.users[i];
			toplist += `${i + 1}: ${user.username} (${user.points}), `;
		}
		return toplist.slice(0, -2);
	} catch (e) {
		console.error(e.response.data);
	}
}

async function redeemSound(item, user) {
	try {
		//Check if user has enough Points
		let response = await streamelements.get(`points/${process.env.STREAMELEMENTS_USER_ID}/${user}`);
		if (response.status !== 200) {
			console.log(response.data);
			return;
		}
		if (response.data.points < item.cost) {
			return `Leider hast du nicht genug ${pointsName} für diesen Command ${user} sicuiCry Du brauchst mindestens ${item.cost} ${pointsName}.`;
		}
		//Add Ponts to Owner Account
		await addPoints(channelName, item.cost);
		//Redeem Sound
		response = await streamelements.post(`store/${process.env.STREAMELEMENTS_USER_ID}/redemptions/${item._id}`);
		if (response.status === 200) {
			console.log(`Played Sound ${item.name}`);
			if (user !== channelName) {
				//Remove Points from User
				await addPoints(user, -item.cost);
			}
		} else {
			console.log(response.data);
		}
	} catch (e) {
		console.error(e.response.data);
	}
}

async function getCounterValue(counter) {
	const response = await streamelements.get(`bot/${process.env.STREAMELEMENTS_USER_ID}/counters/${counter}`);
	if (response.status !== 200) {
		console.log(response.data);
		return;
	}
	return response.data.value;
}

exports.downloadStreamelementsItems = downloadStreamelementsItems;
exports.onMessageHandler = onMessageHandler;
exports.addPoints = addPoints;
exports.getTopList = getTopList;
exports.redeemSound = redeemSound;
exports.getCounterValue = getCounterValue;

