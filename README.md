simple-reports v2.0.0
=====================
This is a simple reort server using nodejs, twitter bootstrap, highchart, yaml, and MySQL. The bootstrap and highchart are fetched via public CDNs.  

The idea is to simply take a data set from a SQL query and easily to create a decent looking report with graph and table. 

# Pre Install Dependencies
The following list of applications need to be installed
* mysql
* nodejs
* npm

# Install Instructions
To install, run the following:
		$ npm install


# Run Instruction
To start application, run the following command:
		$ node server

To reach the server, open a browser and go to http://localhost:3000 

NOTE: By default the server is hosting on port 3000
 
# Configration Instructions

Configurations can be done in a global context and local context.  All global configurations are set in the config.yaml file under the project's "config" directory.  In the local report directoy, within its config.yaml file you can override global configurations.

