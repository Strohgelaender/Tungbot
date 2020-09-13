const axios = require('axios');
require('dotenv').config();

let items;
let pointsName;
let channelName;

//TODO dynamic points name

const streamelements = axios.create({
	baseURL: 'https://api.streamelements.com/kappa/v2/',
	headers: {
		'Content-Type': 'application/json',
		'Authorization': 'Bearer ' + process.env.STREAMELEMENTS_TOKEN
	}
});

exports.setChannelName = name => channelName = name;

async function downloadStreamelementsItems() {
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
}

function onMessageHandler(target, context, message, self) {
	if (self)
		return;

	const msg = message.trim();
	const lmsg = msg.toLowerCase();

	if (items) {
		for (const item of items) {
			if (lmsg === '!' + item.bot.identifier.toLowerCase()) {
				redeemSound(item, context['display-name']).catch(e => console.error(e));
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
}

async function redeemSound(item, user) {
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
	await addPoints(channelName, item.cost, false);
	//Redeem Sound
	response = await streamelements.post(`store/${process.env.STREAMELEMENTS_USER_ID}/redemptions/${item._id}`);
	if (response.status === 200) {
		console.log(`Played Sound ${item.name}`);
		//Remove Points from User
		await addPoints(user, -item.cost, false);
	} else {
		console.log(response.data);
	}
}

exports.downloadStreamelementsItems = downloadStreamelementsItems;
exports.onMessageHandler = onMessageHandler;
exports.addPoints = addPoints;
exports.getTopList = getTopList;
exports.redeemSound = redeemSound;
