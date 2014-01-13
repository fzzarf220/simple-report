var express=require('express')
	,fs=require('fs')
	,mysql=require('mysql')
	,url=require("url")
	,yaml=require('js-yaml')
	,Mustache=require("mustache")
	,html=require("html");

var app=express();
app.configure(function() {
  app.use(express.static(__dirname + '/public'));
});

var config={}
// add the initial config, rooted to ./config/config.yaml
add_config('.','/')

/**
 * given a value, check if it exists in array
 * @param mix needle value to check for in the array
 * @param array haystack the array to check in
 * @return boolean true if successfully found else false
 **/
function in_array(needle, haystack)
{
	for(var i=0; i<haystack.length; i++)
		if(haystack[i]==needle) return true

	return false
}

/**	
 * add to the config array
 * @param stirng path_to_reprt the path to report
 * @param string key (optional) if key provided then used in config else the path_to_reports used as key
 * @param boolean key (optional) clear cache, false by default else true
 **/
function add_config(path_to_report,key,clear_cache)
{
	var file_config='/config/config.yaml'
	var file_path=path_to_report+file_config

	// get file path from cache
	try
	{
		var file_path_cached=require.resolve(file_path)
		var _key=(typeof key=="undefined" ? path_to_report : key)
	} catch (e)
	{
		throw "Error loading config file '"+file_path+"'"
	}
	
	if(clear_cache == true)
		delete require.cache[require.resolve(file_path)]
	if (typeof config[_key] == "undefined")
	{
		console.log('watching file ' + file_path);
		fs.watchFile(file_path, function(current, previous)
		{
			console.log("=============================")
			console.log("file changed")
			console.log(current)
			console.log("-----------------------------")
			console.log(previous)
			add_config(path_to_report,key,true)
			console.log("=============================")
		})
	}

	config[_key]=require(file_path)
}

/**
 * get config value from the config files, will look in local 
 * config first and then global, throws an error if no key found
 * @param mix key either a string or an array of keys
 * @param string path_to_report the root path of where the report  
 *                               is located
 * @return mix return's the respective key value, throws an error 
 *             if no key found
 **/
function get_config(key, path_to_report)
{
	add_config(path_to_report)
	var val=null
	var type=[path_to_report,"/"]
	var keys=(typeof key == "string" ? [key] : key)
	console.log("path_to_report", path_to_report)
	console.log("searching for key: ")
	console.dir(key)

	// traverse the local then the global configs
	for (var i=0; i<type.length; i++)
	{
		console.log("searching in "+type[i]+" config")

		//traverse the array of keys
		for (var j=0; j<keys.length; j++)
		{
			try
			{
				if(val==null) val=config[type[i]]
				val=val[keys[j]]
			}
			catch (e)
			{
				if(type[i]=="/") throw new Exception("Config key not found")
				val=null
			}
		}

		if(val != null) break
	}

	console.log("key value found: ")
	console.dir(val)
	return val
}

/**
 * return the data as json
 * @param object results the results object that contains the data
 * @param object fields the fields object that contains the fields 
 * @param boolean data_in_rows by default true, false if the data series is in columns
 * @return object the json object with the following data
 	{
		 series: object array of series data
		,header: string array of headers
		,totals: an array of totals
 	}
 **/
function mysql_to_json(results, fields, data_in_rows)
{
	data_in_rows=(typeof data_in_rows != "undefined" && data_in_rows == false ? "cols" : "rows")
	var series=new Array()
	var headers=new Array()
	var totals=new Array()

	if(typeof results == 'undefined' || typeof fields == 'undefined')
		return {
			 'series': series
			,'totals': [{data: totals}]
			,'header': headers
		}

	function set_data (array,field,value)
	{
		if(typeof array[field] != "object")
			array[field]=new Array()

		array[field].push(value)
	}

	// data in rows
	switch (data_in_rows)
	{
		default:
		case "rows":
			/**
				# given
				var N=results.length-1

				# rows
				header=fields[0-3]
				xaxis=fields[1-3]
				legands=results[0-N][0]
				# data in respect to the legands
				series=
				[
					 legand[0]=results[0][1-3]
					,legand[1]=results[1][1-3]
					  ...
					,legand[N]=results[N][1-3]
				]
			**/
			for (var i=0; i<fields.length; i++)
			{
				var _field=fields[i]["name"]
				headers.push(_field)
			}

			for (var i=0; i<results.length; i++)
			{
				var legand=results[i][headers[0]]

				for (var j=1; j<headers.length; j++)
				{
					var _field=headers[j]
					var _val=results[i][_field]

					set_data(series,legand,_val)
				}
			}

			break;

		case "cols":
			/**
				# given
				var N=results.length-1

				# cols
				header=[ headers, results[0-N][0] ]
				xaxis=results[0-N][0]
				legands=fields[1-3]
				series=
				[
					 legands[0]=[results[0-N][1]]
					,legands[1]=[results[0-N][2]]
					,legands[2]=[results[0-N][3]]
				]
			**/
			//set the initial column
			headers.push("Label")

			for (var i=0; i<results.length; i++)
			{
				for (var key in results[i])
				{
					var _val=results[i][key]

					if(!in_array(_val,headers))
						headers.push(_val)
					break
				}

				for (var j=1; j<fields.length; j++)
				{
					var _field=fields[j]["name"]
					var _val=results[i][_field]
					set_data(series,_field,_val)
				}
			}

			break
	}

	/**
	 * get the totals in an array of number values
	 * @param array an array of integers
	 * @return int the total number
	 **/
	function get_total(array)
	{
		var value=0

		for (var i=0; i<array.length; i++)
			if( typeof array[i] == "number") 
				value+=array[i]

		return value
	}

	var _series=series
	series=new Array()

	for (var key in _series)
	{
		series.push(
		{
			 name: key
			,data: _series[key]
		})

		totals.push([
			 key,get_total(_series[key])
		])
	}

	return {
		 'series': series
		,'totals': [{data: totals}]
		,'header': headers
	}
}

/**
 * publish json data
 * @param json data a json object 
 * @param stirng title the title
 * @param string the set object
 * @param obj response the response object
 * @return void
 **/
function set_json_data(data, title, set, response)
{
	if (error) response.send(error);
	var graph=data
	var table=graph
	var xaxis=new Array()

	for(var i=1; i<graph["header"].length; i++)
		xaxis.push(graph["header"][i])

	if (set["table_layout_vertical"]==true)
		table=data

	var obj={
		 title: title
		,chart:
		{
			 xaxis: xaxis
			,title_xaxis: (set["graph"] && set["graph"]["title_xaxis"] ? set["graph"]["title_xaxis"] : "")
			,title_yaxis: (set["graph"] && set["graph"]["title_yaxis"] ? set["graph"]["title_yaxis"] : "")
			,series: graph["series"]
			,totals: graph["totals"]
		}
		,table:
		{
			 header: table["header"]
			,disable_totals_row: set["disable_totals_row"]
			,disable_totals_column: set["disable_totals_column"]
			,series: table["series"]
		}
	}

	//console.log("sending response")
	//console.dir(obj)
	response.send(obj);	
}

// data route
app.get('/data/*',function(request,response)
{
	console.log("fetching data")
	var path_to_report="./"+url.parse(request.url).pathname.replace(/^\/data\//,'')

	/**
	 * for given query, fetch data and set the query output to page
	 * @param string query the query string
	 * @param string title the query title
	 * @param object set an object that explains how the data set will be displayed
	 * @param object response the repsponse object to send output to
	 * @return void
	**/
	function set_query(query, title, set, response)
	{
		// create mysql connection
		var connection=mysql.createConnection({
			 host: get_config('local_mysql_host', path_to_report).toString()
			,port: get_config('local_mysql_port', path_to_report).toString()
			,user: get_config('local_mysql_user', path_to_report).toString()
			,password: get_config('local_mysql_password', path_to_report).toString()
			,database: get_config('local_mysql_database', path_to_report).toString()
			,insecureAuth: get_config('local_mysql_insecure_auth', path_to_report).toString()
		});
		//console.log(title)
		console.log(query)
		//console.dir(set)

		// run query against mysql db
		connection.query(query,function (error, results, fields) 
		{
			//close connection
			connection.end(function(error) 
			{
			  	// The connection is terminated now
			  	console.log("closing db connection")
				if (error) console.log("error closing connection")
			})

			if (error) response.send(error);
			var graph=mysql_to_json(results, fields, (set["data_in_columns"] ? false : true))
			var table=graph
			var xaxis=new Array()

			for(var i=1; i<graph["header"].length; i++)
				xaxis.push(graph["header"][i])

			if (set["table_layout_vertical"]==true)
				table=mysql_to_json(results, fields, set["table_layout_vertical"])

			var obj={
				 title: title
				,chart:
				{
					 xaxis: xaxis
					,title_xaxis: (set["graph"] && set["graph"]["title_xaxis"] ? set["graph"]["title_xaxis"] : "")
					,title_yaxis: (set["graph"] && set["graph"]["title_yaxis"] ? set["graph"]["title_yaxis"] : "")
					,series: graph["series"]
					,totals: graph["totals"]
				}
				,table:
				{
					 header: table["header"]
					,disable_totals_row: set["disable_totals_row"]
					,disable_totals_column: set["disable_totals_column"]
					,series: table["series"]
				}
			}

			//console.log("sending response")
			//console.dir(obj)
			response.send(obj);
		})
	}

	var id=request.query['id']
	var category=request.query['category']
	var reports=get_config("reports", path_to_report)
	console.log("URL id: " + id)
	console.log("URL category: "+category)
	console.log("URL reports: "+reports)

	//validate the request
	for(var c=0; c<reports.length; c++)
	{
		// ignore request if not correct category
		if (category != reports[c]["category"]) 
			continue

		var _reports=reports[c]["reports"];

		for (var r=0; r<_reports.length; r++)
		{
			if (id != _reports[r]["id"]) 
				continue

			var _report=_reports[r]
			var _title=_report["title"]
			var _set=_report["set"]
			console.log("report: ",_report)
			console.log("set: ",_set)
			console.log("sending request --> "+id)

			switch(_report["type"])
			{
				case "json_file":
				case "query_file":
					console.log("path to query file: " + path_to_report+"/"+_report["data"])
					// get query from file
					fs.readFile(path_to_report+"/"+_report["data"],'utf8',function(error,data)
					{
						if (error) response.send(error);
						if (_report["type"]=="json_file")
							set_json_data(data,_title,_set,response);
						else
							set_query(data,_title,_set,response);
					})
					break;
				case "json_string":
					set_json_data(_report["data"],_title,_set,response);
					break
				case "query_string":
				default:
					set_query(_report["data"],_title,_set,response);
					break
			}
			
			break
		}
	}
})

// report route
app.get('/reports/*', function(request, response)
{
	console.log("fetching report")
	var template_body=fs.readFileSync("./templates/base.page.html",'utf8');
	var path_to_report="./"+url.parse(request.url).pathname.replace(/^\//,'');
	var path_to_data="/data/"+url.parse(request.url).pathname.replace(/^\//,'');
	console.log("path: " + url.parse(request.url).pathname);
	console.log("path_to_report: " + path_to_report)
	console.log("path_to_data: " + path_to_data)

	// check if path exists
	fs.exists(path_to_report, function(exists){
		if (!exists) response.send(404);

		var output=Mustache.render(template_body,
		{
			 title: get_config("title", path_to_report)
			,reports: get_config("reports", path_to_report)
			,path_to_data:path_to_data
		})

		return response.send(output);
	})
});

// root route
app.get('/',function(request,response)
{
	var template_body=fs.readFileSync("./templates/base.page.html",'utf8');
	var path_to_report="./"+url.parse(request.url).pathname.replace(/^\//,'');

	var output=Mustache.render(template_body,
	{
		 title: get_config("title", path_to_report)
		,reports: get_config("reports",path_to_report)
	})

	return response.send(output);
});

app.set('title','Reports')
app.listen(3000);
console.log('listening on port 3000')