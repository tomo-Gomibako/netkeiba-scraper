const path = require("path")
const fs = require("fs")
const promisify = require("util").promisify

const appendFile = promisify(fs.appendFile)

const getRaceURLs = require("./get-race-urls")
const race = require("./race")

module.exports = async (browser, page) => {
	await page.select(`select[name="start_year"]`, "1975")
	await page.select(`select[name="start_mon"]`, "1")
	await page.select(`select[name="end_year"]`, "2019")
	await page.select(`select[name="end_mon"]`, "12")

	await page.select(`select[name="list"]`, "100")

	// await page.click(`input[type="submit"]`)
	await page.evaluate(({}) => {
		document.querySelector("#db_search_detail_form form").submit()
	}, {})

	await page.waitForNavigation({timeout: 60000, waitUntil: "domcontentloaded"})

	while(true) {
		const { urls, next } = await getRaceURLs(page)
		console.log(`${urls.length} races in this page. Next page id: ${next}`)
		if(!next) {
			break
		}
		for(const url of urls) {
			const raceResult = await race(browser, url)	// remember null check
			await appendFile(path.resolve(__dirname, "../test.log"), JSON.stringify(raceResult) + "\n")
		}
		// await page.bringToFront()
		// await page.evaluate(data => {
		// 	paging(data.next)
		// }, { next })
		const nextNavSelector = ".pager > a:last-child"
		const hasNext = await page.$eval(nextNavSelector, el => {
			if(el && el.innerText === "次") {
				return true
			} else {
				return false
			}
		})
		// console.log(hasNext)
		if(hasNext) {
			await page.click(nextNavSelector)
			await page.waitForNavigation({timeout: 10000, waitUntil: "networkidle0"}).catch(err => {})
		}
	}
}
