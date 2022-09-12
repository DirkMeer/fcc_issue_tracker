'use strict';
//api will be called from elsewhere and have the express app passed in so we can define routes here.
//dotenv is a module that will load the variables in our env file for us. The .config method handles this importing.
require('dotenv').config();

//import mongoose
const mongoose = require('mongoose');
//connect to our database using mongoose
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

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
    .get(function (req, res){
      let project = req.params.project;
      let filter = Object.assign(req.query) //Object.assign makes a copy
      filter.project = project
      Issue.find(
        filter, //pass in the filter object
        (error, issues) => {
          if(!error && issues){
            res.json(issues)
          }
        }
      )
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
          //console.log(`Succesfully saved \n${savedIssue}`)
          res.json(savedIssue)
        }
      })
    })
    

    .put(function (req, res){
      let project = req.params.project;
      if(!req.body._id){
        //WHENEVER SENDING A RES YOU MUST USE THE RETURN IN FRONT OF IT TO AVOID THE DOUBLE HEADER ERRORS
        return res.json({ error: 'missing _id' })
      }
      //we need at least the key and 1 more property. Can test amount of properties with Object.keys(objname).length
      console.log("update req.body:", req.body)
      if(Object.keys(req.body).length < 2){
        //WHENEVER SENDING A RES YOU MUST USE THE RETURN IN FRONT OF IT TO AVOID THE DOUBLE HEADER ERRORS
        return res.json({ error: 'no update field(s) sent', '_id': req.body._id })
      }
      //set the update object, starting by adding the updated_on timestamp
      let updateObject = { updated_on: new Date().toUTCString() }
      //get all the keys of the req.body object and do sommething for each of them
      Object.keys(req.body).forEach((key) => {
        //if the key's value is not an empty string
        if(req.body[key] != ''){
          //add it to the update object
          updateObject[key] = req.body[key]
        }
      })
      Issue.findByIdAndUpdate(
        req.body._id, //the id to look for
        updateObject, //the updates to apply
        {new: true}, //specify we want to receive the newly updated object back
        (error, updatedIssue) => { //start the callback
          if(!error && updatedIssue){
            return res.json({ result: 'successfully updated', '_id': req.body._id })
          }else if(!updatedIssue){
            return res.json({ error: 'could not update', '_id': req.body._id })
          }
        }
      )
    })
    

    .delete(function (req, res){
      //get the collection and the id for deleting
      let project = req.params.project;
      if(!req.body._id){
        return res.json({ error: 'missing _id' })
      }
      Issue.findByIdAndRemove(req.body._id, (error, deletedIssue) => {
        //if there is no error and a deletedIssue has been returned to us (success conditions)
        if(!error && deletedIssue){
          return res.json({ result: 'successfully deleted', '_id': req.body._id })
        //if no deletedIssue was returned to us (e.g. invalid id provided)
        }else if(!deletedIssue){
          return res.json({ error: 'could not delete', '_id': req.body._id })
        }
      })

    });
    
};
