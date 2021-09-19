# EPUB3 Package File Generator

AN attempt to automate the generation of an EPUB3 opf package file.

## Usage

1. Install Dependencies
   * `npm install`
2. Copy your books's OEBPS folder to the root of the project
3. Edit the `metadata.yml` file with the information about your book
4. Set the project environment
   * `export NODE_ENV=production` or
   * `export NODE_ENV=development`
5. Run the generator
   * node index.mjs
