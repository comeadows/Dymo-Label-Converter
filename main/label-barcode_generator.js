/** Module Dependencies **************************************************************************************************/
var bwipjs = require('bwip-js'),
    fs = require('fs'),
    xml2js = require('xml2js');
/*************************************************************************************************************************/

/*************************************************************************************************************************
 *                                            Parse DYMO Label XML File                                                  *
 *************************************************************************************************************************/
var parser = new xml2js.Parser({explicitArray : false});
fs.readFile(__dirname + '/' + process.argv[2], function(err, data) {
    parser.parseString(data, function (err, result) {
		var objects = [];
	    if (Array.isArray(result.DieCutLabel.ObjectInfo))
		    objects = result.DieCutLabel.ObjectInfo;
		else
			objects.push(result.DieCutLabel.ObjectInfo);

	    var i = 0;

		for (o in objects) {
			if (objects[o].BarcodeObject != undefined) {
				createBarcodeImage(objects[o].BarcodeObject, i);
				i++;
			}
		}
    });
});

/******************************************************************************************
 * Name:           CreateBarcodeImage                                                     *
 * Description:    Uses bwipjs to output a barcode png.                                   *
 ******************************************************************************************/
function createBarcodeImage(object, i) {
	var includeText;
	var VerticalAlignment = 'below';  //Default
	
	switch (object.TextPosition) {
		case 'Top':
			VerticalAlignment = 'above';
			includeText = true;
			break;
		case 'Bottom':
			VerticalAlignment = 'below';
			includeText = true;
			break;
		default:
			includeText = false;
	}
	
	bwipjs.toBuffer({
		bcid:           barcodeType(object.Type),    		// Barcode type
	    text:           object.Text,    					// Text to encode
	    scaleX:         1,              					// Scaling factor
	    height:         7.080211672458, 					// Bar height, in millimeters
	    includetext:    includeText,          				// Show human-readable text
	    textxalign:     object.HorizontalAlignment,         // Horizontal alignment
	    textyalign:     VerticalAlignment,                  // Vertical alignment
	    textfont:       object.TextFont.$.Family,           // Font style
	    textsize:       object.TextFont.$.Size,             // Font size, in points
	    inkspread:      0,
	}, function (err, png) {
		
	   if (err || object.Text.length > 10) {
	        console.error("Barcode is in invalid format or exceeds barcode character limit.");
	    } else {
		    var fileName = 'barcode' + i + '.png';
	        fs.writeFile(fileName, png);
	    }
	});
}

/******************************************************************************************
 * Name:           barcodeType                                                            *
 * Description:    Converts DYMO Label types to a format readable by the bwipjs library.  *
 ******************************************************************************************/
function barcodeType (type) {
	switch(type) {
    	case 'Code39':
    		return 'code39';
		case 'Code2of5':
			return 'code2of5';
		case 'Code128Auto':
			return 'code128';
		case 'UpcE':
			return 'upce';
		case 'Ean13':
			return 'ean13';
		case 'Pdf417':
			return 'pdf417';
		case 'UpcA':
			return 'upca';
		case 'Ean8':
			return 'ean8';
		case 'Itf14':
			return 'itf14';
		default:
			console.error('Error!  Unsupported barcode type:  ' + type);
	}
}