const se = require('./streamelements');
const {run, getChatClient} = require("./bot");

const targetChannel = '#toomda';

startup();

async function startup() {
	await run(targetChannel, {connectChat: true, downloadSE: true});
	se.setChannelName('toomda');
	getChatClient().onMessage(se.onMessageHandler);
}