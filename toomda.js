const se = require('./streamelements');
const {run, getChatClient} = require("./bot");

const targetChannel = '#toomda';

startup();
async function startup() {
	await run(targetChannel, false);
	se.setChannelName('toomda');
	getChatClient().onMessage(se.onMessageHandler);
}