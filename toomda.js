const se = require('./streamelements');
const {run, chatClient} = require("./bot");

const targetChannel = '#toomda';

startup();
async function startup() {
	await run(targetChannel, false);
	se.setChannelName('toomda');
	chatClient.on('message', se.onMessageHandler);
}