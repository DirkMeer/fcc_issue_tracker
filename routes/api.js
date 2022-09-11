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


//define our schema for an issue, this is the basic layout. MongoDB will add the _id for us.
let issueSchema = new mongoose.Schema({
    issue_title: {type: String, required: true},
    issue_text: {type: String, required: true},
    created_on: Date,
    updated_on: Date,
    created_by: {type: String, required: true},
    assigned_to: String,
    open: Boolean,
    status_text: String
})
//normally we would call the model here, but we do that in the function as we need to dynamically adjust the collection name first.


module.exports = function (app) {

  app.route('/api/issues/:project')
    //this is a bit awkward but we have to use the vanilla mongoDB driver to search in specific collections.
    .get(function (req, res){
      let project = req.params.project;
      async function getWholeProject() {
        try {
          // Connect the client to the server, using the vanilla mongoDB drivers here.
          await client.connect();
          // Connect to specified db and specified collection (:project param from url) and return everything in an array//
          await client.db("Issue_DB").collection(project).find({}).toArray()
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
      //we will have to post to a collection with this project name inside the database.
      let project = req.params.project;
      let data = req.body
      //create a new issue//
      const createAndSaveNewIssue = (data, project) => {
        //first set the collection to whatever project name is passed in project variable.
        issueSchema.set('collection', project)
        //now that we have 'finished' our schema we can create our model.
        let Issue = mongoose.model('Issue', issueSchema);
        //create a new issue//
        let newIssue = new Issue({
            issue_title: data.issue_title,
            issue_text: data.issue_text,
            created_on: new Date(),
            updated_on: new Date(),
            created_by: data.created_by,
            assigned_to: data.assigned_to ? data.assigned_to : '',
            open: true,
            status_text: data.status_text ? data.status_text : ''
        })
        // console.log(newIssue)
        // save our new issue.
        newIssue.save((err, data) => {
            if(err) {
                console.log(err)
            } else {
                //console.log(data)
                res.json(data);
            }
        })
      }
      createAndSaveNewIssue(data, project)
    })
    

    .put(function (req, res){
      let project = req.params.project;
      // console.log(project)
    })
    

    .delete(function (req, res){
      let project = req.params.project;
      // console.log(project)
    });
    
};
