import { XmlParser } from './xml-parser';

describe('xml-parser', () => {
  describe('fromXml', () => {
    const standardXml = `
    <root>
        <body>Hello World</body>
    </root>
    `;

    const soapPrefixXml = `
    <SOAP:root>
        <SOAP:body>Hello World</SOAP:body>
    </SOAP:root>
    `;

    const ebPrefixXml = `
    <eb:root>
        <eb:body>Hello World</eb:body>
    </eb:root>
    `;

    const attributeXml = `<some message="Hello World" />`;

    const innerTextXml = `<some thing="this">Hello World</some>`;

    it('should parse standard XML to an Object', () => {
      return new XmlParser().parse(standardXml).then(result => {
        expect(result).not.toBeNull();
        return expect(result.data.root.body).toBe('Hello World');
      });
    });

    it('should parse SOAP prefix XML to an Object without prefix', () => {
      return new XmlParser().parse(soapPrefixXml).then(object => {
        expect(object).not.toBeNull();
        return expect(object.data.root.body).toBe('Hello World');
      });
    });

    it('should parse eb prefix XML to an Object without prefix', () => {
      return new XmlParser().parse(ebPrefixXml).then(object => {
        expect(object).not.toBeNull();
        return expect(object.data.root.body).toBe('Hello World');
      });
    });

    it('should parse attributes as part of the object body', () => {
      return new XmlParser().parse(attributeXml).then(object => {
        expect(object).not.toBeNull();
        return expect(object.data.some.message).toBe('Hello World');
      });
    });

    it('should parse body into object as innerText', () => {
      return new XmlParser().parse(innerTextXml).then(object => {
        expect(object).not.toBeNull();
        expect(object.data.some.thing).toBe('this');
        return expect(object.data.some.innerText).toBe('Hello World');
      });
    });
  });

  describe('find', () => {
    const exampleNestedObject = `
     <a>
        <b>Hello</b>
     </a>
    `;

    it('should retrieve b from object', () => {
      return new XmlParser()
        .parse(exampleNestedObject)
        .then(object => object.findAll('b'))
        .then(object => {
          expect(object.length).toBe(1);
          return expect(object[0]).toBe('Hello');
        });
    });

    it('should be able to find top level object', () => {
      return new XmlParser()
        .parse(exampleNestedObject)
        .then(object => object.findAll('a', 1))
        .then(object => {
          expect(object.length).toBe(1);
          return expect(object[0]).toStrictEqual({ b: 'Hello' });
        });
    });

    it('should exist if maxDepth is 0 without searching object', () => {
      return new XmlParser()
        .parse(exampleNestedObject)
        .then(object => object.findAll('a', 0))
        .then(object => {
          expect(object.length).toBe(0);
        });
    });

    it('should return multiple nested items if they exist', () => {
      const inputXml = `
     <a>
        <b>Hello</b>
        <c>
            <b>World</b>    
        </c>
     </a>
    `;
      return new XmlParser()
        .parse(inputXml)
        .then(object => object.findAll('b'))
        .then(object => {
          expect(object.length).toBe(2);
          expect(object[0]).toBe('Hello');
          return expect(object[1]).toBe('World');
        });
    });

    it('should return nested items within max depth only if they exist', () => {
      const inputXml = `
     <a>
        <b>Hello</b>
        <c>
            <b>World</b>    
        </c>
     </a>
    `;
      return new XmlParser()
        .parse(inputXml)
        .then(object => object.findAll('b', 2))
        .then(object => {
          expect(object.length).toBe(1);
          return expect(object[0]).toBe('Hello');
        });
    });
  });
});
