const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {
    this.timeout(5000);
    let id1, id2; //we need these variables later

    ///---POST TESTING---///
    test('Create an issue with every field: POST request to /api/issues/{project}', function(done) {
        chai.request(server)
            .post('/api/issues/diky')
            .send({
                issue_title: 'Testingggg',
                issue_text: 'Testingggg even more tralalal. Functional test with every field filled in',
                created_by: 'tester',
                assigned_to: 'Mocha',
                status_text: 'in progress'
            })
            .end(function(err, res) {
                assert.equal(res.status, 200)
                assert.equal(res.body.issue_title, 'Testingggg')
                assert.equal(res.body.issue_text, 'Testingggg even more tralalal. Functional test with every field filled in')
                assert.equal(res.body.created_by, 'tester')
                assert.equal(res.body.assigned_to, 'Mocha')
                assert.equal(res.body.status_text, 'in progress')
                assert.equal(res.body.project, 'diky')
                id1 = res.body._id //we need this id for later tests
                console.log("id1: " + id1)
                done()
            })
    })

    test('Create an issue with only required fields: POST request to /api/issues/{project}', function(done) {
        chai.request(server)
            .post('/api/issues/diky')
            .send({
                issue_title: 'Testingggg',
                issue_text: 'Functional test with only required fields filled in',
                created_by: 'tester',
            })
            .end(function(err, res) {
                assert.equal(res.status, 200)
                assert.equal(res.body.issue_title, 'Testingggg')
                assert.equal(res.body.issue_text, 'Functional test with only required fields filled in')
                assert.equal(res.body.created_by, 'tester')
                assert.equal(res.body.assigned_to, '')
                assert.equal(res.body.status_text, '')
                assert.equal(res.body.project, 'diky')
                id2 = res.body._id //we need this id for later tests
                console.log("id2:", id2)
                done()
            })
    })

    test('Create an issue with missing required fields: POST request to /api/issues/{project}', function(done) {
        chai.request(server)
            .post('/api/issues/diky')
            .send({
                issue_title: 'Testingggg',
            })
            .end(function(err, res) {
                assert.equal(JSON.stringify(res.body), '{"error":"required field(s) missing"}')
                done()
            })
    })
    ///---END POST TESTING---///




    ///---PUT TESTING---///
    test('Update an issue with no fields to update: PUT request to /api/issues/{project}', function (done) {
        chai.request(server)
            .put('/api/issues/diky')
            .send({
                _id: id1
            })
            .end(function (err, res) {
                assert.equal(JSON.stringify(res.body), `{"error":"no update field(s) sent","_id":"${id1}"}`);
                done()
            })
    })

    test('Update one field on an issue: PUT request to /api/issues/{project}', function (done) {
        chai.request(server)
            .put('/api/issues/diky')
            .send({
                _id: id1,
                issue_text: 'text has been updated'
            })
            .end(function (err, res) {
                assert.equal(JSON.stringify(res.body), `{"result":"successfully updated","_id":"${id1}"}`);
                done()
            })
    })

    test('Update multiple fields on an issue: PUT request to /api/issues/{project}', function (done) {
        chai.request(server)
            .put('/api/issues/diky')
            .send({
                _id: id1,
                issue_text: 'text has been updated for the second time',
                issue_title: 'this time we updated the title too'
            })
            .end(function (err, res) {
                assert.equal(JSON.stringify(res.body), `{"result":"successfully updated","_id":"${id1}"}`);
                done()
            })
    })

    test('Update an issue with missing _id: PUT request to /api/issues/{project}', function (done) {
        chai.request(server)
            .put('/api/issues/diky')
            .send({
                issue_text: 'text has been updated for the second time',
                issue_title: 'this time we updated the title too'
            })
            .end(function (err, res) {
                assert.equal(JSON.stringify(res.body), `{"error":"missing _id"}`);
                done()
            })
    })

    test('Update an issue with an invalid _id: PUT request to /api/issues/{project}', function (done) {
        let invalid_id = '631f3f037dddd3342f4c599'
        chai.request(server)
            .put('/api/issues/diky')
            .send({
                _id: invalid_id,
                issue_text: 'text has been updated for the second time',
                issue_title: 'this time we updated the title too'
            })
            .end(function (err, res) {
                assert.equal(JSON.stringify(res.body), `{"error":"could not update","_id":"${invalid_id}"}`);
                done()
            })
    })
    ///---END PUT TESTING---///




    ///---DELETE TESTING---///
    test('Delete an issue with missing _id: DELETE request to /api/issues/{project}', function (done) {
        chai.request(server)
            .delete('/api/issues/diky')
            .send({
            })
            .end(function (err, res) {
                assert.equal(JSON.stringify(res.body), `{"error":"missing _id"}`)
                done()
            })
    })

    test('Delete an issue with an invalid _id: DELETE request to /api/issues/{project}', function (done) {
        let invalid_id = '631f3f037dddd3342f4c599'
        chai.request(server)
            .delete('/api/issues/diky')
            .send({
                _id: invalid_id
            })
            .end(function (err, res) {
                assert.equal(JSON.stringify(res.body), `{"error":"could not delete","_id":"${invalid_id}"}`)
                done()
            })
    })

    test('Delete an issue: DELETE request to /api/issues/{project}', function (done) {
        chai.request(server)
            .delete('/api/issues/diky')
            .send({
                _id: id2
            })
            .end(function (err, res) {
                assert.equal(JSON.stringify(res.body), `{"result":"successfully deleted","_id":"${id2}"}`)
                done()
            })
    })
    ///---END OF DELETE TESTING---///




    ///---GET TESTING---///
    test('View issues on a project: GET request to /api/issues/{project}', function (done) {
        chai.request(server)
            .get('/api/issues/diky')
            .query({})
            .end(function (err, res){
                assert.equal(res.status, 200)
                assert.isArray(res.body)
                assert.property(res.body[0], 'issue_title')
                assert.property(res.body[0], 'issue_text')
                assert.property(res.body[0], 'created_on')
                assert.property(res.body[0], 'updated_on')
                assert.property(res.body[0], 'created_by')
                assert.property(res.body[0], 'assigned_to')
                assert.property(res.body[0], 'open')
                assert.property(res.body[0], 'status_text')
                assert.property(res.body[0], '_id')
                done()
            })
    })

    test('View issues on a project with one filter: GET request to /api/issues/{project}', function (done) {
        chai.request(server)
            .get('/api/issues/diky')
            .query({ issue_title: 'this time we updated the title too' })
            .end(function(err, res) {
                //console.log(res.body) the array is in the res.body
                //we can just loop over the results array like this!
                res.body.forEach((issue) => {
                    assert.equal(issue.issue_title, 'this time we updated the title too')
                })
                done()
            })
    })

    test('View issues on a project with one filter: GET request to /api/issues/{project}', function (done) {
        chai.request(server)
            .get('/api/issues/diky')
            .query({ 
                issue_title: 'this time we updated the title too',
                created_by: 'tester',
                assigned_to: 'Mocha'
            })
            .end(function(err, res) {
                //console.log(res.body) the array is in the res.body
                //we can just loop over the results array like this!
                res.body.forEach((issue) => {
                    assert.equal(issue.issue_title, 'this time we updated the title too')
                    assert.equal(issue.created_by, 'tester')
                    assert.equal(issue.assigned_to, 'Mocha')
                })
                done()
            })
    })
    ///--END OF GET TESTING---///


});
