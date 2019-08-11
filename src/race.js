const horse_weight_regex = /(\d+)\(([+-]?\d+)\)/

module.exports = async (browser, url) => {
	const ret = []
	let isInvalid = false
	const page = await browser.newPage()

	await page.goto(url)

	const table = await page.$("table > tbody")
	const rows = await table.$$("tr:not(:first-child)")
	for(const row of rows) {
		const data = await row.$$eval("td", nodes => nodes.map(el => {
			const getLeafNode = el => el.children[0] ? getLeafNode(el.children[0]) : el
			return getLeafNode(el).innerHTML.trim() || null
		}))

		const rawDataFormat = ["着順", "枠番", "馬番", "馬名", "性齢", "斤量", "騎手", "タイム", "着差", "ﾀｲﾑ指数", "通過", "上り", "単勝", "人気", "馬体重", "調教ﾀｲﾑ", "厩舎ｺﾒﾝﾄ", "備考", "調教師", "馬主", "賞金(万円)"]
		if(data.length !== rawDataFormat.length) {
			isInvalid = true
			console.log("invalid race data is detected")
			break
		}

		const obj = {
			order: null,
			bracket_number: null,
			horse_number: null,
			horse_name: null,
			sex: null,
			age: null,
			jockey_weight: null,
			jockey_name: null,
			time: null,
			margin: null,
			position: null,
			final_3f: null,
			odds: null,
			favorite: null,
			horse_weight: null,
			horse_weight_increase: null,
			trainer: null,
			owner: null,
			prize_money: null
		}
		for(const i in data) {
			const value = data[i]
			switch(+i) {
				// 着順
				case 0:
					obj["order"] = value && +value
					break
				// 枠番
				case 1:
					obj["bracket_number"] = value && +value
					break
				// 馬番
				case 2:
					obj["horse_number"] = value && +value
					break
				// 馬名
				case 3:
					obj["horse_name"] = value
					break
				// 性齢
				case 4:
					const sexClass = str => {
						switch(str) {
							case "牡":
								return "stallion"
							case "牝":
								return "mare"
							case "セ":
								return "gelding"
							default:
								return "?"
						}
					}
					obj["sex"] = sexClass(value[0])
					obj["age"] = value && +value[1]
					break
				// 斤量
				case 5:
					obj["jockey_weight"] = value && +value
					break
				// 騎手
				case 6:
					obj["jockey_name"] = value
					break
				// タイム
				case 7:
					obj["time"] = value
					break
				// 着差
				case 8:
					obj["margin"] = value
					break
				// ﾀｲﾑ指数
				case 9:
					break
				// 通過
				case 10:
					obj["position"] = value && value.split("-")
					break
				// 上り
				case 11:
					obj["final_3f"] = value && +value
					break
				// 単勝
				case 12:
					obj["odds"] = value && +value
					break
				// 人気
				case 13:
					obj["favorite"] = value && +value
					break
				// 馬体重
				case 14:
					const horseWeight = value && value.match(horse_weight_regex)
					if(horseWeight) {
						obj["horse_weight"] = +horseWeight[1]
						obj["horse_weight_increase"] = +horseWeight[2]
					} else {
						obj["horse_weight"] = value && +value
					}
					break
				// 調教ﾀｲﾑ
				case 15:
					break
				// 厩舎ｺﾒﾝﾄ
				case 16:
					break
				// 備考
				case 17:
					break
				// 調教師
				case 18:
					obj["trainer"] = value
					break
				// 馬主
				case 19:
					obj["owner"] = value
					break
				// 賞金(万円)
				case 20:
					obj["prize_money"] = value && +value
					break
			}
		}

		ret.push(obj)
	}

	page.close()

	if(isInvalid) {
		return null
	}

	return ret
}
