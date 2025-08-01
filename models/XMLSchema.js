const xmlbuilder2 = require('xmlbuilder2');
const xml2js = require('xml2js');

/**
 * XML Schema and Data Model for ZeroMQ Topic Management
 */
class XMLSchema {
  constructor() {
    this.defaultStructure = {
      Applications: {
        '@xmlns': 'http://zeromq-topic-manager/schema',
        '@version': '1.0',
        Application: []
      }
    };
  }

  /**
   * Create a new application structure
   */
  createApplication(name, description = '') {
    return {
      '@name': name,
      '@description': description,
      Topic: []
    };
  }

  /**
   * Create a new topic structure
   */
  createTopic(name, proto, direction, description = '') {
    if (!['publish', 'subscribe'].includes(direction)) {
      throw new Error('Direction must be either "publish" or "subscribe"');
    }

    return {
      '@name': name,
      '@proto': proto,
      '@direction': direction,
      '@description': description
    };
  }

  /**
   * Convert JS object to XML string
   */
  objectToXML(obj) {
    try {
      const root = xmlbuilder2.create(obj);
      return root.toString({ 
        format: 'xml', 
        prettyPrint: true,
        indent: '  '
      });
    } catch (error) {
      console.error('Error converting object to XML:', error);
      throw error;
    }
  }

  /**
   * Convert XML string to JS object
   */
  async xmlToObject(xmlString) {
    try {
      const parser = new xml2js.Parser({
        explicitArray: false,
        mergeAttrs: false,
        explicitRoot: true,
        attrkey: '@',
        charkey: '#text'
      });
      
      return await parser.parseStringPromise(xmlString);
    } catch (error) {
      console.error('Error parsing XML:', error);
      throw error;
    }
  }

  /**
   * Validate XML structure
   */
  validateStructure(obj) {
    const errors = [];

    if (!obj.Applications) {
      errors.push('Root element "Applications" is missing');
      return errors;
    }

    const applications = obj.Applications.Application;
    if (applications) {
      const appArray = Array.isArray(applications) ? applications : [applications];
      
      appArray.forEach((app, index) => {
        if (!app['@name']) {
          errors.push(`Application at index ${index} is missing name attribute`);
        }

        if (app.Topic) {
          const topics = Array.isArray(app.Topic) ? app.Topic : [app.Topic];
          topics.forEach((topic, topicIndex) => {
            if (!topic['@name']) {
              errors.push(`Topic at index ${topicIndex} in application "${app['@name']}" is missing name attribute`);
            }
            if (!topic['@proto']) {
              errors.push(`Topic "${topic['@name']}" in application "${app['@name']}" is missing proto attribute`);
            }
            if (!topic['@direction'] || !['publish', 'subscribe'].includes(topic['@direction'])) {
              errors.push(`Topic "${topic['@name']}" in application "${app['@name']}" has invalid direction`);
            }
          });
        }
      });
    }

    return errors;
  }

  /**
   * Get default XML structure
   */
  getDefaultXML() {
    return this.objectToXML(this.defaultStructure);
  }

  /**
   * Add application to existing structure
   */
  addApplication(xmlObj, appName, description = '') {
    if (!xmlObj.Applications) {
      xmlObj.Applications = this.defaultStructure.Applications;
    }

    if (!xmlObj.Applications.Application) {
      xmlObj.Applications.Application = [];
    }

    if (!Array.isArray(xmlObj.Applications.Application)) {
      xmlObj.Applications.Application = [xmlObj.Applications.Application];
    }

    const newApp = this.createApplication(appName, description);
    xmlObj.Applications.Application.push(newApp);

    return xmlObj;
  }

  /**
   * Add topic to application
   */
  addTopicToApplication(xmlObj, appName, topicName, proto, direction, description = '') {
    if (!xmlObj.Applications || !xmlObj.Applications.Application) {
      throw new Error('No applications found');
    }

    const applications = Array.isArray(xmlObj.Applications.Application) 
      ? xmlObj.Applications.Application 
      : [xmlObj.Applications.Application];

    const app = applications.find(a => a['@name'] === appName);
    if (!app) {
      throw new Error(`Application "${appName}" not found`);
    }

    if (!app.Topic) {
      app.Topic = [];
    }

    if (!Array.isArray(app.Topic)) {
      app.Topic = [app.Topic];
    }

    const newTopic = this.createTopic(topicName, proto, direction, description);
    app.Topic.push(newTopic);

    return xmlObj;
  }

  /**
   * Remove application
   */
  removeApplication(xmlObj, appName) {
    if (!xmlObj.Applications || !xmlObj.Applications.Application) {
      return xmlObj;
    }

    if (Array.isArray(xmlObj.Applications.Application)) {
      xmlObj.Applications.Application = xmlObj.Applications.Application.filter(
        app => app['@name'] !== appName
      );
    } else if (xmlObj.Applications.Application['@name'] === appName) {
      delete xmlObj.Applications.Application;
    }

    return xmlObj;
  }

  /**
   * Remove topic from application
   */
  removeTopicFromApplication(xmlObj, appName, topicName) {
    if (!xmlObj.Applications || !xmlObj.Applications.Application) {
      return xmlObj;
    }

    const applications = Array.isArray(xmlObj.Applications.Application) 
      ? xmlObj.Applications.Application 
      : [xmlObj.Applications.Application];

    const app = applications.find(a => a['@name'] === appName);
    if (!app || !app.Topic) {
      return xmlObj;
    }

    if (Array.isArray(app.Topic)) {
      app.Topic = app.Topic.filter(topic => topic['@name'] !== topicName);
    } else if (app.Topic['@name'] === topicName) {
      delete app.Topic;
    }

    return xmlObj;
  }
}

module.exports = XMLSchema;