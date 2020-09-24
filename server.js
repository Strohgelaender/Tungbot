const seSocket = require('./streamelementsWebSocket');
const seRequest = require('./streamelements');

const path = require('path');
const express = require('express');
const app = express();

const expressWs = require('express-ws')(app);
const counterWs = [];

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started at port ${PORT}`));

app.use(express.static('public'));

app.get('/', (req, res) => {
	res.send('The Server is up and running');
});

app.get('/deaths', (req, res) => {
	res.redirect('/html/deaths.html');
});

//TODO use template engine
app.get('/wins', (req, res) => {
	res.redirect('/html/wins.html');
});

app.get('/init', async function (req, res) {
	if (!req.query.counter) {
		return res.status(400).json('No counter specified');
	}
	const val = await seRequest.getCounterValue(req.query.counter)
	return res.send(val.toString());
});

app.ws('/counter', (ws, req) => {
	counterWs.push(ws);
});

function updateCounter(counter) {
	if (counterWs.length === 0) {
		console.log('Websocket not active yet');
		return;
	}
	for (const ws of counterWs) {
		if (ws.readyState === ws.OPEN) {
			ws.send(JSON.stringify(counter));
		}
	}
}

seSocket.setupStreamelementsClient().then(() => {
	seSocket.onCounter(counter => {
		updateCounter(counter);
	});
});