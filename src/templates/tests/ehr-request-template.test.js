const generateEhrRequestQuery = require('../ehr-request-template');
const uuid = require('uuid/v4');
const testData = require('./testData.json');

describe('generateEhrRequestQuery', () => {
  const testObjectMissing = {
    id: uuid(),
    timestamp: '20200101101010',
    sendingService: {
      odsCode: testData.mhs.odsCode,
      asid: testData.mhs.asid
    },
    receivingService: {
      odsCode: testData.emisPractise.odsCode,
      asid: testData.emisPractise.asid
    }
  };

  const testObjectComplete = {
    ...testObjectMissing,
    patient: {
      nhsNumber: testData.emisPatient.nhsNumber
    }
  };

  it('should throw error when nhsNumber is not defined in inputObject', () => {
    expect(() => generateEhrRequestQuery(testObjectMissing)).toThrowError(
      Error('nhsNumber is undefined')
    );
  });

  it('should not throw error when all required arguments are defined', () => {
    expect(() => generateEhrRequestQuery(testObjectComplete)).not.toThrowError();
  });

  it('should have populate the xml template with all the required fields', () => {
    const ehrRequestQuery = generateEhrRequestQuery(testObjectComplete);

    const checkEntries = object => {
      Object.keys(object).map(key => {
        if (typeof object[key] === 'object') {
          checkEntries(object[key]);
        } else {
          expect(ehrRequestQuery).toContain(object[key]);
        }
      });
    };

    checkEntries(testObjectComplete);
  });
});
