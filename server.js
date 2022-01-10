// Grace Biemans geb965
'use strict';

const path = require("path")

const express = require('express');
const app = express();

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true}));

var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://mongo:27017/adoptionDB";

const PORT = 8000;
const HOST = '0.0.0.0';

const panic = (err) => console.error(err)

var dbObj, staff, dogs;

MongoClient.connect(url, function(err, db) {
    if (err) {
        console.log("Error in connecting to database");
        panic(err);
    }

    dbObj = db.db("adoptionDB");

    dbObj.createCollection("staff", function(err, res) {
        if (err) {
            console.log("Error in creating staff collection");
            panic(err);
        }
        dbObj.collection("staff").count({}, function(err, numDocs) {
            if (err) {
                console.log("Error counting staff in the collection");
                panic(err);
            }
            else {
                numStaff = numDocs;
            }
        })
        console.log("Staff collection created!");
    });

    dbObj.createCollection("dogs", function(err, res) {
        if (err) {
            console.log("Error in creating dog collection");
            panic(err);
        }
        dbObj.collection("dogs").count({name: {$ne: ""}}, function(err, numDocs) {
            if (err) {
                console.log("Error counting dogs in the collection");
                panic(err);
            }
            else {
                numDogs = numDocs;
            }
        })
        console.log("Dog collection created!");
    })

    staff = dbObj.collection("staff");
    dogs = dbObj.collection("dogs");
});



var numDogs, numStaff;
var searchName; // the name for the report search
var numSearchResults;   // how many reports we get from our search


var checkedStaffRadio;
var checkedDogRadio;

app.post('/registerStaff', (req, res) => {
    let name = req.body.name;
    let position = req.body.position;

    insert(name, position);

    function insert(param1, param2) {

        staff.count({staffName: param1}, function(err, count){
            if (err) {
                panic(err);
            }
            else {
                if (count !== 0) {
                    console.log("Staff member with that name already exists");
                }
                else {
                    var obj = { staffName: param1, position: param2 };
                    staff.insertOne(obj, function(err, res) {
                        if (err) {
                            console.log("Error inserting new staff member into staff collection");
                            panic(err);
                        }
                        else {
                            numStaff += 1;
                        }
                    });
                    res.send("Staff member added");
                }
            }
        })
    }
});

app.get('/registerStaff', (req, res) => {
    staff.find({staffName: {$exists: true}}, { projection: {staffName: 1, position: 1} }).toArray(function(err, result) {
        if (err) {
            console.log("Error in getting staff from collection");
            panic(err);
        }


        var finalResult = "";
        var counter = 1;    // the row number
        var index = 0; // the row index

        while (counter <= numStaff) {
            // clean up the results to be displayed
            finalResult += "Name: " + result[index].staffName + "\nPosition: " + result[index].position + "\n\n";

            counter += 1;
            index += 1;
        }
        res.send(finalResult);
    });
})

app.post('/updateStaff', (req, res) => {
    let staffName = req.body.name;
    checkedStaffRadio = req.body.checked;
    let update = req.body.change;

    updateStaff(staffName, checkedStaffRadio, update);

    function updateStaff(param1, param2, param3) {

        console.log(param1 + " " + param2 + " " + param3);

        staff.count({"staffName": param1}, function(err, count) {
            if (err) {
                panic(err);
            }
            else {

                if (count !== 0) {
                    var query = { staffName: param1};
                    var newvalues;

                    if (param2 === 'updateName') {
                        newvalues = { $set: {staffName: param3} };
                        staff.updateOne(query, newvalues, function(err, res) {
                            if (err) {
                                console.log("Error in updating staff name\n");
                                panic(err);
                            }
                            else {
                                console.log(res);
                            }
                        });
                    }
                    else if (param2 === 'updatePosition') {
                        newvalues = { $set: {position: param3} };
                        staff.updateOne(query, newvalues, function(err, res) {
                            if (err) {
                                console.log("Error in updating staff position\n");
                                panic(err);
                            }
                            else {
                                console.log(res);
                            }
                        });
                    }
                    res.send("Staff member updated");
                }

                // if there is no staff member with that name
                else {
                    console.log("Cannot update staff member; no staff member by that name");
                }
            }
        })
    }
})

app.post('/deleteStaff', (req, res) => {
    let staffName = req.body.name;

    deleteStaff(staffName);

    function deleteStaff(param) {

        staff.count({"staffName": param}, function(err, count) {
            if (err) {
                panic(err);
            }
            else {

                // if there is no staff member by that name
                if (count === 0) {
                    console.log("Cannot delete staff member, no staff member with that name");
                }

                // there is a staff member by that name
                else {
                    var query = { staffName: param };
                    staff.deleteOne(query, function(err, obj) {
                        if (err) {
                            console.log("Error in deleting a staff member\n");
                            panic(err);
                        }
                        else {
                            numStaff -= 1;
                        }
                    });
                    res.send("Staff member deleted");
                }
            }
        })
    }
})

app.post('/searchStaff', (req, res) => {
    searchName = req.body.name;
    res.send("Search name recorded");
})

app.get('/searchStaff', (req, res) => {
    // find how many staff match our search
    staff.count({staffName: searchName}, function(err, count) {
        if (err) {
            panic(err);
        }

        if (count !== 0) {
            numSearchResults = count;


            staff.find({staffName: searchName}, { projection: {staffName: 1, position: 1}}).toArray(function(err, result) {
                if (err) {
                    console.log("Error in getting search results from staff collection");
                    panic(err);
                }

                var finalResult = "";
                var counter = 1;
                var index = 0;

                while (counter <= numSearchResults) {
                    finalResult += "Name: " + searchName + "\nPosition: " + result[index].position + "\n\n";

                    counter += 1;
                    index += 1;
                }
                res.send(finalResult);
            })



        }
        else {
            console.log("Error: no staff fit the search");
            res.send("No results");
        }
    })
})


app.post('/registerDog', (req, res) => {
    let name = req.body.name;
    let breed = req.body.breed;
    let sex = req.body.sex;
    let age = req.body.age;

    insert(name, breed, sex, age);

    function insert(param1, param2, param3, param4) {

        dogs.count({name: param1}, function(err, count){
            if (err) {
                panic(err);
            }
            else {
                if (count !== 0) {
                    console.log("Dog with that name already exists");
                }
                else {
                    var obj = {name: param1, breed: param2, sex: param3, age: param4, reports: []};
                    dogs.insertOne(obj, function(err, res) {
                        if (err) {
                            console.log("Error inserting new dog into collection");
                            panic(err);
                        }
                        else {
                            console.log(res);
                        }
                    });

                    numDogs += 1;

                    res.send("Dog added");
                }
            }
        })
    }
})

app.get('/registerDog', (req, res) => {

    dogs.find({}, { projection: {name: 1, breed: 1 , sex: 1, age: 1, reports: 1} }).toArray(function(err, result) {
        if (err) {
            console.log("Error in getting dogs from collection");
            panic(err);
        }

        var finalResult = "";
        var counter = 1;    // the row number
        var index = 0; // the row index

        while (counter <= numDogs) {
            // clean up the results to be displayed
            let name = result[index].name;
            finalResult += "Name: " + name;

            if (result[index].breed !== "") {
                finalResult += "\nBreed: " + result[index].breed;
            }

            if (result[index].sex !== "") {
                finalResult += "\nSex: " + result[index].sex;
            }

            if (result[index].age !== "") {
                finalResult += "\nAge: " + result[index].age;
            }


            var numReports = result[index].reports.length;
            if (numReports !== 0) {
                var reportIndex = 0;
                finalResult += "\nReports: ";

                while (reportIndex < numReports) {
                    finalResult += "\n  -" + result[index].reports[reportIndex].report;
                    reportIndex += 1;
                }
            }

            finalResult += "\n\n";

            counter += 1;
            index += 1;
        }
        res.send(finalResult);
    });
});

app.post('/updateDog', (req, res) => {
    let dogName = req.body.name;
    checkedDogRadio = req.body.checked;
    let update = req.body.change;

    updateDogs(dogName, checkedDogRadio, update);

    function updateDogs(param1, param2, param3) {

        dogs.count({"name": param1}, function(err, count) {
            if (err) {
                panic(err);
            }
            else {

                // if dog with that name, update
                if (count !== 0) {
                    var query = { name: param1};
                    var newvalues;

                    if (param2 === 'name') {
                        newvalues = { $set: {name: param3} };
                        dogs.updateOne(query, newvalues, function(err, res) {
                            if (err) {
                                console.log("Error in updating dog name\n");
                                panic(err);
                            }
                            else {
                                console.log(res);
                            }
                        });
                    }
                    else if (param2 === 'breed') {
                        newvalues = { $set: {breed: param3} };
                        dogs.updateMany(query, newvalues, function(err, res) {
                            if (err) {
                                console.log("Error in updating dog breed\n");
                                panic(err);
                            }
                            else {
                                console.log(res);
                            }
                        });
                    }
                    else if (param2 === 'sex') {
                        newvalues = { $set: {sex: param3} };
                        dogs.updateOne(query, newvalues, function(err, res) {
                            if (err) {
                                console.log("Error in updating dog sex\n");
                                panic(err);
                            }
                            else {
                                console.log(res);
                            }
                        });
                    }
                    else if (param2 === 'age') {
                        newvalues = { $set: {age: param3} };
                        dogs.updateOne(query, newvalues, function(err, res) {
                            if (err) {
                                console.log("Error in updating dog age\n");
                                panic(err);
                            }
                            else {
                                console.log(res);
                            }
                        });
                    }
                    res.send("Dog updated");
                }

                // there are no dogs by that name
                else {
                    console.log("No dog of that name in database");
                }
            }
        })
    }
})

app.post('/deleteDog', (req, res) => {
    let dogName = req.body.name;

    deleteDog(dogName);

    function deleteDog(param) {

        dogs.count({name: param}, function(err, count) {
            if (err) {
                panic(err);
            }
            else {

                // if there is no dog by that name
                if (count === 0) {
                    console.log("No dog by that name in database");
                }

                // there is a dog by that name
                else {
                    var query = { name: param };
                    dogs.deleteOne(query, function(err, obj) {
                        if (err) {
                            console.log("Error in deleting dog\n");
                            panic(err);
                        }
                        else {
                            numDogs -= 1;
                        }
                    });

                    res.send("Dog deleted");
                }
            }
        })
    }
});


app.post('/postReport', (req, res) => {
    let dogName = req.body.name;
    let dogReport = req.body.report;

    postReport(dogName, dogReport);

    function postReport(param1, param2) {

        dogs.count({name: param1}, function(err, count) {
            if (err) {
                panic(err);
            }
            else {
                // if a dog with that name exists, add report
                if (count !== 0) {
                    var query = { name: param1 };
                    var newvalues = { $push: {reports: {report: param2}} };
                    dogs.updateOne(query, newvalues, function(err, res) {
                        if (err) {
                            console.log("Error adding report");
                            panic(err);
                        }
                        else {
                            console.log(res);
                        }
                    });

                    res.send("Post added");
                }

                // if that dog doesn't exist, don't add report
                else {
                    console.log("Cannot add report; dog by that name doesn't exist");
                }
            }
        })
    }
})

app.use("/", express.static(path.join(__dirname, "pages")))


app.listen(PORT, HOST);
console.log('up and running');