import { getQueueConnections } from '../get-queue-connections';
import { ConnectFailover } from 'stompit';
import { getStompitQueueConfig } from '../../../../config/utils';
import { mockOn } from '../../../../__mocks__/stompit';
import { updateLogEvent, updateLogEventWithError } from '../../../../middleware/logging';
import { when } from 'jest-when';

jest.mock('../../../../middleware/logging');

const transportPath = 'transportPath';

const mockConnector = {
  serverProperties: {
    remoteAddress: {
      transportPath
    }
  }
};

const mockError = new Error('onError');

describe('getQueueConnections', () => {
  beforeEach(() => {
    when(mockOn)
      .mockReturnValue()
      .calledWith('connecting')
      .mockImplementation((_, callback) => callback(mockConnector))
      .calledWith('error')
      .mockImplementation((_, callback) => callback(mockError));
  });

  afterEach(() => {
    mockOn.mockImplementation(() => ({}));
  });

  describe('configure ConnectFailover', () => {
    it('should return a ConnectionFailover object', () => {
      expect(getQueueConnections()).toEqual(
        expect.objectContaining({
          connect: expect.any(Function)
        })
      );
    });

    it('should call ConnectFailover with maxReconnects as 1', () => {
      getQueueConnections();
      expect(ConnectFailover).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          maxReconnects: 1
        })
      );
    });

    it('should call ConnectFailover with initialReconnectDelay as 100', () => {
      getQueueConnections();
      expect(ConnectFailover).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          initialReconnectDelay: 100
        })
      );
    });

    it('should call ConnectFailover with the result of getStompitQueueConfig()', () => {
      const queueConfig = getStompitQueueConfig();
      getQueueConnections();
      expect(ConnectFailover).toHaveBeenCalledWith(queueConfig, expect.any(Object));
    });
  });

  describe('EventEmitters', () => {
    it('should call ConnectFailover.on with error callback', () => {
      getQueueConnections();
      expect(mockOn).toHaveBeenCalledWith('error', expect.any(Function));
    });

    it('should call ConnectFailover.on with connecting callback', () => {
      getQueueConnections();
      expect(mockOn).toHaveBeenCalledWith('connecting', expect.any(Function));
    });
  });

  describe('onConnecting event emitter', () => {
    it('should call updateLogEvent with updated status when connecting', () => {
      getQueueConnections();
      expect(updateLogEvent).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'Connecting to Queue' })
      );
    });

    it('should call updateLogEvent with updated status when connecting', () => {
      getQueueConnections();
      expect(updateLogEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          queue: expect.objectContaining({
            transportPath
          })
        })
      );
    });
  });

  describe('onError handler', () => {
    it('should call updateLogEvent with error', () => {
      getQueueConnections();
      expect(updateLogEventWithError).toHaveBeenCalledWith(
        Error(`Connection.onError: ${mockError.message}`)
      );
    });
  });
});
