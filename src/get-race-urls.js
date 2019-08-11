module.exports = async page => {
	return await page.evaluate(() => {
		const el = document.querySelectorAll("table > tbody > tr > td:nth-child(5) > a")
		const lastPager = document.querySelector(".pager > a:last-child")
		let next = null
		if(lastPager && lastPager.innerText === "次") {
			const nextpage = lastPager.href.match(/\d+/)
			next = nextpage && +nextpage[0]
		}
		return {
			urls: [].map.call(el, v => v.href),
			next
		}
	})
}
