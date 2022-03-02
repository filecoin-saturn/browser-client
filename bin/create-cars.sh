#!/usr/bin/env bash

scriptDir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null && pwd )"
cd $scriptDir/../placeholders/test-files

for file in *; do
    basename="${file%.*}"
    tempCarFile="$basename-temp.car"
    carFile="$basename.car"
    car create -f $tempCarFile $file
    car get-dag --version 1 $tempCarFile $carFile
    rm $tempCarFile
done
