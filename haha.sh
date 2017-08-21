#!/bin/bash

spawn npm install
set timeout 300
expect "Agree to the license terms? y/n"

send "y\r"

expect "Select your Highcharts version (e.g. 4.2.2):"

send "y\r"
expect "Enable styled mode? (requires Highcharts/Highstock 5 license)"

send "y\r"

set timeout 240000
#send "exit\r"
expect eof