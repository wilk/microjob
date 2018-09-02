const Task = require('../src/task')
const assert = require('chai').assert

describe('Task testing', () => {
  it('should execute an inline task', done => {
    Task.factory(data => {
      const fs = require('fs')
    
      const file = fs.readFileSync('./package.json', 'utf-8')
      console.log('file')
      console.log(file)
      return 'meh'
    })
      .then(res => {
        assert.equal(res, 'meh')
        done()
    }, err => {
      done(err)
    })
    done()
  })
})