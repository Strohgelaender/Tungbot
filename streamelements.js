const axios = require('axios');
const {say} = require("./bot");
const {checkCommand} = require('./util');
require('dotenv').config();

let items;
let pointsName;
let pointsAddedMessage;
let channelName;

const streamelements = axios.create({
	baseURL: 'https://api.streamelements.com/kappa/v2/',
	headers: {
		'Content-Type': 'application/json',
		'Authorization': 'Bearer ' + process.env.STREAMELEMENTS_TOKEN
	}
});

exports.setChannelName = name => channelName = name;

exports.setPointsAddedMessage = msg => pointsAddedMessage = msg;

exports.downloadStreamelementsItems = async () => {
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

exports.onMessageHandler = (target, user, message) => {
	const msg = message.trim();
	const lmsg = msg.toLowerCase();

	for (const item of (items || [])) {
		if (checkCommand(lmsg, item.bot.identifier.toLowerCase())) {
			redeemSound(item, user).then(say);
			break;
		}
	}
}

async function addPoints(user, amount) {
	const response = await streamelements.put(`points/${process.env.STREAMELEMENTS_USER_ID}/${user}/${amount}`);
	if (response.status !== 200) {
		console.log(response.data);
		return;
	}
	return (pointsAddedMessage || '').replace(/%USER%/g, user)
		.replace(/%AMOUNT%/g, amount)
		.replace(/%NAME%/g, pointsName)
		.replace(/%NEWAMOUNT%/g, response.data.newAmount);
}

exports.addPoints = addPoints;

async function checkPoints(user, amount, talk = true) {
	//Check if user has enough Points
	let response = await streamelements.get(`points/${process.env.STREAMELEMENTS_USER_ID}/${user}`);
	if (response.status !== 200) {
		console.log(response.data);
		return false;
	}
	if (response.data.points < amount) {
		if (talk)
			say(`Leider hast du nicht genug ${pointsName} für diesen Command ${user} sicuiCry Du brauchst mindestens ${amount} ${pointsName}.`);
		return false;
	}
	return true;
}

exports.checkPoints = checkPoints;

exports.getTopList = async (limit = 5) => {
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
	await payWithPoints(user, item.cost, async () => {
		//Add Points to Owner Account
		await addPoints(channelName, item.cost);
		//Redeem Sound
		const response = await streamelements.post(`store/${process.env.STREAMELEMENTS_USER_ID}/redemptions/${item._id}`);
		if (response.status === 200) {
			console.log(`Played Sound ${item.name}`);
			return user !== channelName;
		}
		return false;
	});
}

async function payWithPoints(user, amount, itemHandler, talk) {
	try {
		if (!await checkPoints(user, amount, talk))
			return;

		if (await itemHandler()) {
			//Remove Points from User
			await addPoints(user, -amount);
		}
	} catch (e) {
		if (e.hasOwnProperty('response'))
			console.error(e.response.data);
		else
			console.error(e);
	}
}

exports.payWithPoints = payWithPoints;

exports.getCounterValue = async counter => {
	const response = await streamelements.get(`bot/${process.env.STREAMELEMENTS_USER_ID}/counters/${counter}`);
	if (response.status !== 200) {
		console.log(response.data);
		return;
	}
	return response.data.value;
}

