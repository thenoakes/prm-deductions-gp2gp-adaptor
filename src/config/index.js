const config = {
  deductionsAsid: process.env.DEDUCTIONS_ASID,
  deductionsOdsCode: process.env.DEDUCTIONS_ODS_CODE,
  isLocal: process.env.NODE_ENV === 'local',
  isPTL: process.env.NODE_ENV !== 'local' && process.env.NODE_ENV !== 'dev',
  queueName: process.env.MHS_QUEUE_NAME,
  dlqName: process.env.MHS_DLQ_NAME,
  queueUrl1: process.env.MHS_QUEUE_URL_1,
  queueUrl2: process.env.MHS_QUEUE_URL_2,
  stompVirtualHost: process.env.MHS_STOMP_VIRTUAL_HOST,
  queueUsername: process.env.MHS_QUEUE_USERNAME,
  queuePassword: process.env.MHS_QUEUE_PASSWORD,
  awsS3BucketName: process.env.S3_BUCKET_NAME
};

export default config;
