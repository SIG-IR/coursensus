const page = require('webpage').create(),
	user_info = require('user_info.json');

(async function() {
	page.viewportSize = { width: 960, height: 720};

	await page.open('https://piazza.com/class/i69uo2ijxwm4ql');

	var email = page.evaluate( function() {
		var email_rect = document.getElementById('email_field').getBoundingClientRect();
		return [email_rect.x, email_rect.y, email_rect.width, email_rect.height];
	});
	page.sendEvent('click', email[0] + email[2] / 2, email[1] + email[3] / 2, 'left');
	page.sendEvent('keypress', user_info.username);

	var password = page.evaluate( function() {
		var password_rect = document.getElementById('password_field').getBoundingClientRect();
		return [password_rect.x, password_rect.y, password_rect.width, password_rect.height];
	});
	page.sendEvent('click', password[0] + password[2] / 2, password[1] + password[3] / 2, 'left');
	page.sendEvent('keypress', user_info.password);

	page.sendEvent('keypress', page.event.key.Return);
}());