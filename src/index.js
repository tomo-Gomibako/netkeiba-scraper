const puppeteer = require("puppeteer")

const constants = require("./constants")
const search = require("./search")

const main = async () => {
	const browser = await puppeteer.launch({
		// headless: false,
		// defaultViewport: null,
		// slowMo: 100
	})
	const page = await browser.newPage()

	// await page.goto(constants.URL_BASE + "/?pid=race_search_detail&start_year=1975&start_mon=1&end_year=2019&end_mon=12")
	await page.goto(constants.URL_BASE + "/?pid=race_search_detail")

	await search(browser, page)

	await browser.close()
}

main()
