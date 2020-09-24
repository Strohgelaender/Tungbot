'use strict';

let socket;
let counterValue;

function setupCounter(counter) {
	//Load initial Counter value
	loadCounter(counter);
	//Fallback
	setInterval(() => loadCounter(counter), 10 * 60000);

	//connect WebSocket
	const loc = window.location;
	const new_uri = `${(loc.protocol === "https:") ? "wss:" : "ws:"}//${loc.host}/counter`;

	console.log(new_uri);

	socket = new WebSocket(new_uri);

	socket.onmessage = (msg) => {
		msg = JSON.parse(msg.data);
		if (msg.counter === counter) {
			updateCounter(msg.value);
		}
	};
}

function loadCounter(counter) {
	$.ajax({
		method: "GET",
		url: `/init?counter=${counter}`
	}).done(value => {
		updateCounter(value);
	}).catch(error => {
		console.log(error);
	});
}

function updateCounter(value) {
	counterValue = value;
	//TODO add Animation
	/*$('#number').animate({$top: '-40px'}, 100, () => {
		console.log('Animation done');
		$('#number').text(value).animate({$top: '0px'}, 100);
	}); */
	$('#number').text(value);
}