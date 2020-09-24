const {ApiClient, RefreshableAuthProvider, StaticAuthProvider} = require('twitch');
const {InvalidTokenError} = require('twitch-auth');
const {PubSubClient} = require('twitch-pubsub-client');
const { ChatClient } = require('twitch-chat-client');
const se = require("./streamelements");
const {currentTimeString} = require("./util");

require('dotenv').config();

const scopes = 'channel:read:redemptions user:read:email chat:edit chat:read'
const authProvider = new RefreshableAuthProvider(
	new StaticAuthProvider(process.env.CLIENT_ID, process.env.CHANNEL_OAUTH_TOKEN),
	{
		clientSecret: process.env.CLIENT_SECRET,
		refreshToken: process.env.CHANNEL_REFRESH_TOKEN,
		onRefresh: token => {
			console.log('refreshed Token.');
			//TODO save
		}
	}
);
const apiClient = new ApiClient({authProvider});
const pubSubClient = new PubSubClient();
exports.pubSubClient = pubSubClient;

let chatClient;
exports.getChatClient = () => chatClient;

let targetChannel;

exports.run = async (target, connectPubSub = false) => {
	targetChannel = '#' + target;
	const opts = {
		channels: [target]
	};
	chatClient = new ChatClient(authProvider, opts);
	try {
		await startup(connectPubSub);
	} catch(e) {
		if (connectPubSub && e instanceof InvalidTokenError) {
			await authProvider.refresh();
			await connectPubSubClient();
		} else
			console.error('startup failed', e);
	}
	console.log('chat client started')
}

async function startup(connectPubSub) {
	await connectChatClient();
	await se.downloadStreamelementsItems();
	if (connectPubSub) {
		await connectPubSubClient();
	}
}

async function connectChatClient() {
	chatClient.onConnect(onConnectedHandler);

	await chatClient.connect();

	chatClient.onMessage(onMessageHandler);
}

async function connectPubSubClient() {
	await pubSubClient.registerUserListener(apiClient);
}

function onConnectedHandler() {
	console.log('* Connected to Twitch Chat.');
}

function onMessageHandler(target, user, message) {
	logMessage(user, message.trim());
}

function logMessage(user, msg) {
	console.log(`${currentTimeString()} ${user}: ${msg}`);
}

exports.say = (message, appendBot = true, target = targetChannel) => {
	if (message) {
		message += appendBot ? ' 🤖' : '';
		chatClient.say(target, message);
		//twitch.js does not pass own messages to the handlers, so it gets logged here
		logMessage(target, message);
	}
}