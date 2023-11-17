import {
  SQSClient,
  ReceiveMessageCommand,
  ReceiveMessageCommandOutput,
  DeleteMessageCommand,
  Message,
  ReceiveMessageCommandInput,
  DeleteMessageCommandInput,
  SendMessageCommand,
  SendMessageCommandInput,
  SendMessageBatchCommandInput,
  SendMessageBatchCommand,
} from '@aws-sdk/client-sqs';
import { mockClient } from 'aws-sdk-client-mock';
import { v4 as uuid } from 'uuid';
import { sleep } from './common.utils';
import { buildMap } from '../../src/utils/array.utils';

const deleteMessageListeners: Map<string, (handleId: string) => unknown> = new Map();
let queues: Map<string, Message[]> = new Map();
let clientMocked = false;

afterEach(() => {
  deleteMessageListeners.clear();

  const _queues = queues;
  queues = new Map();

  verifyAllQueuesEmpty(_queues);
});

export function processMessages(queueUrl: string, messages: object[]) {
  return handleQueueMessages(
    queueUrl,
    messages.map((data) => ({ Body: JSON.stringify(data) })),
  );
}

/**
 * Populate test queue with the messages and wait for all messages to be processed.
 *
 * If at least one message was not processed the promise never resolves (e.g. failing by timeout).
 */
export const handleQueueMessages = (queueUrl: string, messages: Message[]) => {
  if (!clientMocked) throw new Error(`Cannot simulate SQS without mocked client!`);

  const preparedMessages = messages.map((message) => {
    return {
      MessageId: uuid(),
      // ReceiptHandle is mandatory for this utility to work correctly
      ReceiptHandle: uuid(),
      ...message,
    };
  });

  // TODO: Support multiple parallel calls with the same queue url?
  if (deleteMessageListeners.has(queueUrl)) throw new Error('Duplicate queue listener detected');

  const pendingMessages = buildMap(preparedMessages, (message) => message.ReceiptHandle);

  if (pendingMessages.size !== preparedMessages.length) throw new Error('duplicate ReceiptHandle found');

  return new Promise((res, rej) => {
    const listener = (handleId: string) => {
      const message = pendingMessages.get(handleId);

      if (!message) return rej(new Error(`Tried to delete unknown message by handle (${handleId})`));

      pendingMessages.delete(handleId);

      if (pendingMessages.size === 0) {
        // Cleanup after all messages were processed
        deleteMessageListeners.delete(queueUrl);
        res('All messages processed');
      }
    };

    deleteMessageListeners.set(queueUrl, listener);
    queues.set(queueUrl, preparedMessages);
  });
};

/**
 * Mock aws sql client to simulate working with a real queue
 */
export function mockSQSClient() {
  clientMocked = true;

  // TODO: The mocks appear to leak
  // TODO: If anybody calls mockClient(SQSClient) again all hooks will be dropped :(
  mockClient(SQSClient)
    .on(ReceiveMessageCommand)
    .callsFake(async (input: ReceiveMessageCommandInput) => {
      // Should we throw if queue is not prepared?
      const messages = queues.get(input.QueueUrl) || [];

      // If we immediately respond with the empty array,
      // sqs-consumer will bombard us with requests
      if (messages.length === 0) await sleep(1000);

      return {
        // Simulate FIFO queue
        Messages: messages.length > 0 ? [messages.shift()] : [],
      } as ReceiveMessageCommandOutput;
    })
    .on(DeleteMessageCommand)
    .callsFake((input: DeleteMessageCommandInput) => {
      const listener = deleteMessageListeners.get(input.QueueUrl);

      if (!listener) throw new Error('No listeners for queue ' + input.QueueUrl);

      listener(input.ReceiptHandle);
    })
    .on(SendMessageCommand)
    .callsFake(onMessagePublish)
    .on(SendMessageBatchCommand)
    .callsFake(onMessageBatchPublish);
}

function verifyAllQueuesEmpty(_queues: typeof queues) {
  const nonEmptyQueues = Array.from(_queues.entries()).reduce((acc, [url, messages]) => {
    if (messages.length > 0) acc.set(url, messages);

    return acc;
  }, new Map());

  if (nonEmptyQueues.size === 0) return;

  // eslint-disable-next-line no-console
  console.error(nonEmptyQueues);

  throw new Error(`Found ${nonEmptyQueues.size} non empty queues`);
}

// This is a hack to allow tests to check what was published
// (because tests cannot mock the client to check what was
// sent) but it needs more polishing
let publishedMessages: SendMessageCommandInput[] = [];
let batchPublishedMessages: SendMessageBatchCommandInput[] = [];
const onMessagePublish = (message) => publishedMessages.push(message);
const onMessageBatchPublish = (message) => batchPublishedMessages.push(message);
export const getPublishedMessages = () => [...publishedMessages];
export const getBatchPublishedMessages = () => [...batchPublishedMessages];

afterEach(() => {
  publishedMessages = [];
  batchPublishedMessages = [];
});
