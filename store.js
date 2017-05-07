"use strict";

const fs = require("fs");
const MongoClient = require("mongodb").MongoClient;
const assert = require("assert");

const url = "mongodb://localhost:27017/ACE";


let readFile = () => {

	return new Promise((resolve, reject) => {

		fs.readFile("exercises.json", "utf8", (err, data) => {

			if (err) return reject(err);

			resolve(JSON.parse(data));

		})

	});

};


MongoClient.connect(url).
then((db) => {
	
	console.log("Connected successfully");
	
	readFile().
	then((data) => {
		
		let exercises = db.collection("exercises");
		
		exercises.insertMany(data)
			.then((docs) => {
				
				assert.equal(data.length, docs.insertedCount);
				
				db.close();
				
			});
		
	}).
	catch((err) => console.log(err));
	
	
}).catch((err) => {
	
	console.log(err);
	
});