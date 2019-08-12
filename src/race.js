const race_id_regex = /\/(\d+)\/$/
const race_date_regex = /(\d+)年(\d+)月(\d+)日/
const race_schedule_regex = /(\d+)回(.+)(\d+)日目/
// const race_course_data_regex = /(障)?([芝ダ])?([左右])?(\d+)m/
const horse_weight_regex = /(\d+)\(([+-]?\d+)\)/

module.exports = async (browser, url) => {
	const _raceID_match = url.match(race_id_regex)
	const raceID = _raceID_match && _raceID_match[1]
	let isInvalid = false

	const page = await browser.newPage()

	await page.goto(url)

	const race = {
		id: raceID,
		date: {
			year: null,
			month: null,
			date: null
		},
		schedule: {
			times: null,
			racecourse: null,
			day: null
		}
	}
	const dataContainer = await page.$(".data_intro")
	const raceData = await dataContainer.$eval("dl", el => {
		const getLeafNodes = (el, array = []) => el.children.length ? [].map.call(el.children, v => getLeafNodes(v, array)).flat() : array.concat([el])
		const leafNodes = getLeafNodes(el).map(v => v.innerText.trim())
		const race_number = leafNodes[0] && +leafNodes[0].slice(0, -2) || null
		const title = leafNodes[1] || null
		const status = leafNodes[2] && leafNodes[2].split("/").map(str => str.split(":").map(v => v.trim()))
		console.log(status[0])
		const racecourseData = status[0] && status[0][0] && status[0][0].match(/(障)?([芝ダ])?([左右])?(\d+)m/)
		// 晴, 曇, 小雨, 雨 ？
		const weather = status[1][1]
		// 良, 稍重, 重, 不良 ？
		const condition = status[2][1]
		const start_time = {
			hour: status[3][1] && +status[3][1],
			minute: status[3][2] && +status[3][2]
		}
		return {
			race_number,
			title,
			racecourse: racecourseData && {
				isObstacle: racecourseData[1] || false,
				course: racecourseData[2] || null,
				curve: racecourseData[3] || null,
				distance: racecourseData[4] && +racecourseData[4] || null
			} || {},
			weather,
			condition,
			start_time
		}
	})
	Object.assign(race, raceData)

	const raceSchedule = await dataContainer.$eval(".smalltxt", el => el.innerText.split(" "))
	const date = raceSchedule[0] && raceSchedule[0].match(race_date_regex)
	if(date) {
		race["date"] = {
			year: date[1] && +date[1],
			month: date[2] && +date[2],
			date: date[3] && +date[3]
		}
	}
	const schedule = raceSchedule[1] && raceSchedule[1].match(race_schedule_regex)
	if(schedule) {
		race["schedule"] = {
			times: schedule[1] && +schedule[1],
			racecourse: schedule[2],
			day: schedule[3] && +schedule[3]
		}
	}

	const raceResult = []
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
					obj["position"] = value && value.split("-").map(v => +v)
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

		raceResult.push(obj)
	}

	page.close()

	if(isInvalid) {
		return null
	}

	return {
		data: race,
		result: raceResult
	}
}
