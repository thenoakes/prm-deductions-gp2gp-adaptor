import xml2js from 'xml2js';

const XmlParser = function() {
  this.options = {
    // Changes key name from '_' to 'innerText'
    charkey: 'innerText',

    // Only multiple defined children are put into Array instead of everything
    explicitArray: false,

    // Puts attributes inside the object that they're associated with
    mergeAttrs: true,

    // Removes SOAP and eb prefixes from '$'
    attrNameProcessors: [xml2js.processors.stripPrefix],

    // Removes SOAP and eb prefixes from '_'
    tagNameProcessors: [xml2js.processors.stripPrefix]
  };

  return this;
};

XmlParser.prototype.parse = function(rawXml) {
  return new xml2js.Parser(this.options)
    .parseStringPromise(rawXml)
    .then(result => (this.data = result))
    .then(() => this);
};

XmlParser.prototype.findAll = function(key, maxDepth = 10) {
  return searchData(this.data, key, maxDepth);
};

const searchData = (object, key, maxDepth, found = []) => {
  let param;

  if (maxDepth-- === 0) {
    return found;
  }

  if (Object.prototype.hasOwnProperty.call(object, key)) found.push(object[key]);

  for (param in object) {
    if (Object.prototype.hasOwnProperty.call(object, param) && typeof object[param] === 'object') {
      found.concat(searchData(object[param], key, maxDepth, found));
    }
  }

  return found;
};

export { XmlParser };
