const expect = require('expect.js')
const utils = require('./utils')

describe("User registration", () => {
    const user = { username: "KtorZ", password: "password" }
    const invalidExt = "@%^"

    const REGISTER = { path: "/users", method: "POST" }
    const AUTHENTICATE = { path: "/users/authenticate?username=" + user.username, method: "GET" }

    const reset = done => {
        const after = utils.after(2, done)

        utils.mongo([
            db => db.collection('users')
              .deleteOne({ username: user.username })
              .then(after),
            db => db.collection('users')
              .deleteOne({ username: user.username + invalidExt })
              .then(after)
        ]).catch(done)
    }

    afterEach(reset)

    context("Given a non-existing user", () => {
        before(reset)

        it("it should be able to register that user", done => {
            utils.request(REGISTER, user)
                 .then(res => {
                     expect(res.code).to.equal(201)
                     expect(res.result.id).to.be.ok()
                     expect(res.result.token).to.be.ok()
                     expect(res.result.username).to.equal(user.username)
                     expect(res.result.createdAt).to.be.below(Date.now())
                     expect(Object.keys(res.result).length).to.equal(4)
                     done()
                 })
                 .catch(done)
        })

        it("it should return an error if a wrong username is provided", done => {
            utils.request(REGISTER, Object.assign({}, user, { username: "KtorZ" + invalidExt }))
                 .then(res => {
                     expect(res.code).to.equal(400)
                     return utils.mongo(db => db.collection('users')
                        .count({ username: user.username + invalidExt })
                        .then(res => {
                            expect(res).to.equal(0)
                            done()
                        }))
                 })
                 .catch(done)
        })

        it("it should return an error if a wrong password is provided", done => {
            utils.request(REGISTER, Object.assign({}, user, { password: "14" }))
                 .then(res => {
                     expect(res.code).to.equal(400)
                     return utils.mongo(db => db.collection('users')
                        .count({ username: user.username })
                        .then(res => {
                            expect(res).to.equal(0)
                            done()
                        }))
                 })
                 .catch(done)
        })

        it("it should return an error if a no data are transmitted", done => {
            utils.request(REGISTER)
                 .then(res => {
                     expect(res.code).to.equal(400)
                     done()
                 })
                 .catch(done)
        })
    })

    context("Given an existing user", () => {
        beforeEach(done => {
            utils.request(REGISTER, user)
                 .then(() => done())
                 .catch(done)
        })

        it("it should return an error if one's try to register the same username", done => {
            utils.request(REGISTER, user)
                 .then(res => {
                     expect(res.code).to.equal(400)
                     return utils.mongo(db => db.collection('users')
                        .count({ username: user.username })
                        .then(res => {
                            expect(res).to.equal(1)
                            done()
                        }))
                 })
                .catch(done)
        })

        it("it should return a valid token when providing the right credentials", done => {
            utils.request(Object.assign(AUTHENTICATE, {
                headers: { 'Authorization': `password=${user.password}` }
            }))
            .then(res => {
                expect(res.code).to.equal(200)
                expect(res.result.token).to.be.ok()
                expect(res.result.token).to.be.a('string')
                expect(Object.keys(res.result).length).to.equal(1)
                done()
            })
            .catch(done)
        })

        const failAuthenticate = done => res => {
            try {
                expect(res.code).to.equal(403)
                expect(res.result.message).to.be.ok()
                expect(res.result.message).to.be.a('string')
                done()
            } catch (e) {
                done(e)
            }
        }

        it("it should return an error if no username is provided", done => {
            utils.request(Object.assign(AUTHENTICATE, {
                path: AUTHENTICATE.path.match(/^(.*)\?.*$/)[1],
                headers: { 'Authorization': `password=${user.password}` }
            }))
            .then(failAuthenticate(done), done)
        })

        it("it should return an error if no password is provided", done => {
            utils.request(AUTHENTICATE)
            .then(failAuthenticate(done), done)
        })

        it("it should return an error if a non existing user is provided", done => {
            utils.request(Object.assign(AUTHENTICATE, {
                path: AUTHENTICATE.path.replace(user.username, 'qwerty'),
                headers: { 'Authorization': `password=${user.password}` }
            }))
            .then(failAuthenticate(done), done)
        })

        it("it should return an error if a wrong password is provided", done => {
            utils.request(Object.assign(AUTHENTICATE, {
                headers: { 'Authorization': `password=${user.password}nope` }
            }))
            .then(failAuthenticate(done), done)
        })
    })
})
