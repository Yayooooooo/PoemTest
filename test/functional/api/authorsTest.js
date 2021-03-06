const chai = require("chai");
const expect = chai.expect;
const request = require("supertest");
let Author = require("../../../models/authors");

const _ = require("lodash");
let server = require("../../../bin/www");
let validID;

describe("Authors", () => {
    beforeEach(async () => {
        try {
            await Author.deleteMany({});
            let author = new Author();
            author.name = "Yeats";
            author.introduction = "Irish poet and one of the foremost figures of 20th-century literature. " +
            "A pillar of the Irish literary establishment, he helped to found the Abbey Theatre, " +
            "and in his later years served two terms as a Senator of the Irish Free State.";
            await author.save();

            author = new Author();
            author.name = "Du Fu";
            author.introduction = "Du Fu was a prominent Chinese poet of the Tang dynasty.";
            await author.save();

            author = await Author.findOne({ name:"Yeats" });
            validID = author._id;

        } catch (error) {
            console.log(error);
        }
    });

    describe("GET /authors", () => {
        it("should return all the authors", done => {
            request(server)
                .get("/authors")
                .set("Accept", "application/json")
                .expect("Content-Type", /json/)
                .expect(200)
                .end((err, res) => {
                    try{
                        expect(res.body).to.be.a("array");
                        expect(res.body.length).to.equal(2);
                        let result = _.map(res.body, author => {
                            return { name: author.name};
                        });
                        expect(result).to.deep.include({ name: "Yeats" });
                        expect(result).to.deep.include({ name: "Du Fu" });
                        done();
                    } catch (e) {
                        done(e);
                    }
                });
        });
    });

    describe("GET /authors/:id", () => {
        describe("when the id is valid", () => {
            it("should return the matching author", done => {
                request(server)
                    .get(`/authors/${validID}`)
                    .set("Accept", "application/json")
                    .expect("Content-Type", /json/)
                    .expect(200)
                    .end((err, res) => {
                        expect(res.body[0]).to.have.property("name","Yeats");
                        done(err);
                    });
            });
        });
        describe("when the id is invalid", () => {
            it("should return the NOT found message", done => {
                request(server)
                    .get("/authors/9999")
                    .set("Accept", "application/json")
                    .expect("Content-Type", /json/)
                    .expect(200)
                    .end((err, res) => {
                        expect(res.body.message).equals("Author NOT Found!");
                        done(err);
                    });
            });
        });
    });
    describe("POST /authors", () => {
        it("should return confirmation message and update datastore", () => {
            const author = {
                name:"Shakespeare",
                introduction:"Great Great English play writer and poet"
            };
            return request(server)
                .post("/authors")
                .send(author)
                .expect(200)
                .then(res => {
                    expect(res.body.message).equals("Author Successfully Added!");
                    validID = res.body.data._id;
                });
        });
        after(() => {
            return request(server)
                .get(`/authors/${validID}`)
                .expect(200)
                .then(res => {
                    expect(res.body[0]).to.have.property("name", "Shakespeare");
                    expect(res.body[0]).to.have.property("introduction","Great Great English play writer and poet");
                });
        });
    });
    describe("PUT /authors/:id/deleteWork", () => {
        describe("when the id is valid", () => {
            it("should return a message and the author work is added", () => {
                const poemId = {poemId: "5dc14e4fb7ee92384c501889"};
                return request(server)
                    .put(`/authors/${validID}/deleteWork`)
                    .send(poemId)
                    .expect(200)
                    .then(resp => {
                        expect(resp.body).to.include({message: "Work Successfully deleted!"});
                    });
            });
        });
        describe("when the id is invalid", () => {
            it("should return information is wrong", () => {
                const poemId = {poemId: "5dc14e4fb7ee92384c501889"};
                return request(server)
                    .put("/authors/34343/deleteWork")
                    .send(poemId)
                    .expect(200)
                    .then(res => {
                        expect(res.body.message).equals("Author NOT Found!");
                    });
            });
        });
    });
    describe("PUT /authors/:id/works", () => {
        describe("when the id is valid", () => {
            it("should return a message and the author work is added", () => {
                const poemId = {poemId: "5dc14e4fb7ee92384c501889"};
                return request(server)
                    .put(`/authors/${validID}/works`)
                    .send(poemId)
                    .expect(200)
                    .then(resp => {
                        expect(resp.body).to.include({message: "Work Successfully Added!"});
                        expect(resp.body.data.works[0]).equals("5dc14e4fb7ee92384c501889");
                    });
            });
            after(() => {
                return request(server)
                    .get(`/authors/${validID}`)
                    .set("Accept", "application/json")
                    .expect("Content-Type", /json/)
                    .expect(200)
                    .then(resp => {
                        expect(resp.body[0].works[0]).equals("5dc14e4fb7ee92384c501889");
                    });
            });
        });
        describe("when the id is invalid", () => {
            it("should return information is wrong", () => {
                const poemId = {poemId: "5dc14e4fb7ee92384c501889"};
                return request(server)
                    .put("/authors/34343/works")
                    .send(poemId)
                    .expect(200)
                    .then(res => {
                        expect(res.body.message).equals("Author NOT Found!");
                    });
            });
        });
    });

    /*describe.only("PUT /authors/:id/like", () => {
        describe("when the id is valid", () => {
            it("should return a message and the author is liked", () => {
                const userCredentials = {
                    email: 'LovYeats@lala.com',
                    password: 'trytry123'
                }
                var authenticatedUser = request.agent(app);
                before(function(done){
                    authenticatedUser
                        .post('/users/login')
                        .send(userCredentials)
                        .end(function(err, response){
                            expect(response.statusCode).to.equal(200);
                            done();
                        });
                });
                authenticatedUser.put(`/authors/${validID}/like`)
                    .expect(200)
                    .then(resp => {
                        expect(resp.body).to.include({message: "Author Successfully Liked!"});
                    });
            });
            after(() => {
                return request(server)
                    .get(`/authors/${validID}`)
                    .set("Accept", "application/json")
                    .expect("Content-Type", /json/)
                    .expect(200)
                    .then(resp => {
                        expect(resp.body[0].works[0]).equals("5dc14e4fb7ee92384c501889");
                    });
            });
        });*/
    /*describe("when the id is invalid", () => {
            it("should return information is wrong", () => {
                const poemId = {poemId: "5dc14e4fb7ee92384c501889"};
                return request(server)
                    .put(`/authors/34343/works`)
                    .send(poemId)
                    .expect(200)
                    .then(res => {
                        expect(res.body.message).equals("Author NOT Found!");
                    });
            });
        });
    });*/
});
