import config from '../config';
import { generateEhrExtractResponse } from '../templates/ehr-extract-template';
import { generateFirstFragmentResponse } from '../templates/fragment-1-template';
import { generateSecondFragmentResponse } from '../templates/fragment-2-template';
import { generateThirdFragmentResponse } from '../templates/fragment-3-template';
import { generateAcknowledgementResponse } from '../templates/ack-template';
import { updateLogEvent } from '../middleware/logging';
import {
  CONTINUE_MESSAGE_ACTION,
  EHR_REQUEST_MESSAGE_ACTION,
  extractInteractionId
} from './message-parser';
import { connectToQueue } from '../config/queue';

const putResponseOnQueue = (client, response) => {
  const transaction = client.begin();

  const frame = transaction.send({ destination: config.queueName });
  frame.write(response);
  frame.end();

  transaction.commit();
};

export const sendMessage = message =>
  new Promise((resolve, reject) => {
    connectToQueue((err, client) => {
      if (err) {
        updateLogEvent({ mhs: { status: 'connection-failed' } });
        return reject(err);
      }

      const interactionId = extractInteractionId(message);
      updateLogEvent({ mhs: { interactionId } });

      if (interactionId === EHR_REQUEST_MESSAGE_ACTION) {
        putResponseOnQueue(client, generateEhrExtractResponse());
      }

      if (interactionId === CONTINUE_MESSAGE_ACTION) {
        putResponseOnQueue(client, generateFirstFragmentResponse());
        putResponseOnQueue(client, generateSecondFragmentResponse());
        putResponseOnQueue(client, generateThirdFragmentResponse());
        putResponseOnQueue(client, generateAcknowledgementResponse());
      }

      resolve();
      client.disconnect();
    });
  });

export const getRoutingInformation = odsCode => Promise.resolve({ asid: `asid-${odsCode}` });
