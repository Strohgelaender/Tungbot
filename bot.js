const {ApiClient, RefreshableAuthProvider, StaticAuthProvider} = require('twitch');
const {PubSubClient} = require('twitch-pubsub-client');
const { ChatClient } = require('twitch-chat-client');
const se = require("./streamelements");
const {currentTimeString} = require("./util");

require('dotenv').config();

const scopes = ['channel:read:redemptions', 'user:read:email', 'chat:edit', 'chat:read', 'channel:moderate'];
const authProvider = new RefreshableAuthProvider(
	new StaticAuthProvider(process.env.CLIENT_ID, process.env.CHANNEL_OAUTH_TOKEN, scopes),
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

exports.run = async (target, config) => {
	targetChannel = '#' + target;
	const opts = {
		channels: [target]
	};
	chatClient = new ChatClient(authProvider, opts);

	try {
		await startup(config);
		//refresh Token every two hours
		//workaround for a bug in the authProvider-library
		setInterval(() => authProvider.refresh(), 2 * 60 * 60 * 1000);
	} catch(e) {
			console.error('startup failed', e);
			return;
	}
	console.log('chat client started');
}

async function startup(config) {
	if (config.connectChat) {
		await connectChatClient();
	}
	if (config.downloadSE) {
		await se.downloadStreamelementsItems();
	}
	if (config.connectPubSub) {
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