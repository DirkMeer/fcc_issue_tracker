'use strict';
//api will be called from elsewhere and have the express app passed in so we can define routes here.
//dotenv is a module that will load the variables in our env file for us. The .config method handles this importing.
require('dotenv').config();

//import mongoose
const mongoose = require('mongoose');
//connect to our database using mongoose
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

//also create a vanilla mongoclient to search specific collections.
const { MongoClient } = require("mongodb");
// Create a new MongoClient
const client = new MongoClient(process.env.MONGO_URI);
// We need this to convert string id's back into a mongodb object
const ObjectId = require('mongodb').ObjectId

//because freecodecamp testing never works properly
function addHours(numOfHours, date = new Date()) {
  date.setTime(date.getTime() + numOfHours * 60 * 60 * 1000);
  return date;
}

//used to weed out empty entries from the update object later on
const removeEmptyFromObj = (obj) => {
  Object.keys(obj).forEach(key => {
    if (obj[key] === ''){
      delete obj[key];
    }
  })
}

//define our schema for an issue, this is the basic layout. MongoDB will add the _id for us.
let issueSchema = new mongoose.Schema({
  issue_title: {type: String, required: true},
  issue_text: {type: String, required: true},
  created_by : {type: String, required: true},
  assigned_to : String,
  status_text : String,
  open: {type: Boolean, required: true},
  created_on: {type: Date, required: true},
  updated_on: {type: Date, required: true},
  project: String
})
//model//
const Issue = mongoose.model('Issue', issueSchema)


module.exports = function (app) {

  app.route('/api/issues/:project')
    //this is a bit awkward but we have to use the vanilla mongoDB driver to search in specific collections.
    .get(function (req, res){
      let query_open = req.query.open; //extract open from url query
      let query_assigned_to = req.query.assigned_to; //extract assigned to from url query
      let searchQuery = {} //set query to empty object, we must pass in an empty object if no query is provided
      const defineQuery = () => {
        //check if open query is provided and pass it in//
        if (query_open !== undefined) { 
          //convert value from string to a real boolean (url query is string format)//
          searchQuery.open = query_open == 'true' ? true : 'false' ? false : true;
        } //if assigned_to has been defined it will be passed into the search query as well.
        if (query_assigned_to !== undefined) {
          searchQuery.assigned_to = query_assigned_to;
        } //run the function we just defined//
      }; defineQuery();
      //get name of the project (collection) we need to search
      let project = req.params.project;
      async function getWholeProject() {
        try {
          // Connect the client to the server, using the vanilla mongoDB drivers here.
          await client.connect();
          // Connect to specified db and specified collection (:project param from url) and return everything in an array//
          await client.db("Issue_DB").collection(project).find(searchQuery).toArray()
          .then(data => { //note that .then only takes the data, you MUST NOT define err here, only data!!
            res.json(data)
          }).catch(console.error) //errors go in the .catch
        } finally {
          // Ensures that the client will close when you finish/error
          await client.close();
        }
      } //call the run function we defined above//
      getWholeProject().catch(console.dir);
    })
    

    .post(function (req, res){
      var project = req.params.project;
      if(!req.body.issue_title || !req.body.issue_text || !req.body.created_by){
        res.json({ error: 'required field(s) missing' })
      }
      let newIssue = new Issue({
        issue_title: req.body.issue_title,
        issue_text: req.body.issue_text,
        created_by: req.body.created_by,
        //notice how we can set value a || if it doesn't exist value b.
        assigned_to: req.body.assigned_to || '',
        status_text: req.body.status_text || '',
        open: true,
        created_on: new Date().toUTCString(),
        updated_on: new Date().toUTCString(),
        project: project
      })
      newIssue.save((error, savedIssue) => {
        if(!error && savedIssue) {
          console.log(`Succesfully saved \n${savedIssue}`)
          res.json(savedIssue)
        }
      })
    })
    

    .put(function (req, res){
      //create the update object to pass in our update call
      let project = req.params.project; // pass this in as the collection name to update
      let updates = req.body   //get the data from form
      let idToUpdate = req.body._id; //save id to separate var
      console.log("id to update: ", idToUpdate)
      delete updates._id; //must be removed we cannot update this entry in mongoDB
      updates.updated_on = addHours(1) //add new updated time
      updates.open === 'false' ? updates.open = false : updates.open = true; //convert string to boolean
      removeEmptyFromObj(updates) // get rid of all '' entries to prevent data deletion from db

      //check for missing values
      let checkForMissing = (updates) => {
        console.log(updates)
        if (idToUpdate === undefined){
          res.json({ error: 'missing _id' })
          return
        } else if (!('issue_title' in updates) && !('issue_text' in updates) && !('created_by' in updates) && !('assigned_to' in updates) && !('status_text' in updates) && !('open' in updates)){
          res.json({ error: 'no update field(s) sent', '_id': idToUpdate })
          return
        }
      }; checkForMissing(updates);

      //use vanilla mongoDB drivers to find and update one (vanilla lets us select the collection)
      async function findNupdate() {
        try {
          // Connect the client to the server, using the vanilla mongoDB drivers here.
          await client.connect();
          // Find one using the _id field (using ObjectId to convert string to mdb id object), then update it //
          await client.db("Issue_DB").collection(project).findOneAndUpdate({ _id: ObjectId(idToUpdate) }, { 
            $set: updates
          })
          .then(data => { //note that .then only takes the data, you MUST NOT define err here, only data!!
            res.json({ result: 'successfully updated', '_id': idToUpdate })
          }).catch(console.error) //errors go in the .catch
        } finally {
          // Ensures that the client will close when you finish/error
          await client.close();
        }
      } //call the run function we defined above//
      findNupdate().catch(console.dir);
    })
    

    .delete(function (req, res){
      //get the collection and the id for deleting
      let project = req.params.project;
      let idToDelete = req.body._id;
      if (!idToDelete) {
        res.json({ error: 'missing _id' })
        return
      }
      
      //use vanilla mongoDB to once again select the collection and delete one//
      async function findNdelete() {
        try {
          await client.connect();
          await client.db("Issue_DB").collection(project).findOneAndDelete({ _id: ObjectId(idToDelete) })
          .then(data => {
            res.json({ result: 'successfully deleted', '_id': idToDelete });
          }).catch((err) => {
            res.json({ error: 'could not delete', '_id': idToDelete })
          })
        } finally {
          await client.close();
        }
      }
      findNdelete().catch(console.dir)
    });
    
};
