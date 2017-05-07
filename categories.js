"use strict";

const cheerio = require("cheerio");
const fs = require("fs");
const request = require("request");

const coreURL = "https://www.acefitness.org";
const bodyPartsURL = "https://www.acefitness.org/acefit/exercise-by-bodypart/";

let exploreBodyPart = function (url) {
	
	request(url,  (err, res, html) => {
		
		if (!err) {
			
			const $ = cheerio.load(html);
			
			console.log("YAY");
			
		}
		
	})
	
};

request(bodyPartsURL, (err, res, html) => {
	
	if (!err) {
		
		const $ = cheerio.load(html);
		
		let bodyParts = [];
		
		let h3s = $('.row-bodypart .item h3 a');
		
		$(h3s).each(function (i, h3) {
			
			bodyParts.push(
				{
					part: h3.children[0].data.replace("Exercises", "").trim(),
					link: h3.attribs.href
				}
			)
			
		});
		
		fs.writeFile('categories.json', JSON.stringify(bodyParts, null, 4), (error) => {
			
			if (!error) {
				
				console.log("File created.");
				
			}
			
		});
		
	}
	
});



