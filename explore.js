"use strict";

const cheerio = require("cheerio");
const fs = require("fs");
const request = require("request");

const coreURL = "https://www.acefitness.org";

let bodyParts = [];
let exercises = [];

let exploreExercise = (info) => {
	
	console.log(`exploreExercise: ${JSON.stringify(info)}`);
	
	return new Promise((resolve, reject) => {
		
		console.log(`Exploring the steps of: ${info.name}`);
		
		let reqURL = coreURL + info.link;
		
		request(reqURL, (err, res, html) => {

			console.log(`Now the request is processed for: ${info.name}`);

			if (err) {

				return reject(err);

			}

			if (!err) {

				const $ = cheerio.load(html);

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


					return;

				}

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

				info.steps = steps;

				exercises.push(info);

				resolve();

			}

		})
		
	});
	
};

let potentialFn = function (exercise) {
	
	// if (i > 0) return;
	
	const $ = cheerio.load(exercise);
	
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
		
		console.log(`Done getting info card for: ${info.name}`);
		
		console.log(`Calling exploreExercise to get steps.`);
		
		exploreExercise(info)
			.then(() => {
				console.log("exploreExercise promise fulfilled.");
				resolve();
			})
			.catch((err) => {
				console.log(`exploreExercise error: ${err}`);
			});
		
	});
	
};

let exploreBodyPart = function (url) {
	
	return new Promise((resolve, reject) => {
		
		let reqURL = coreURL + url;
		
		request(reqURL,  (err, res, html) => {
			
			console.log("Making URL request in exploreBodyPart");
			
			if (err) {
				
				return reject(err);
				
			}
			
			if (!err) {
				
				const $ = cheerio.load(html);
				
				let exerciseItems = $('.exercise-item', '.exercise-list');
				
				// All of these are exercises
				
				let promArr = [];
				
				$(exerciseItems).each(function (i, exercise) {
					
					if (i > 11) return;
					
					promArr.push(potentialFn(exercise));
					
				});
				
				Promise.all(promArr)
					.then((list) => {
						
						console.log("All the promises for this call of exploreBodyPart are solved.");
					
						resolve(list);
						
					})
					.catch((err => {
					
						return reject(err);
					
					}));
				
			}
			
		})
		
	});
	
};

let populateData = () => {
	
	return new Promise((resolve, reject) => {
		
		fs.readFile('categories.json', 'utf8', (err, data) => {
			
			if (err) {
				
				return reject(err);
				
			}
			
			console.log("Async read!");
			
			bodyParts = JSON.parse(data);
			
			resolve(bodyParts);
			
		});
		
	});
	
};


populateData(exploreBodyPart)
	.then((data) => {
		console.log("populateData has resolved.");
		console.log("This is its data:");
		console.log(data);

		console.log("Now going to call exploreBodyPart()");
		
		Promise.all([
			exploreBodyPart(bodyParts[0].link)
		])
			.then(() => {
			
				console.log("All exploreBodyPart promises are fulfilled.");
				
				console.log(exercises.length);

			})
			.catch((err) => {
				
				console.log(`There was an error in one of the exploreBodyPart calls: ${err}`);
				
			});
		
	})
	.catch((err) => console.log(err));
