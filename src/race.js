module.exports = async (browser, url) => {
	const ret = []
	const page = await browser.newPage()

	await page.goto(url)

	const table = await page.$("table > tbody")
	const rows = await table.$$("tr:not(:first-child)")
	for(const row of rows) {
		const data = await row.$$eval("td", nodes => nodes.map(el => {
			const getLeafNode = el => el.children[0] ? getLeafNode(el.children[0]) : el
			return getLeafNode(el).innerHTML.trim() || null
		}))
		ret.push(data)
	}

	page.close()

	return ret
}
