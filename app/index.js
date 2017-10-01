var Tgfancy = require ('tgfancy');
var fs = require('fs');
var qpx = require('google-flights-api');
var port = process.env.PORT || 8443;
var host = process.env.HOST;
var externalURL = process.env.CUSTOM_ENV_VARIABLE || 'https://changiairbot.herokuapp.com' ;

const QPX_API_KEY = process.env.QPX_API_KEY;
const Telegram_API_KEY =process.env.Telegram_API_KEY; 
const options = { write: __dirname + '\\data'};
var google_qpx = new qpx(QPX_API_KEY, options);
var changiairbot = new Tgfancy (Telegram_API_KEY, {
	webHook: {
		port : port,
		host : host
	}
});

changiairbot.setWebHook(externalURL + ':443/bot' + Telegram_API_KEY)

changiairbot.on("text", function(message){

	var today = new Date();
	today = dateToday();
	var str = message.text+ '';
	if( str.toLowerCase() === "hi" || str.toLowerCase() === "hello"){
		changiairbot.sendMessage(message.chat.id , "Hi, I can tell you the cheapest flight between two locations.");
		changiairbot.sendMessage(message.chat.id , "Tell me the airport code of departure followed by the airport code of arrival and the date of travel.");
		changiairbot.sendMessage(message.chat.id , `Like 'HKG SIN ${today}' `);
	}else{
		console.log(`Request was made with incoming message: ${message.text}`)
		var token = str.split(" ");
		if(token.length == 3){
			today = token[2];
			var q = {
			   adultCount: 1, 
			   maxPrice: 'EUR5000', 
			   solutions: 100, 
			   origin: `${token[0]}`,
			   destination: `${token[1]}`, 
			   date: `${today}`
			};
			console.log(q.origin + ' --> ' + q.destination + ' on '+ token[2]  );
			google_qpx.query(q).then((res) => {
				fs.writeFileSync("response.json", JSON.stringify(res));
				var flag = false;
				var i =0;
				var numberOfFlights = res.trips.tripOption[0].slice[0];
				var cheapestPrice = res.trips.tripOption[0].saleTotal;
				changiairbot.sendMessage(message.chat.id , "Here is the cheapest flight I found!");
				changiairbot.sendMessage(message.chat.id , `${token[0]} ---> ${token[1]} at ${cheapestPrice}`);

				console.log(`${Object.keys(numberOfFlights).length-1} legs in this flight itenerary`);
				for(i=0 ; i<Object.keys(numberOfFlights).length ; i++) {

					var depTime = res.trips.tripOption[0].slice[0].segment[i].leg[0].departureTime;
					var formattedDepTime = formatTime(depTime);
					var arrTime = res.trips.tripOption[0].slice[0].segment[i].leg[0].arrivalTime;
					var formattedArrTime = formatTime(arrTime);

					var flightNum = res.trips.tripOption[0].slice[0].segment[i].flight.carrier + res.trips.tripOption[0].slice[0].segment[i].flight.number
					var legOrigin = res.trips.tripOption[0].slice[0].segment[i].leg[0].origin;
					var legDestination = res.trips.tripOption[0].slice[0].segment[i].leg[0].destination;
					console.log(`Leg ${i+1}: ${legOrigin} ---> ${legDestination} on ${flightNum}`);
					var messageResponse = `${legOrigin} ---> ${legDestination} on ${flightNum} \nDeparture Time\: ${formattedDepTime} \nArrival Time     \: ${formattedArrTime}`;
					changiairbot.sendMessage(message.chat.id , messageResponse);
				}
			}).catch(console.error);
		}
		else{
			changiairbot.sendMessage(message.chat.id , `The input \"${message.text}\" should have 3 distinct fields`);
			changiairbot.sendMessage(message.chat.id , "Tell me the airport code of departure followed by the airport code of arrival and the date of travel.");
			changiairbot.sendMessage(message.chat.id , `Like 'HKG SIN ${today}' `);
		}
	}	
});

function dateToday () {
	var today = new Date();
	var dd = today.getDate()+1;
	var mm = today.getMonth()+1; //January is 0!

	var yyyy = today.getFullYear();
	if(dd<10){
	    dd='0'+dd;
	} 
	if(mm<10){
	    mm='0'+mm;
	} 
	var today = yyyy+'-'+mm+'-'+dd;
	//console.log(today);
	return today
}

function formatTime(time){
	var tokenTime = time.split("T");
	var response = tokenTime[0] + "   " +tokenTime[1];
	return response;
}