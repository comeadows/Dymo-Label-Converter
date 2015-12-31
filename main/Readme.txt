Label-Maker 12-30-2015

GENERAL USAGE NOTES
-----------------------------------------------------------------------------------------------------------------------------------------
	- Run scripts with 'sh run.sh FILENAME'.
		- Example:  sh run.sh LabelExample.label
		- This script runs both scripts and deletes leftover barcode images
		
	- label.pdf is output file (same directory)
		- The output path for 'label.pdf' is located in label-maker.js on line 84
		
	- Italics is unsupported by node canvas.
	- Mirroring is unsupported at this time.
	- When printing to a DYMO Label printer, be sure to select the correct Paper Size for your label.

BARCODES
-----------------------------------------------------------------------------------------------------------------------------------------
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

CONTACT
-----------------------------------------------------------------------------------------------------------------------------------------
Name:    Cassie Meadows
Mobile:  615-815-0437
Work:    931-244-8989
E-mail:  cmeadows@avkare.com

Documentation
-----------------------------------------------------------------------------------------------------------------------------------------
DYMO Label Documentation:         https://docs.google.com/document/d/1Hb_1qDJmnaWM7-AfKr6LguLxh2nAoWWo_zR2ZmSq4vA/edit?usp=sharing