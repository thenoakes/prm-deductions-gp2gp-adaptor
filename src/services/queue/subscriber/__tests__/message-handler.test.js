import { updateLogEvent } from '../../../../middleware/logging';
import { EHRRequestCompleted } from '../../../gp2gp/ehr-request-completed';
import { PDSGeneralUpdateRequestAccepted } from '../../../pds/pds-general-update-request-accepted';
import {
  ehrRequestCompletedMessage,
  messageWithoutAction,
  pdsGeneralUpdateRequestAcceptedMessage,
  unhandledInteractionId
} from './data/message-handler';
import { DefaultMessage, handleMessage } from '../';

jest.mock('../../../../middleware/logging');
jest.mock('../../../gp2gp/ehr-request-completed');
jest.mock('../../../pds/pds-general-update-request-accepted');
jest.mock('../default-message');

describe('handleMessage', () => {
  beforeEach(() => {
    EHRRequestCompleted.prototype.handleMessage = jest
      .fn()
      .mockResolvedValue('EHRRequestCompleted handled message');

    PDSGeneralUpdateRequestAccepted.prototype.handleMessage = jest
      .fn()
      .mockResolvedValue('PDSGeneralUpdateRequestAccepted handled message');

    DefaultMessage.prototype.handleMessage = jest
      .fn()
      .mockResolvedValue('DefaultMessage handled message');
  });

  it('should update the log event with handling-message', async done => {
    await handleMessage(ehrRequestCompletedMessage);
    expect(updateLogEvent).toHaveBeenCalledWith({ status: 'handling-message' });
    done();
  });

  it('should reject the promise if message does not contain a action', () => {
    return expect(handleMessage(messageWithoutAction)).rejects.toEqual(
      new Error('Message does not contain action')
    );
  });

  it('should call DefaultMessage if the message action does not have a handler implemented', async done => {
    await handleMessage(unhandledInteractionId);
    expect(DefaultMessage.prototype.handleMessage).toHaveBeenCalledTimes(1);
    expect(DefaultMessage.prototype.handleMessage).toHaveBeenCalledWith(unhandledInteractionId);
    done();
  });

  it('should call EHRRequestCompleted with the message if message is type RCMR_IN030000UK06', async done => {
    await handleMessage(ehrRequestCompletedMessage);
    expect(EHRRequestCompleted.prototype.handleMessage).toHaveBeenCalledTimes(1);
    expect(EHRRequestCompleted.prototype.handleMessage).toHaveBeenCalledWith(
      ehrRequestCompletedMessage
    );
    done();
  });

  it('should call PDSGeneralUpdateRequestAccepted with the message if message is type ', async done => {
    await handleMessage(pdsGeneralUpdateRequestAcceptedMessage);
    expect(PDSGeneralUpdateRequestAccepted.prototype.handleMessage).toHaveBeenCalledTimes(1);
    expect(PDSGeneralUpdateRequestAccepted.prototype.handleMessage).toHaveBeenCalledWith(
      pdsGeneralUpdateRequestAcceptedMessage
    );
    done();
  });
});
