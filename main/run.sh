#!/bin/bash

if [ -f $1 ];
then
	echo "node label-barcode_generator.js $1"
	node label-barcode_generator.js $1
	
	echo "node label-maker.js $1"
	node label-maker.js $1
	
	echo "\nCleaning files..."
	find . -type f -name barcode\*
	find . -type f -name barcode\* -exec rm {} \;
	
	echo "\nFinished!"
else
	echo  "Error:  The file '$1' does not exist."
fi