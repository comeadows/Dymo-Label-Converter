label-maker
===========
### Parses Dymo Label Software XML files to generate pdf labels

  - Uses [node-canvas](https://github.com/Automattic/node-canvas), which is a [Cairo](http://cairographics.org/) backed Canvas implementation for [NodeJS](http://nodejs.org).
  - Uses [node-xml2js](https://github.com/Leonidas-from-XIV/node-xml2js), which is a simple XML to Javascript converter.
  - Uses [bwip-js](https://github.com/metafloor/bwip-js), which is a translation of [Barcode Writer in Pure PostScript](https://github.com/bwipp/postscriptbarcode) to native Javascript.
  - Uses [moment](https://github.com/moment/moment/), which is a lightweight Javascript date library for parsing, validating, manipulating, and formatting dates.
  - Uses [image-size](https://www.npmjs.com/package/image-size), which is a node module that gets dimensions of any image file.

## Authors

  - Cassie Meadows ([cmeadows@avkare.com](mailto:cmeadows@avkare.com))

## Installation

```bash
$ npm install
```

Unless previously installed you'll _need_ __Cairo__. For system-specific installation view the [Wiki](https://github.com/Automattic/node-canvas/wiki/_pages).

You can quickly install the dependencies by using the command for your OS:

OS | Command
----- | -----
OS X | `brew install pkg-config cairo libpng jpeg giflib`
Ubuntu | `sudo apt-get install libcairo2-dev libjpeg8-dev libpango1.0-dev libgif-dev build-essential g++`
Fedora | `sudo yum install cairo cairo-devel cairomm-devel libjpeg-turbo-devel pango pango-devel pangomm pangomm-devel giflib-devel`
Solaris | `pkgin install cairo pkg-config xproto renderproto kbproto xextproto`
Windows | [Instructions on our wiki](https://github.com/Automattic/node-canvas/wiki/Installation---Windows)

**El Capitan users:** If you have recently updated to El Capitan and are experiencing trouble when compiling, run the following command: `xcode-select --install`. Read more about the problem [on Stack Overflow](http://stackoverflow.com/a/32929012/148072).

## Run

```bash
$ sh run.sh FILENAME.label
```
The file _run.sh_ is located in _./main_ and generates the label as _label.pdf_ by default into the same directory.  This script runs both scripts ( _label-maker.js_ and _label-barcode_generator.js_ ) and deletes leftover barcode images.  The output path for _label.pdf_ is located in _./main/label-maker.js_ on line 86.

When printing to a DYMO Label printer, be sure to select the correct paper size for the generated label.

## Examples

_LabelExample.label_ is included in _./main_.

## Barcodes

The following barcode types are supported:

 - Code 39
 - Code 2 of 5
 - Code 128 (Auto)
 - UPC E
 - EAN 13
 - PDF 417
 - UPC A
 - EAN 8
 - ITF 14

## Versions

Tested with and designed for:

  - node 0.4.2
  - cairo 1.8.6
  - canvas 1.3.6
  - bwip-js 0.15.1
  - xml2js 0.4.15
  - moment 2.10.0
  - image-size 0.4.0

For node 0.2.x `node-canvas` <= 0.4.3 may be used,
0.5.0 and above are designed for node 0.4.x only.

## Documentation

[DYMO Label Documentation](https://docs.google.com/document/d/1Hb_1qDJmnaWM7-AfKr6LguLxh2nAoWWo_zR2ZmSq4vA/edit?usp=sharing) explains the structure of DYMO Label Software XML files in detail, written by [Cassie Meadows](mailto:cmeadows@avkare.com).

## Notes

- Italics is unsupported by node-canvas, which means text cannot be italicized on labels.
- Mirroring objects is unsupported at this time.

## License

(The MIT License)

Copyright (c) 2010 LearnBoost, and contributors &lt;dev@learnboost.com&gt;

Copyright (c) 2014 Automattic, Inc and contributors &lt;dev@automattic.com&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
