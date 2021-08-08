// Node built-in modules
import fs from 'fs';
import path from 'path';
import process from 'process';

// Third party modules
// Builds the XML document
import { create } from 'xmlbuilder2';
// Generates the UUID id 
import { v4 as uuidv4 } from 'uuid';
// Reads YAML file for metadata
import * as yaml from 'js-yaml';
// Gets the mime types for the items 
// on the manifest
import mime from 'mime-types';

// Sets the enviroment to the value of 
// the NODE_ENV environment variable
// We will use this to determine whether
// or not to log items to the console 
// and other things
let environment = process.env.NODE_ENV

// Define constants for namespaces
const dc = 'http://purl.org/dc/elements/1.1/';
const idpf = 'http://www.idpf.org/2007/opf';
// If you need more namespaces, add them here
// and in the XML doc's namespace declaration
// section

// UUID will generate a unique random UUID identifier
const bookid = uuidv4();

// Capture the metadata in a variable
let data = readMetadata();
// Capture the creators array
let creators = Array.from(data.creators);

// Empty Array for Manifest items that we'll
// populate later
let manifestItems = [];

// Empty array for Spine items that we'll
// populate later
let spineItems = [];

/**
 * Reads the metadata from metadata.yaml
 *
 * @returns {object}
 */
function readMetadata() {
  try {
    let fileContents = fs.readFileSync('metadata.yaml', 'utf8');
    let data = yaml.load(fileContents);

    // console.log(data);
    return data;
  } catch (e) {
    console.error(e);
  }
}

(function readManifestFiles(dirPath = 'OEBPS') {
  try {
    let files = fs.readdirSync(dirPath)

    manifestItems = manifestItems || []

    files.forEach(function (file) {
      if (fs.statSync(dirPath + "/" + file).isDirectory()) {
        manifestItems = readManifestFiles(dirPath + "/" + file, manifestItems)
      } else {
        
        if (!file.includes('.DS_Store')) {
          // SPECIAL CASES FOR THE WIN!
          if (
            // Add more special cases here
            // I chose to add them by mime type
            (mime.lookup(file) === 'application/x-dtbncx+xml')  ||
            (mime.lookup(file) === 'text/css')                  ||
            (mime.lookup(file) === 'image/svg+xml')             ||
            (mime.lookup(file) === 'image/jpg')                 ||
            (mime.lookup(file) === 'image/png')                 ||
            (mime.lookup(file) === 'image/gif')                 ||
            (mime.lookup(file) === 'image/jpeg')) {
            manifestItems.push(
              {
                '@id': file.slice(0, -4),
                '@mime-type': mime.lookup(file),
                '@href': path.join(dirPath, "/", file)
              },
            )
          } else {
            manifestItems.push(
              {
                '@id': file.slice(0, -5),
                '@mime-type': mime.lookup(file),
                '@href': path.join(dirPath, "/", file)
              },
            )
          }
        }
      }
    })

    return manifestItems
  } catch (e) {
    console.error(e)
  }
})();

(function readSpineFiles(dirPath = 'OEBPS') {
  try {
    let files = fs.readdirSync(dirPath)

    spineItems = spineItems || []

    files.forEach(function (file) {
      if (fs.statSync(dirPath + "/" + file).isDirectory()) {
        return
      } else {
        if (!file.includes('.DS_Store') && (!file.includes('to')) && (!file.includes('style'))) {
          if (file.includes('cover')) {
            spineItems.push({
              '@idref': file.slice(0, -5),
              '@linear': 'no',
            })
          } else {
            spineItems.push(
              {
                '@idref': file.slice(0, -5),
              },
            )
          }
        }
      }
    })

    return spineItems
  } catch (e) {
    console.error(e)
  }
})();

// Finally create the OPF file
let root = create({ version: '1.0' })
  // definess the root element
  .ele(idpf, 'package')
    // Defines namespaces
    .att('http://www.w3.org/2000/xmlns/', 'xmlns:dc', dc)
    // Add any additional namespaces here
    // Defines version attribute for the root element
    .att('version', '2.0')
    // Defines a unique udentifier generated with UUID
    .att('unique-identifier', bookid)
    // Begin metadata block
    .ele('metadata')
    .ele('meta')
      .att('content', 'cover-image')
      .att('name', 'cover')
    .up()
    .ele(dc, 'identifier')
      .att('id', 'bookid')
      .txt('urn:uuid:' + bookid)
    .up()
    .ele(dc, "title")
      .txt(`${data.title}`)
    .up()
    // Had hardcode the DC namespace to the creator elelement 
    // so I create multiple creators automatically
    .ele({
      "dc:creator": creators
    })
    .up()
    .ele(dc, "published")
      .txt(`${data.date}`)
    .up()
    .ele(dc, "publisher")
      .txt(`${data.publisher}`)
    .up()
  .up() // Ends metadata block
  // Begin manifest block
  .ele('manifest')
    // populates the manifest section with items that take data
    // from the readManifestFiles function result
    .ele({
      'item': manifestItems
    })
    .up()
  .up() // Ends manifest block
  // Begin spine block
  .ele('spine')
    // populates the spine section with items that take data
    // from the readSpineFiles function result  
    .ele({
      'itemref': spineItems
    })
    .up()
  .up() // Ends spine block
.up(); // ends root eleent
// convert the XML tree to string and provide 
// prettyprinted output
const xml = root.end({ prettyPrint: true });
// log the xml to console during development
if ( environment === 'development' ) {
  console.log(xml);
}

// write the result to a file in utf8
fs.writeFileSync('content.opf', xml, 'utf8');