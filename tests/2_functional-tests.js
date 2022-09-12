const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {
    this.timeout(5000);

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
                console.log(typeof res.body)
                assert.equal(JSON.stringify(res.body), '{"error":"required field(s) missing"}')
                done()
            })
    })




});
