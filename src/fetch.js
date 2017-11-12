const page = require('webpage').create(),
	user_info = require('user_info.json'),
	pageloader = require('libslimer/pageloader.js'),
	logging = require('libslimer/logging.js'),
	events = require('libslimer/events.js'),
	util = require('libslimer/util.js'),
	fs = require('fs');

logging.verbosity = 8;

events.onCallback(function(arg) {
	logging.crit(arg);
	if (arg === 'blockUI') {
		this.page.loadStarted(this.page.url, false);
	} else if (arg === 'unblockUI') {
		this.page.loadFinished('success', this.page.url, false);
	}
});

events.onLoadFinished(function() {
	page.evaluate(function() {
		if (!window.blockedUI_) {
			window.isBlocked = false;
			window.$.blockUI.defaults.onBlock = function() {
				if (!window.isBlocked) {
					window.callPhantom('blockUI');
					window.isBlocked = true;
				}
			};
			window.$.blockUI.defaults.onUnblock = function() {
				if (window.isBlocked) {
					window.callPhantom('unblockUI');
					window.isBlocked = false;
				}
			};
			window.blockedUI_ = true;
		}
	});
});

// click the elemenet with elementId
function click(elementId) {
	var element = page.evaluate(function(elementId){
		var elementRect = document.getElementById(elementId).getBoundingClientRect();
		return [elementRect.x, elementRect.y, elementRect.width, elementRect.height];
	}, elementId);
	page.sendEvent('click', element[0] + element[2] / 2, element[1] + element[3] / 2, 'left');
}

function pressEnter() {
	page.sendEvent('keypress', page.event.key.Return);
}

events.onConsoleMessage(function (msg) {
	logging.warn('CM:' + msg);
});

events.onError(function (msg, trace) {
	var msgStack = ['Error: ' + msg];
	if (trace && trace.length) {
		msgStack.push('Trace:');
		trace.forEach(function(t) {
			msgStack.push(` -> ${t.file}: ${t.line}`);
		});
	}
	console.log(msgStack.join('\n'));
});

events.init(page);

(async function() {
	page.viewportSize = { width: 960, height: 720};

	await page.open('https://piazza.com/class/i69uo2ijxwm4ql');

	click('email_field');
	page.sendEvent('keypress', user_info.username);

	click('password_field');
	page.sendEvent('keypress', user_info.password);
	await pageloader.load(pressEnter);

	click('search-box');
	// TODO: hard-coding, needs to be fixed
	page.sendEvent('keypress', 'CS 225');
	logging.warn(await pageloader.load(async function() {
		pressEnter();
		await util.wait(5000);
	}, undefined));

	while (true) {
		await util.wait(500);
		var quesIds = page.evaluate(function() {
			let questions = document.getElementsByClassName('feed_item');
			let result = [];
			for (let ques of questions) {
				result.push(ques.id);
			}
			return result;
		});
		if (quesIds && quesIds.length) {
			break;
		}
	}


	for (let ques of quesIds) {
		console.log('Question: ' + ques);

		await pageloader.load(() => click(ques), undefined);
		// TODO: check answered or unanswered
		let texts = page.evaluate(function() {
			let textElements = document.querySelectorAll('div.post_region_text');
			let result = [];
			for (let element of textElements) {
				result.push(element.innerText);
			}
			return result;
		});
		let dic = {};
		dic['Question'] = texts[0];
		if (texts.length > 1) {
			dic['Answer'] = texts[1];
		}
		fs.write('test.json', JSON.stringify(dic), 'w');
		// TODO: scroll down the page for each question
	}
}().catch((e)=> logging.error(e + '\n' + e.stack)));
