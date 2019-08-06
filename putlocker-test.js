const Curl = require('curl-request');
const cheerio = require('cheerio');

async function request(url, headers = []) {
	let req = new Curl();
	req.setHeaders(headers);
	return req.get(url);
}

async function main() {
	let $, html;
	let MOVIE_URL = "https://www6.putlockertv.to/watch/once-upon-a-time-in-hollywood.90okx";
	let MOVIE_ID = MOVIE_URL.substring(MOVIE_URL.lastIndexOf('.') + 1);
	html = await request(MOVIE_URL, [
		'authority: www6.putlockertv.to',
		'pragma: no-cache',
		'cache-control: no-cache',
		'upgrade-insecure-requests: 1',
		'user-agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.98 Safari/537.36',
		'accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
		'accept-language: en-US,en;q=0.9',
		'cookie: __cfduid=d395ee22c151a5a33116b5f6a642cadf91563857341; watching=%7B%2290okx%22%3A%22CAM%22%2C%22ppk79%22%3A%22HD%22%7D; waf_token=1564710020-acf55c3ad7bb6445eb6098f9d377bae8'
	]);
	$ = cheerio.load(html.body);

	let ts = $('html').data('ts');

	let _ = Date.now() % 10000;

	html = await request(`https://www6.putlockertv.to/ajax/film/servers/${MOVIE_ID}`, [
		'authority: www6.putlockertv.to',
		'pragma: no-cache',
		'cache-control: no-cache',
		'upgrade-insecure-requests: 1',
		'user-agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.98 Safari/537.36',
		'accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
		'accept-language: en-US,en;q=0.9',
		'cookie: __cfduid=d395ee22c151a5a33116b5f6a642cadf91563857341; watching=%7B%2290okx%22%3A%22CAM%22%2C%22ppk79%22%3A%22HD%22%7D; waf_token=1564710020-acf55c3ad7bb6445eb6098f9d377bae8'
	]);
	console.log(html.body);
	$ = cheerio.load(html.body.html);
	let active = $('a.active');
	html = await request(`https://www6.putlockertv.to/ajax/episode/info?ts=${ts}&_=${_}&id=${active.data('id')}&server=${active.closest('.server').data('id')}&update=0`, [
		'authority: www6.putlockertv.to',
		'pragma: no-cache',
		'cache-control: no-cache',
		'upgrade-insecure-requests: 1',
		'user-agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.98 Safari/537.36',
		'accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
		'accept-language: en-US,en;q=0.9',
		'cookie: __cfduid=d395ee22c151a5a33116b5f6a642cadf91563857341; watching=%7B%2290okx%22%3A%22CAM%22%2C%22ppk79%22%3A%22HD%22%7D; waf_token=1564710020-acf55c3ad7bb6445eb6098f9d377bae8'
	]);
	console.log(`https://www6.putlockertv.to/ajax/episode/info?ts=${ts}&_=${_}&id=${active.data('id')}&server=${active.closest('.server').data('id')}&update=0`,html);
}
main();
