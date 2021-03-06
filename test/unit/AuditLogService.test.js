/*
 * Unit tests of audit log service
 */

require('../../app-bootstrap')
const _ = require('lodash')
const uuid = require('uuid/v4')
const chai = require('chai')
const service = require('../../src/services/AuditLogService')
const ChallengeService = require('../../src/services/ChallengeService')
const testHelper = require('../testHelper')

const should = chai.should()

describe('audit log service unit tests', () => {
  // generated data
  let data
  const notFoundId = uuid()

  before(async () => {
    await testHelper.createData()
    data = testHelper.getData()
  })

  after(async () => {
    await testHelper.clearData()
  })

  describe('search audit logs tests', () => {
    it('search audit logs successfully 1', async () => {
      // update challenge so that there are some audit logs
      await ChallengeService.partiallyUpdateChallenge({ isMachine: true, sub: 'sub' }, data.challenge.id, {
        track: 'track-abc',
        description: 'desc-abc'
      })

      const res = await service.searchAuditLogs({
        page: 1,
        perPage: 10,
        challengeId: data.challenge.id,
        createdDateStart: new Date(new Date().getTime() - 1000 * 60 * 60 * 30),
        createdDateEnd: '2022-01-02',
        createdBy: 'sub'
      })
      should.equal(res.total, 2)
      should.equal(res.page, 1)
      should.equal(res.perPage, 10)
      should.equal(res.result.length, 2)
      let log = _.find(res.result, (item) => item.fieldName === 'track')
      should.exist(log)
      should.equal(log.oldValue, '"track"')
      should.equal(log.newValue, '"track-abc"')
      should.equal(log.challengeId, data.challenge.id)
      should.equal(log.createdBy, 'sub')
      should.exist(log.created)
      should.exist(log.id)
      log = _.find(res.result, (item) => item.fieldName === 'description')
      should.exist(log)
      should.equal(log.oldValue, '"desc"')
      should.equal(log.newValue, '"desc-abc"')
      should.equal(log.challengeId, data.challenge.id)
      should.equal(log.createdBy, 'sub')
      should.exist(log.created)
      should.exist(log.id)
    })

    it('search audit logs successfully 2', async () => {
      const result = await service.searchAuditLogs({ challengeId: notFoundId })
      should.equal(result.total, 0)
      should.equal(result.page, 1)
      should.equal(result.perPage, 20)
      should.equal(result.result.length, 0)
    })

    it('search audit logs - invalid fieldName', async () => {
      try {
        await service.searchAuditLogs({ fieldName: ['invalid'] })
      } catch (e) {
        should.equal(e.message.indexOf('"fieldName" must be a string') >= 0, true)
        return
      }
      throw new Error('should not reach here')
    })

    it('search audit logs - invalid challengeId', async () => {
      try {
        await service.searchAuditLogs({ challengeId: ['invalid'] })
      } catch (e) {
        should.equal(e.message.indexOf('"challengeId" must be a string') >= 0, true)
        return
      }
      throw new Error('should not reach here')
    })

    it('search audit logs - invalid createdBy', async () => {
      try {
        await service.searchAuditLogs({ createdBy: ['invalid'] })
      } catch (e) {
        should.equal(e.message.indexOf('"createdBy" must be a string') >= 0, true)
        return
      }
      throw new Error('should not reach here')
    })

    it('search audit logs - invalid end date', async () => {
      try {
        await service.searchAuditLogs({ createdDateEnd: 'abc' })
      } catch (e) {
        should.equal(e.message.indexOf(
          '"createdDateEnd" must be a number of milliseconds or valid date string') >= 0, true)
        return
      }
      throw new Error('should not reach here')
    })

    it('search audit logs - invalid page', async () => {
      try {
        await service.searchAuditLogs({ page: -1 })
      } catch (e) {
        should.equal(e.message.indexOf('"page" must be larger than or equal to 1') >= 0, true)
        return
      }
      throw new Error('should not reach here')
    })

    it('search audit logs - invalid perPage', async () => {
      try {
        await service.searchAuditLogs({ perPage: -1 })
      } catch (e) {
        should.equal(e.message.indexOf('"perPage" must be larger than or equal to 1') >= 0, true)
        return
      }
      throw new Error('should not reach here')
    })

    it('search audit logs - unexpected field', async () => {
      try {
        await service.searchAuditLogs({ other: 123 })
      } catch (e) {
        should.equal(e.message.indexOf('"other" is not allowed') >= 0, true)
        return
      }
      throw new Error('should not reach here')
    })
  })
})
