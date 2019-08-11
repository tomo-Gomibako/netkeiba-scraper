module.exports = async (page) => {
	await page.select(`select[name="start_year"]`, "1975")
	await page.select(`select[name="start_mon"]`, "1")
	await page.select(`select[name="end_year"]`, "2019")
	await page.select(`select[name="end_mon"]`, "12")

	await page.select(`select[name="list"]`, "100")

	// await page.click(`input[type="submit"]`)
	await page.evaluate(({}) => {
		$(`#db_search_detail_form form`).submit()
	}, {})

	await page.waitForNavigation({timeout: 60000, waitUntil: "domcontentloaded"})

	// const table = await page.$eval("table > tbody", el => {
	// 	const rows = el.children
	// 	const ret = []
	// 	for(const key in rows) {
	// 		if(key === "0")
	// 			continue
	// 		ret.push(rows[key].children)
	// 	}
	// 	return ret
	// }).catch(err => console.error(err))
	// console.log(table)

	return await page.evaluate(() => {
		const el = document.querySelectorAll("table > tbody > tr > td:nth-child(5) > a")
		// if(el) {
		// 	const rows = el.children
		// 	for(const key in rows) {
		// 		if(key === "0")
		// 			continue
		// 		ret.push(rows[key].innerHTML)
		// 	}
		// 	return ret
		// }
		// return null
		return [].map.call(el, v => v.href)
	})
}
