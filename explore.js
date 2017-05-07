"use strict";

const cheerio = require("cheerio");
const fs = require("fs");
const request = require("request-promise-native");

const coreURL = "https://www.acefitness.org";

let exercises = [];

let exploreExercise = (info) => {
	
	return new Promise((resolve, reject) => {
		
		let reqURL = coreURL + info.link;
		
		let options = {
			
			uri: reqURL,
			transform: function (body) {
				return cheerio.load(body);
			}
			
		};
		
		request(options)
			.then(function ($) {
				
				let stepsBlock = $("span", "div.col-right").children();
				let h2s = $("h2", "div.col-right");
				
				let steps = [];
				let stepIndex = -1;
				
				if (h2s.length === 0) {
					
					steps[++stepIndex] = {
						
						name: "General Steps",
						details: []
						
					};
					
					stepsBlock.each(function (i, elem) {
						
						if ($(elem).is("a")) return;
						
						steps[stepIndex].details.push($(elem).text());
						
					});
					
				} else {
					
					stepsBlock.each(function (i, elem) {
						
						
						if ($(elem).is("h2")) {
							
							stepIndex++;
							
							steps[stepIndex] = {
								
								name: $(elem).text(),
								details: []
								
							};
							
						} else if ($(elem).is("p")) {
							
							let temp = $(elem).text();
							
							temp = temp.trim();
							
							if (temp) {
								
								steps[stepIndex].details.push(temp);
								
							}
							
						}
						
					});
					
				}
				
				info.steps = steps;
				
				exercises.push(info);
				
				resolve();
				
			})
			.catch(function (err) {
				
				return reject(err);
				
			})
		
	});
	
};

let processExerciseSnapshotData = function ($, exercise) {
	
	return new Promise((resolve, reject) => {
		
		let name = $('h3', exercise).text();
		let infoDivs = $('div', exercise);
		let info = {};
		
		info["name"] = name;
		
		infoDivs.each(function (i, infoDiv) {
			
			if ($(infoDiv).text().toLowerCase().includes("details")) {
				
				return;
				
			}
			
			let links = $('a', infoDiv);
			let labels = $('label', infoDiv);
			let bs = $('b', infoDiv);
			
			let label = null;
			let value = null;
			let link = null;
			let level = null;
			
			if (links.length > 0) {
				
				link = $(links[1]).attr('href');
				level = $('img', links[1]).attr('src');
				level = level.toLowerCase().substring(level.lastIndexOf("_") + 1, level.lastIndexOf("."));
				
				info["link"] = link;
				info["level"] = level;
				
			}
			
			if (bs.length > 0 && labels.length > 0) {
				
				label = $('label', infoDiv).text().toLowerCase().replace(" ", "-").replace(":", "");
				
				if (label.includes("body")) {
					
					value = $('b', infoDiv).text().replace(/and/g, ",").replace(/-|\//g, ",").split(",");
					
				} else {
					
					value = $('b', infoDiv).text().replace(/\//g, ",").split(",");
					
				}
				
				value = value.map(val => val.trim());
				
				info[label] = value;
				
			}
			
		});
		
		exploreExercise(info)
			.then((data) => {
				
				resolve(data);
				
			})
			.catch((err) => {
				
				return reject(err);
				
			});
		
	});
	
};

let exploreBodyPart = function (url) {
	
	return new Promise((resolve, reject) => {
		
		let reqURL = coreURL + url;
		
		let options = {
			
			uri: reqURL,
			transform: function (body) {
				return cheerio.load(body);
			}
			
		};
		
		request(options)
			.then(function ($) {
				
				let exerciseItems = $('.exercise-item', '.exercise-list');
				
				let promArr = [];
				
				$(exerciseItems).each(function (i, exercise) {
					
					promArr.push(processExerciseSnapshotData($, exercise));
					
				});
				
				Promise.all(promArr)
					.then(() => {
						
						resolve();
						
					})
					.catch((err => {
						
						return reject(err);
						
					}));
				
			})
			.catch(function (err) {
				
				return reject(err);
				
			})
		
	});
	
};

let populateData = (array) => {
	
	return new Promise((resolve, reject) => {
		
		fs.readFile('categories.json', 'utf8', (err, data) => {
			
			if (err) {
				
				return reject(err);
				
			}
			
			array = JSON.parse(data);
			
			resolve(array);
			
		});
		
	});
	
};


populateData()
	.then((data) => {
		
		let promArr = [];
		
		data.map(elem => {
			
			promArr.push(exploreBodyPart(elem.link));
			
		});
		
		Promise.all(promArr)
			.then(() => {
				
				fs.writeFile("exercises.json", JSON.stringify(exercises, null, 4), (err) => {
					
					if (err) throw err;
					
					console.log("The file has been saved!");
					
				})
				
			})
			.catch((err) => {
				
				console.log(`There was an error in one of the exploreBodyPart calls: ${err}`);
				
			});
		
	})
	.catch((err) => console.log(err));
