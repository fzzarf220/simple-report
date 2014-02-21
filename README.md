# simple-reports v2.0.0
This is a simple reort server create via nodejs utilizing the following:
* twitter bootstrap - (via CDN) use to quickly create beautiful site
* highchart - (via CDN) used for creating georgous graphs 
* yaml - simplify configuration 
* MySQL - data va relation database
* JSON - data via JSON objects

The idea is to simply take a data set from a SQL query and easily to create a decent looking report with graph and table. 

## Pre Install Dependencies
The following list of applications need to be installed
* mysql
* nodejs
* npm

## Install Instructions
To install, run the following:
	$ npm install


## Run Instruction
To start application, run the following command:
	$ node server

To reach the server, open a browser and go to http://localhost:3000 

NOTE: By default the server is hosting on port 3000
 
## Configration Instructions

Configurations can be done in a global context and local context.  All global configurations are set in the config.yaml file under the project's "config" directory.  In the local report directoy, within its config.yaml file you can override global configurations.

Below is an example of a JSON report configured via the YAML report config.  The YAML config will produce a report page that has a single report called "Report 1" where the graph by default will be displayed as a bar graph from the JSON data set to variable "data":

	title: Example One
	reports:
	  - category: Report 1
	    reports: 
	    - title: Assigned Tickets
	      id: report1
	      description: Weekly ticket count
	      type: json_string 
	      data: |
	        {
	           "header": ["Members","Monday","Tuesday","Wednesday","Thursday","Friday"]
	          ,"series": 
	          [
	             {"name": "James", "data": [1,12,33,14,5]}
	            ,{"name": "Allen", "data": [101,23,124,105,6]}
	            ,{"name": "Celine", "data": [1,12,13,5,36]}
	            ,{"name": "Dee", "data": [20,23,23,15,106]}
	            ,{"name": "Ejay", "data": [1,0,4,3,2]}
	            ,{"name": "Ella", "data": [2,13,4,4,2]}
	          ]
	        }
	      set:
	        data_in_rows: true
	        data_in_columns: false
	        disable_totals_row: false 
	        disable_totals_columen: false
	        graph:
	          type: bar
	          title_xaxis: Day of the Week
	          title_yaxis: Ticket Count


Config 
| title | the page title, this title will appear in the browser menu and also on the top most navigation pane |
| reports | a collection of categories |

Reports 
| category | the category name |
| reports | the collection of reports within the category |

Category
| title | the name of the category |
| id | a uniqute id used by Javascript |
| description | a description of the report | 
| type | valid report types, see "Valid Report Types" table | 


Valid Report Type
| json_type | |

