const {run, say, getChatClient, pubSubClient} = require('./bot');
const se = require('./streamelements');
const timerManager = require('./timerManager');
const {currentTimeString} = require('./util');

const targetChannel = 'sicui';
const targetChannelID = '447731003';

startup().then(() => console.log('startup completed')).catch(console.error);

async function startup() {
	await run(targetChannel, {connectChat: true, connectPubSub: true});

	se.setChannelName(targetChannel);
	se.setPointsAddedMessage('%USER% hat sich %AMOUNT% %NAME% gekauft und besitzt jetzt %NEWAMOUNT% %NAME%.');

	timerManager.createEmoteOnlyTimer(3 * 60000, targetChannel, 'b78ab36c-ba18-40de-9027-ad8d4a3f62e3');

	await pubSubClient.onRedemption(targetChannelID, onChannelPointHandler);
	await pubSubClient.onRedemption(targetChannelID, timerManager.onChannelPointHandler);
}

function onChannelPointHandler(message) {
	//Log
	console.log(`${currentTimeString()} [Redemption] ${message.userDisplayName}: ${message.rewardName} (${message.rewardCost})`);

	if (message.rewardId === 'cd1ea83b-511d-4ea4-b75d-b25efa69e33d') {
		se.addPoints(message.userName, 500).then(say).catch(e => console.error(e.response.data));
	} else if (message.rewardId === '7296dc06-c731-4fb1-be12-6799879f9f04') {
		se.addPoints(message.userName, 6000).then(say).catch(e => console.error(e.response.data));
	} else if (message.rewardId === '03d7ebbe-3c9c-4b0f-aded-0f91b692e55a') {
		say(`/timeout ${message.userName} 180 Kanalbelohnung eingelöst.`);
	}
}