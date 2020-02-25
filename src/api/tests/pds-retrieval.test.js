import { when } from 'jest-when';
import request from 'supertest';
import uuid from 'uuid/v4';
import { updateLogEvent, updateLogEventWithError } from '../../../src/middleware/logging';
import app from '../../app';
import config from '../../config';
import { sendMessage } from '../../services/mhs-service';
import generatePdsRetrievalQuery from '../../templates/generate-pds-retrieval-request';

const mockUUID = 'ebf6ee70-b9b7-44a6-8780-a386fccd759c';
const mockErrorUUID = 'fd9271ea-9086-4f7e-8993-0271518fdb6f';

jest.mock('../../config/logging');

jest.mock('../../middleware/logging', () => mockLoggingMiddleware());
jest.mock('express-winston', () => mockExpressWinston());
jest.mock('../../services/mhs-service');
jest.mock('../../templates/generate-pds-retrieval-request');
jest.mock('uuid/v4');

function mockLoggingMiddleware() {
  const original = jest.requireActual('../../middleware/logging');
  return {
    ...original,
    updateLogEvent: jest.fn(),
    updateLogEventWithError: jest.fn()
  };
}

function mockExpressWinston() {
  return {
    errorLogger: () => (req, res, next) => next(),
    logger: () => (req, res, next) => next()
  };
}

function generateLogEvent(message) {
  return {
    status: 'validation-failed',
    validation: {
      errors: message,
      status: 'failed'
    }
  };
}

const interactionId = 'QUPA_IN000008UK02';

describe('/pds-retrieval/:nhsNumber', () => {
  beforeEach(() => {
    config.pdsAsid = 'pdsAsid';
    config.deductionsAsid = 'deductionsAsid';
    uuid.mockImplementation(() => mockUUID);

    process.env.AUTHORIZATION_KEYS = 'correct-key,other-key';

    when(sendMessage)
      .mockResolvedValue({ status: 503, data: 'MHS error' })
      .calledWith({ interactionId, conversationId: mockUUID.toUpperCase(), message: 'message' })
      .mockResolvedValue({ status: 200, data: 'message' })
      .calledWith({ interactionId, conversationId: mockUUID.toUpperCase(), message: undefined })
      .mockRejectedValue(Error('rejected'))
      .calledWith({
        interactionId,
        conversationId: mockErrorUUID.toUpperCase(),
        message: 'message'
      })
      .mockResolvedValue({ status: 500, data: '500 MHS Error' });

    generatePdsRetrievalQuery.mockImplementation(() => Promise.resolve('message'));
  });

  afterEach(() => {
    if (process.env.AUTHORIZATION_KEYS) {
      delete process.env.AUTHORIZATION_KEYS;
    }

    config.pdsAsid = process.env.PDS_ASID;
    config.deductionsAsid = process.env.DEDUCTIONS_ASID;

    jest.clearAllMocks();
  });

  it('should return a 401 (Unauthorised) if Authorization header is not provided and log event', done => {
    request(app)
      .get('/pds-retrieval/9999999999')
      .expect(401)
      .expect(() => {
        expect(updateLogEvent).toHaveBeenCalledTimes(1);
        expect(updateLogEvent).toHaveBeenCalledWith({
          status: 'authorization-failed',
          error: { message: 'Authorization header not provided' }
        });
      })
      .end(done);
  });

  it('should return a 403 (Unauthorised) if Authorization header value is incorrect and log event', done => {
    request(app)
      .get('/pds-retrieval/9999999999')
      .set({ Authorization: 'wrong' })
      .expect(403)
      .expect(() => {
        expect(updateLogEvent).toHaveBeenCalledTimes(1);
        expect(updateLogEvent).toHaveBeenCalledWith({
          status: 'authorization-failed',
          error: { message: 'Authorization header value is not a valid authorization key' }
        });
      })
      .end(done);
  });

  it('should return a 200 if :nhsNumber is numeric and 10 digits and Authorization Header provided', done => {
    request(app)
      .get('/pds-retrieval/9999999999')
      .set('Authorization', 'correct-key')
      .expect(200)
      .end(done);
  });

  it('should return a 200 with MHS message passed back', done => {
    request(app)
      .get('/pds-retrieval/9999999999')
      .set('Authorization', 'correct-key')
      .expect(200)
      .expect(res => {
        expect(res.body.message).toBe('message');
      })
      .end(done);
  });

  it('should return a 200 and update the logs', done => {
    request(app)
      .get('/pds-retrieval/9999999999')
      .set('Authorization', 'correct-key')
      .expect(200)
      .expect(() => {
        expect(updateLogEvent).toHaveBeenCalledTimes(2);
        expect(updateLogEvent).toHaveBeenCalledWith({
          status: '200 PDS response received',
          conversationId: mockUUID.toUpperCase(),
          response: { data: 'message', status: 200 }
        });
      })
      .end(done);
  });

  it('should return an error if :nhsNumber is less than 10 digits', done => {
    const errorMessage = [{ nhsNumber: "'nhsNumber' provided is not 10 characters" }];
    request(app)
      .get('/pds-retrieval/99')
      .set('Authorization', 'correct-key')
      .expect(422)
      .expect('Content-Type', /json/)
      .expect(res => {
        expect(res.body).toEqual({
          errors: errorMessage
        });
        expect(updateLogEvent).toHaveBeenCalledTimes(1);
        expect(updateLogEvent).toHaveBeenCalledWith(generateLogEvent(errorMessage));
      })
      .end(done);
  });

  it('should return an error if :nhsNumber is not numeric', done => {
    const errorMessage = [{ nhsNumber: "'nhsNumber' provided is not numeric" }];
    request(app)
      .get('/pds-retrieval/xxxxxxxxxx')
      .set('Authorization', 'correct-key')
      .expect(422)
      .expect('Content-Type', /json/)
      .expect(res => {
        expect(res.body).toEqual({
          errors: errorMessage
        });
        expect(updateLogEvent).toHaveBeenCalledTimes(1);
        expect(updateLogEvent).toHaveBeenCalledWith(generateLogEvent(errorMessage));
      })
      .end(done);
  });

  it('should return a 503 if sendMessage throws an error', done => {
    generatePdsRetrievalQuery.mockImplementation(() => Promise.resolve(undefined));

    request(app)
      .get('/pds-retrieval/9999999999')
      .set('Authorization', 'correct-key')
      .expect(res => {
        expect(res.status).toBe(503);
        expect(res.body.errors).toBe('rejected');
      })
      .end(done);
  });

  it('should return a 503 with error message if mhs returns a 500 status code', done => {
    uuid.mockImplementation(() => mockErrorUUID);

    request(app)
      .get('/pds-retrieval/9999999999')
      .set('Authorization', 'correct-key')
      .expect(res => {
        expect(res.status).toBe(503);
        expect(res.body.errors).toBe('MHS Error: 500 MHS Error');
      })
      .end(done);
  });

  it('should return a 503 with error message if mhs returns a 503 status code', done => {
    uuid.mockImplementation(() => '893b17bc-5369-4ca1-a6aa-579f2f5cb318');

    request(app)
      .get('/pds-retrieval/9999999999')
      .set('Authorization', 'correct-key')
      .expect(res => {
        expect(res.status).toBe(503);
        expect(res.body.errors).toBe('Unexpected Error: MHS error');
      })
      .end(done);
  });

  it('should call updateLogEventWithError if mhs returns a 503 status code', done => {
    uuid.mockImplementation(() => '893b17bc-5369-4ca1-a6aa-579f2f5cb318');

    request(app)
      .get('/pds-retrieval/9999999999')
      .set('Authorization', 'correct-key')
      .expect(() => {
        expect(updateLogEventWithError).toBeCalledTimes(1);
        expect(updateLogEventWithError).toBeCalledWith(Error('Unexpected Error: MHS error'));
      })
      .end(done);
  });
});
