/** Module Dependencies **************************************************************************************************/
var Canvas = require('../')
  , Image = Canvas.Image
  , canvas = new Canvas(0, 0, 'pdf')
  , ctx = canvas.getContext('2d')
  , fs = require('fs')
  , xml2js = require('xml2js')
  , moment = require('moment')
  , sizeOf = require('image-size');
/*************************************************************************************************************************/

/*************************************************************************************************************************
 *                                            Parse DYMO Label XML File                                                  *
 *************************************************************************************************************************/
var parser = new xml2js.Parser({explicitArray : false});
fs.readFile(__dirname + '/' + process.argv[2], function(err, data) {
    parser.parseString(data, function (err, result) {
	    var version = result.DieCutLabel.$.Version;
	    var units = result.DieCutLabel.$.Units;
	    var paperOrientation = result.DieCutLabel.PaperOrientation;
	    var id = result.DieCutLabel.Id;
	    var paperName = result.DieCutLabel.PaperName;
	    var labelSize = result.DieCutLabel.DrawCommands;
	    var i = 0; //Keeps track of # of barcodes
	    
	    //Create Object List
	    var objects = [];
	    if (Array.isArray(result.DieCutLabel.ObjectInfo))
		    objects = result.DieCutLabel.ObjectInfo;
		else
			objects.push(result.DieCutLabel.ObjectInfo);
	    
        if (paperOrientation == 'Landscape'){
	        canvas.width = twipsToPixels(labelSize.RoundRectangle.$.Height);
			canvas.height = twipsToPixels(labelSize.RoundRectangle.$.Width);
        }
        else { //Portrait
        	canvas.width = twipsToPixels(labelSize.RoundRectangle.$.Width);
			canvas.height = twipsToPixels(labelSize.RoundRectangle.$.Height);
		}
		
        var objectBounds = {
				x:      0,
				y:      0,
				width:  0,
				height: 0,
		};

		for (o in objects) {
			objectBounds.x = twipsToPixels(objects[o].Bounds.$.X);
			objectBounds.y = twipsToPixels(objects[o].Bounds.$.Y);
			objectBounds.width = twipsToPixels(objects[o].Bounds.$.Width);
			objectBounds.height = twipsToPixels(objects[o].Bounds.$.Height);

			if (objects[o].TextObject != undefined) {
				createObject(objects[o].TextObject, objectBounds, 'Text');
			}
			else if (objects[o].ShapeObject != undefined) {
				createObject(objects[o].ShapeObject, objectBounds, 'Shape');
			}
			else if (objects[o].AddressObject != undefined) {
				createObject(objects[o].AddressObject, objectBounds, 'Address');
			}
			else if (objects[o].CircularTextObject != undefined) {
				createObject(objects[o].CircularTextObject, objectBounds, 'CircularText');
			}
			else if (objects[o].BarcodeObject != undefined) {
				createObject(objects[o].BarcodeObject, objectBounds, 'Barcode', i);
				i++;
			}
			else if (objects[o].DateTimeObject != undefined) {
				createObject(objects[o].DateTimeObject, objectBounds, 'DateTime');
			}
			else if (objects[o].CounterObject != undefined) {
				createObject(objects[o].CounterObject, objectBounds, 'Counter');
			}
			else if (objects[o].ImageObject != undefined) {
				createObject(objects[o].ImageObject, objectBounds, 'Image');
			}
			else {
				console.error("Error:  Object is not one of DYMO Label's 8 different object types.");
			}
		}
    });
    /********************************** Write to PDF ************************************/
	fs.writeFile('label.pdf', canvas.toBuffer());
});

/*************************************************************************************************************************
 *                                                    GENERAL                                                            *
 *************************************************************************************************************************/

/******************************************************************************************
 * Name:           twipsToPixels                                                          *
 * Description:    Converts twips to pixels.                                              *
 ******************************************************************************************/
function twipsToPixels(num) {
    return num * 0.06666666666667; 
}

/******************************************************************************************
 * Name:           addColor                                                               *
 * Description:    Converts RGB array from DYMO Label to rgba string for Canvas.          *
 ******************************************************************************************/
function addColor(c) {
	var color = getRGBColor(c);	 
	return 'rgba('+ color.r + ',' + color.g + ',' + color.b + ',' + color.a + ')';
}

function getRGBColor(path) {
	var color = {
		r: path.$.Red,         //Red
		g: path.$.Green,       //Green
		b: path.$.Blue,        //Blue
		a: path.$.Alpha        //Alpha
	};
	return color;
}

/******************************************************************************************
 * Name:           backgroundColor                                                        *
 * Description:    Creates bounds box for object and fills in the background color.       *
 ******************************************************************************************/
function backgroundColor(backColor, bounds) {
	ctx.fillStyle  = addColor(backColor);                             //Gets color
	ctx.fillRect(bounds.x,bounds.y,bounds.width,bounds.height);       //Fills in rectangle
}

/******************************************************************************************
 * Name:           hAlignment                                                             *
 * Description:    Aligns the object horizontally within its bounds box.                  *
 ******************************************************************************************/
function hAlignment(horizontal, itemWidth, boxWidth)
{
	var width = boxWidth - itemWidth;
	switch(horizontal) {
    	case 'Center':
    		ctx.translate(width/2, 0);
			break;
		case 'Right':
			ctx.translate(width, 0);
			break;
		case 'CenterBlock':
			ctx.translate(width/2, 0);
			break;
		default:
			//Left - default
	}
}

/******************************************************************************************
 * Name:           vAlignment                                                             *
 * Description:    Aligns the object vertically within its bounds box.                    *
 ******************************************************************************************/
function vAlignment(vertical, boxHeight, lineHeight)
{
	var height = boxHeight - lineHeight/2;
	
	switch(vertical) {
    	case 'Top':
    		ctx.translate(0, boxHeight * -1 + lineHeight);
			break;
		case 'Middle':
			ctx.translate(0, (height/2 * -1) + lineHeight/4);
			break;
		case 'Center':
			ctx.translate(0, (height/2 * -1) + lineHeight/4);
			break;
		default:
			//Bottom - default
	}
}

/******************************************************************************************
 * Name:           textStyle                                                              *
 * Description:    Sets the font style, aligns text, and fits text.                       *
 ******************************************************************************************/
function textStyle(style, text, object, bounds, index, lines) {
	var font = {
		typography: '',
		size:       parseInt(style.Size),
		family:     style.Family,
	};
	
	if (style.Bold == 'True')                     //Bold
		font.typography += 'bold ';
	if (style.Italic == 'True')                   //Italic
		console.warning('Italics not supported.');

	ctx.font = font.typography + 'normal ' + font.size + 'px ' + font.family;
	
	if (object.TextFitMode == 'ShrinkToFit')
		font.size = fitText(font, bounds, text, lines);
	
	if (index == 0) {
		hAlignment(object.HorizontalAlignment, ctx.measureText(text).width, bounds.width);
		vAlignment(object.VerticalAlignment, bounds.height, font.size * lines);
	}
	
	if (style.Underline == 'True')                //Underline
		underline(text, 0, 0, font.size);
	if (style.Strikeout == 'True')                //Strikeout
		strikethrough(text, 0, 0, font.size);
	
	ctx.fillText(text, 0, 0);
	return font.size;
}

/******************************************************************************************
 * Name:           underline                                                              *
 * Description:    Draws a line to underline text.                                        *
 ******************************************************************************************/
function underline(text, x, y, textSize) {
	var textWidth = ctx.measureText(text).width;            //Line width
	ctx.lineWidth = textSize/15;                            //Height of line
	                  
	ctx.beginPath();                                        //Begin line
		ctx.lineTo(x, y + 1);                               //Begins drawing 1px below text where text begins
		ctx.lineTo(x + textWidth, y + 1);                   //Continues to draw a straight line until end of text
	ctx.closePath();                                        //Finish line
	
	ctx.stroke();                                           //Paint line
}

/******************************************************************************************
 * Name:           strikethrough                                                          *
 * Description:    Draws a line through text to strike through it.                        *
 ******************************************************************************************/
function strikethrough(text, x, y, textSize) {
	var textWidth = ctx.measureText(text).width;            //Line width
	ctx.lineWidth = textSize/15;                            //Height of line
	
	ctx.beginPath();                                        //Begin line
		ctx.lineTo(x - 2, y - textSize/4);                  //Begins drawing 2px before text begins, through text
		ctx.lineTo(x + textWidth + 2, y - textSize/4);      //Continues to draw straight line until 2px after text
	ctx.closePath();                                        //Finish line
	
	ctx.stroke();                                           //Paint line
}

/******************************************************************************************
 * Name:           fitText                                                                *
 * Description:    Fits text to bounds box, with respect to multiple lines.               *
 ******************************************************************************************/
function fitText(font, bounds, text, line) {
	var textBlockSize = font.size * line;   //Used for multiline text
	
	//Decreases text size until it can fit within the bounding box.
	while (ctx.measureText(text).width > bounds.width || textBlockSize > bounds.height - bounds.height/4)
	{
		font.size--;
		ctx.font = font.typography + 'normal ' + font.size + 'px ' + font.family;
		textBlockSize = font.size * line; //recalculate size
	}
	return font.size;
}

/******************************************************************************************
 * Name:           parseText                                                              *
 * Description:    Breaks DYMO Label array into individual lines with attached styles.    *
 ******************************************************************************************/
function parseText(element) {
	var textBlock = [], line = [], temp = [];
	var numOfBreaks;
	
	if (Array.isArray(element)) {                               //If element is an array
		for (i in element) {
			temp = element[i].String.split("\n");               //split element by new line
			numOfBreaks = numOfBreaklines(element[i].String);   //Gets number of breaklines
			
			for (j in temp) {
				line.push({text: temp[j], style: element[i].Attributes.Font.$});
				if (j < numOfBreaks || (i == element.length - 1 && j == temp.length - 1)) {
					textBlock.push(line);  //push parsed line to textBlock
					line = [];  //clear line
				}
			}
		}
	}
	else {
		temp = element.String.split("\n");
		for (k in temp) {
			line.push(({text:  temp[k], style:  element.Attributes.Font.$}));
			textBlock.push(line);
			line = []; //clear line
		}
	}
	
	return textBlock;
}

/******************************************************************************************
 * Name:           numOfBreaklines                                                        *
 * Description:    Determines number of breaklines for parseText function.                *
 ******************************************************************************************/
function numOfBreaklines(str) {
	var breaks = [];
	for(var i = 0; i < str.length; i++) {
    	if (str[i] === "\n") breaks.push(i);
    }
    return breaks.length;
}

/******************************************************************************************
 * Name:           verticalize                                                            *
 * Description:    Prints object vertically.                                              *
 ******************************************************************************************/
function verticalize (object, bounds, text) {
	var temp;
	textLength = 0;
	
	//Get number of characters for multiple lines
	for (y in text) {
		for (z in text[y]) {
			textLength += text[y][z].text.length;
		}
	}
	//Print letters vertically
	for (var line = text.length-1; line >=0; line--) {
		for (var i = text[line].length-1; i >=0; i--) {
			temp = text[line][i].text.split('');
			for (var j = temp.length-1; j >=0; j--) {
				size = textStyle(text[line][i].style, temp[j], object, bounds, j - (temp.length-1) + i, textLength);
				ctx.translate(0, size * -1);
			}
		}
	}
}

/******************************************************************************************
 * Name:           rotate                                                                 *
 * Description:    Rotates object and swaps width and height for canvas accordingly.      *
 ******************************************************************************************/
function rotate(rotation, bounds) {
	var temp;
	switch(rotation) {
    	case 'Rotation90':
    		ctx.translate(bounds.x + bounds.width, bounds.y + bounds.height);
        	ctx.rotate(-0.5 * Math.PI);
        	
        	//Swap
        	temp = bounds.width;
        	bounds.width = bounds.height;
        	bounds.height = temp;
			break;
		case 'Rotation180':
			ctx.translate(bounds.x + bounds.width, bounds.y);
        	ctx.rotate(-1 * Math.PI);
        	
        	//Swap
        	temp = bounds.width;
        	bounds.width = bounds.height;
        	bounds.height = temp;
			break;
		case 'Rotation270':
			ctx.translate(bounds.x, bounds.y);
        	ctx.rotate(-1.5 * Math.PI);
			break;
		default:
			ctx.translate(bounds.x, bounds.y + bounds.height);
	}
	return bounds;
}

/*************************************************************************************************************************
 *                                                Create Object                                                          *
 *************************************************************************************************************************/
function createObject(object, bounds, objectType, i) {
	/******************************** GENERAL PROPERTIES ********************************/
	ctx.save();
	if (object.Rotation == 'Rotation90' || object.Rotation == 'Rotation180') bounds.x += 6;
	
	backgroundColor(object.BackColor, bounds);                      //BackColor
	ctx.fillStyle  = addColor(object.ForeColor);                    //ForeColor
	bounds = rotate(object.Rotation, bounds);                       //Rotation
	
	switch(objectType) {
    	case 'Text':
    		createTextObject(object, bounds);
			break;
		case 'Shape':
			createShapeObject(object, bounds);
			break;
		case 'Address':
			createAddressObject(object, bounds);
			break;
		case 'CircularText':
			createCircularTextObject(object, bounds);
			break;
		case 'Barcode':
			createBarcodeObject(object, bounds, i);
			break;
		case 'DateTime':
			createDateTimeObject(object, bounds);
			break;
		case 'Counter':
			createCounterObject(object, bounds);
			break;
		case 'Image':
			createImageObject(object, bounds);
			break;
		default:
			console.error('Error!  Cannot process object:  ' + objectType);
	}
	ctx.restore();
};

/*************************************************************************************************************************
 *                                                Text Object                                                            *
 *************************************************************************************************************************/
 function createTextObject(object, bounds) {
	var xTotal = 0;
	var text = parseText(object.StyledText.Element);
	
	if (object.Verticalized == 'True')
		verticalize(object, bounds, text);
	else {
		for (var line = text.length-1; line >= 0; line--) {
			for (i in text[line]) {
				size = textStyle(text[line][i].style, text[line][i].text, object, bounds, line - (text.length-1) + i, text.length);
				xTotal += ctx.measureText(text[line][i].text).width;             //Total width for line
				ctx.translate(ctx.measureText(text[line][i].text).width, 0);     //Move over to continue placing text
			}
			ctx.translate(xTotal * -1, size * -1); //reset text starting position
			xTotal = 0; //reset for each line
		}
	}
}

/*************************************************************************************************************************
 *                                                Shape Object                                                           *
 *************************************************************************************************************************/
function createShapeObject(object, bounds) {
	ctx.fillStyle = addColor(object.FillColor);
	ctx.lineWidth = twipsToPixels(object.LineWidth);
	
	switch(object.ShapeType) {
    	case 'Ellipse':
	    	var centerX = bounds.width/2;
	    	var centerY = bounds.height/2 * -1;
	    	ctx.beginPath();
	    	ctx.moveTo(centerX, centerY - bounds.height/2);
	    	ctx.bezierCurveTo(
		    	centerX + bounds.width/1.5, centerY - bounds.height/2,
		    	centerX + bounds.width/1.5, centerY + bounds.height/2,
		    	centerX, centerY + bounds.height/2);
	    	
	    	ctx.bezierCurveTo(
		    	centerX - bounds.width/1.5, centerY + bounds.height/2,
		    	centerX - bounds.width/1.5, centerY - bounds.height/2,
		    	centerX, centerY - bounds.height/2);
			break;
		case 'Rectangle':
			ctx.strokeRect(0,0,bounds.width,bounds.height *-1);
			ctx.fillRect(0,0,bounds.width,bounds.height * -1);
			break;
		case 'VerticalLine':
			ctx.beginPath();
				ctx.lineTo(bounds.width/2, 0);
				ctx.lineTo(bounds.width/2, bounds.height * -1);
			ctx.closePath();
			break;
		case 'HorizontalLine':
			ctx.beginPath();
				ctx.lineTo(0, bounds.height/2 * -1);
				ctx.lineTo(bounds.width, bounds.height/2 * -1);
			ctx.closePath();
			break;
		default:
			console.error('Error:  Unacceptable ShapeType!');
	}
	ctx.stroke();
	ctx.fill();
}

/*************************************************************************************************************************
 *                                                Address Object                                                         *
 *************************************************************************************************************************/
function createAddressObject(object, bounds) {
	var xTotal = 0;
	var address = parseText(object.StyledText.Element);

	if (object.Verticalized == 'True')
		verticalize(object, bounds, address);
	else {
		for (var line = address.length-1; line >= 0; line--) {
			for (i in address[line]) {
				size = textStyle(address[line][i].style, address[line][i].text, object, bounds, line - (address.length-1) + i, address.length);
				xTotal += ctx.measureText(address[line][i].text).width;             //Total width for line
				ctx.translate(ctx.measureText(address[line][i].text).width, 0);     //Move over to continue placing text
			}
			ctx.translate(xTotal * -1, size * -1); //reset text starting position
			xTotal = 0; //reset for each line
		}
	}
}

/*************************************************************************************************************************
 *                                                Circular-Text Object                                                   *
 *************************************************************************************************************************/
function createCircularTextObject(object, bounds) {
	switch(object.Mode) {
    	case 'ArcTextTop':
    		fillTextCurve(object.Text, 0, 0, bounds.width/4, Math.PI/12, 1);
			break;
		case 'ArcTextBottom':
			fillTextCurve(object.Text, 0, 0, bounds.width/4, Math.PI/12);
			break;
		case 'CircularText':
			switch(object.CircleAlignment) {
				case 'CircleAtTop':
					fillTextCircle(object.Text, 0, 0, bounds.height/2, Math.PI);
					break;
				case 'CircleAtBottom':
					fillTextCircle(object.Text, 0, 0, bounds.height/2, Math.PI * 2);
					break;
			}
			break;
		default:
			console.error('Error:  Unacceptable circle mode!');
	}
}

/******************************************************************************************
 * Name:           fillTextCircle                                                         *
 * Description:    Writes text on a circle.                                               *
 ******************************************************************************************/
function fillTextCircle(text, x, y, radius, startRotation) {
   var numRadsPerLetter = Math.PI * 2/ text.length;
   ctx.save();
   ctx.translate(x, y);
   ctx.rotate(startRotation);

   for(var i = 0; i < text.length; i++) {
      ctx.save();
      ctx.rotate(i * numRadsPerLetter);
	  
	  if (text.charAt(i) != ' ')
      	ctx.fillText(text.charAt(i), 0, radius * -1);
      else
      	ctx.translate(0, radius * -1);
      ctx.restore();
   }
   ctx.restore();
}

/******************************************************************************************
 * Name:           fillTextCurve                                                          *
 * Description:    Writes text on a curve.                                                *
 ******************************************************************************************/
function fillTextCurve(text, x, y, radius, space, top) {
	space = space || 0;
	var numRadsPerLetter = (Math.PI - space * 2) / text.length;
	ctx.save();
	ctx.translate(radius * 2, radius/3);
	var k = (top) ? 1 : -1;
	ctx.rotate(-k * ((Math.PI - numRadsPerLetter) / 2 - space));
	
	for(var i = 0; i < text.length; i++) {
		ctx.save();
		ctx.rotate(k * i * (numRadsPerLetter));
		ctx.textAlign = "center";
		ctx.textBaseline = (!top) ? "top" : "bottom";
		ctx.fillText(text[i], 0, -k * (radius));
		ctx.restore();
	}
	ctx.restore();
}

/*************************************************************************************************************************
 *                                                Barcode Object                                                         *
 *************************************************************************************************************************/
function createBarcodeObject(object, bounds, i) {
	var img = new Image;
	img.onload = function(){
		ctx.drawImage(img, 0, bounds.height * -1, bounds.width, bounds.height);
	};
	
	img.src = 'barcode' + i + '.png';
}

/*************************************************************************************************************************
 *                                                Date-Time Object                                                       *
 *************************************************************************************************************************/
function createDateTimeObject(object, bounds) {
	var date;
	var time = '';
	switch(object.DateTimeFormat) {
    	case 'LongSystemDate':
    		date = 'MMMM d, y';
			break;
		case 'WeekdayLongMonthDayLongYear':
			date = moment().format("dddd, MMMM DD, YYYY");
			break;
		case 'WeekdayDayLongMonthLongYear':
			date = moment().format("dddd, DD MMMM, YYYY");
			break;
		case 'AbbrWeekdayAbbrMonthDayLongYear':
			date = moment().format("MMMM DD, YYYY");
			break;
		case 'AbbrWeekdayDayAbbrMonthLongYear':
			date = moment().format("DD MMMM, YYYY");
			break;
		case 'LongMonthDayLongYear':
			date = moment().format("MM-DD-YYYY");
			break;
		case 'DayLongMonthLongYear':
			date = moment().format("DD-MM-YYYY");
			break;
		case 'MonthDayLongYear':
			date = moment().format("MM-DD-YY");
			break;
		case 'DayMonthLongYear':
			date = moment().format("DD-MM-YY");
			break;
		case 'MonthDayYear':
			date = moment().format("MM.DD.YYYY");
			break;
		case 'DayMonthYear':
			date = moment().format("DD.MM.YYYY");
			break;
		case 'AbbrMonthDayLongYear':
			date = moment().format("YYYY-MM-DD");
			break;
		case 'AbbrMonthDayYear':
			date = moment().format("YYYY-DD-MM");
			break;
		case 'DayAbbrMonthLongYear':
			date = moment().format("DD-MMM-YYYY");
			break;
		case 'DayAbbrMonthYear':
			date = moment().format("MMM DD, YYYY");
			break;
		default:
			console.error('Error:  Unacceptable DateTimeFormat!');
	}
	
	if (object.IncludeTime == 'True') {
		if (object.Use24HourFormat == 'False')
			time = moment().format("hh:mm A");
		else
			time = moment().format("HH:mm");
	}
	
	var text = object.PreText + date + ' ' + time + object.PostText;
	var textBlock = [], line = [];
	line.push(({text:  text, style:  object.Font.$}));
	textBlock.push(line);
	
	if (object.Verticalized == 'True')
		verticalize(object, bounds, textBlock);
	else
		textStyle(object.Font.$, text, object, bounds, 0, 1);	
}

/*************************************************************************************************************************
 *                                                Counter Object                                                         *
 *************************************************************************************************************************/
function createCounterObject(object, bounds) {
	var start = parseInt(object.Start);
	var increment = parseInt(object.Increment);
	var formatWidth = parseInt(object.FormatWidth);
	var text = object.Current;
	
	for (var i = object.Current.length; i < formatWidth; i++) {
		if (object.UseLeadingZeros == 'True')
			text = '0' + text;
		else
			text = ' ' + text;
	}
	
	text = object.PreText + text + object.PostText;
	var textBlock = [], line = [];
	line.push(({text:  text, style:  object.Font.$}));
	textBlock.push(line);
	
	if (object.Verticalized == 'True')
		verticalize(object, bounds, textBlock);
	else
		textStyle(object.Font.$, text, object, bounds, 0, 1);
}

/*************************************************************************************************************************
 *                                                Image Object                                                           *
 *************************************************************************************************************************/
function createImageObject(object, bounds) {
	//Add border to image if border exists
	if (object.BorderWidth > 0) {
		var color = getRGBColor(object.BorderColor);
		ctx.fillStyle  = 'rgba('+ color.r + ',' + color.g + ',' + color.b + ',' + color.a + ')';
		ctx.rect(0,bounds.height * -1,bounds.width,bounds.height);
		ctx.lineWidth = twipsToPixels(object.BorderWidth);
		ctx.stroke();
	}
	
	var img = new Image;
	img.onload = function(){
		
		var width = (bounds.width > img.width) ? img.width : bounds.width;
		var height = (bounds.height > img.height) ? img.height : bounds.height;
		
		hAlignment(object.HorizontalAlignment, width, bounds.width);
		vAlignment(object.VerticalAlignment, bounds.height, height);
		
		switch(object.ScaleMode) {
	    	case 'Uniform': //Also known as 'Proportional' in DLS
	    		var propWidth = width * bounds.height / bounds.width;
	    		ctx.drawImage(img, bounds.width/2 - propWidth/2, height * -1, propWidth, bounds.height);
				break;
			case 'Fill':
				ctx.drawImage(img, 0, height * -1, bounds.width, bounds.height);
				break;
			case 'None':
				ctx.drawImage(img, img.width/2 - bounds.width/2, img.height/2 - bounds.height/2, bounds.width, bounds.height/2, 0, height * -1, bounds.width, bounds.height);
				break;
		}
	};
	
	if (object.Image != undefined)
		img.src = 'data:image/png;base64,' + object.Image;   //base64 encoding
	else
		img.src = object.ImageLocation;                      //URL
}
