const {ApiClient, RefreshableAuthProvider, StaticAuthProvider} = require('twitch');
const {InvalidTokenError} = require('twitch-auth');
const {PubSubClient} = require('twitch-pubsub-client');
const tmi = require('tmi.js');
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

const opts = {
	identity: {
		username: process.env.CHAT_USERNAME,
		password: process.env.CHAT_OAUTH_TOKEN
	},
	connection: {timeout: 2000, reconnect: true}
};

const chatClient = new tmi.client(opts);
exports.chatClient = chatClient;

let targetChannel;

async function run(target, connectPubSub = false) {
	targetChannel = target;
	opts.channels = [target];
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
exports.run = run;

async function startup(connectPubSub) {
	await connectChatClient();
	await se.downloadStreamelementsItems();
	if (connectPubSub) {
		await connectPubSubClient();
	}
}

async function connectChatClient() {
	chatClient.on('message', onMessageHandler);
	chatClient.on('connected', onConnectedHandler);

	await chatClient.connect();
}

async function connectPubSubClient() {
	await pubSubClient.registerUserListener(apiClient);
}

function onConnectedHandler(addr, port) {
	console.log(`* Connected to ${addr}:${port}`);
}

function onMessageHandler(target, context, message, self) {
	const msg = message.trim();

	console.log(`${currentTimeString()} ${context['display-name']}: ${msg}`);
}

function say(message, target = targetChannel) {
	chatClient.say(target, message + ' 🤖');
}
exports.say = say;