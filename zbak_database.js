//dotenv is a module that will load the variables in our env file for us. The .config method handles this importing.
require('dotenv').config();
//import mongoose
const mongoose = require('mongoose');
//connect to our database
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

//define our schema for an issue, this is the basic layout. MongoDB will add the _id for us.
let issueSchema = new mongoose.Schema({
    issue_title: {type: String, required: true},
    issue_text: {type: String, required: true},
    created_on: Date,
    updated_on: Date,
    created_by: String,
    assigned_to: String,
    open: Boolean,
    status_text: String
})
//normally we would call the model here, but we do that in the function as we need to dynamically adjust the collection name first.

//--------FUNCTIONS FOR EXPORT--------//
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
        assigned_to: data.assigned_to,
        open: true,
        status_text: data.status_text
    })
    // console.log(newIssue)
    // save our new issue.
    newIssue.save((err, data) => {
        if(err) {
            console.log(err)
        } else {
            //console.log(data)
            return data;
        }
    })
}




module.exports = { createAndSaveNewIssue }