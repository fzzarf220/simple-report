simple-reports v2.0.0
=====================
This is a simple reort server using nodejs, twitter bootstrap, highchart, yaml, and MySQL. The bootstrap and highchart are fetched via public CDNs.  

The idea is to simply take a data set from a SQL query and easily to create a decent looking report with graph and table. 

Dependencies:
* mysql
* nodejs

To install, run the following:
	$ npm install

To start application, run the following command:
	$ node server
 
Setting Configuration:

Configurations can be done in a global context and local context.  All global configurations are set in the config.yaml file under the project's "config" directory.  In the local report directoy, within its config.yaml file you can override global configurations.

