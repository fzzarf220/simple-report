/**
 * set the data from given data object
 * @param string id id of the element to render table into
 * @param string title the table title
 * @param obj data the data to use for rendering the data, the data needs the following keys:
 *                 data - an array of objects
 *                 header_legend - the header for the legend
 *                 header - the column headers
 *                 disable_totals_row - (default false) if to disable the total's row
 *                 disable_totals_column - (default false) to disable the total's column
 * @return void
 **/
function set_table(id,title,data)
{
	var thead=document.createElement('thead')
	var tbody=document.createElement('tbody')
	var tfoot=document.createElement('tfoot')
	var tr=document.createElement('tr')
	var td=document.createElement('td')
	var th=document.createElement('th')
	var col_totals=[]
	var col_types=new Array()

	console.log("set_table()")
	console.log("id: "+id)
	console.log("title: "+title)
	//===========================================
	// set body
	//===========================================

	//loop over each object in the array to create rows
	$.each(data.series, function (index, item)
	{
		var total=0
		col_types.push(item.name)
		// new table row
		tr=document.createElement('tr')
		// add legand
		td=document.createElement('td')
		td.className='legand'
		td.innerHTML=item.name
		tr.appendChild(td)

		$.each(item.data, function (index, item)
		{
			var td=document.createElement('td')
			td.className=''
			col_types.push(typeof(item))

			if(typeof item == "number") 
			{
				td.className="number"

				// initialize
				if (typeof col_totals[index] != "number") 
					col_totals[index]=0

				col_totals[index]+=parseFloat(item)
				total+=parseFloat(item)
			}

			td.innerHTML=item
			tr.appendChild(td)
		})

		// check if showing total column
		if(typeof data.disable_totals_column == "undefined" || data.disable_totals_column != true)
		{
			var td=document.createElement('td')
			td.className='number'
			td.innerHTML=Math.round(total*100,2)/100
			tr.appendChild(td)
		}

		tbody.appendChild(tr)
	});

	//===========================================
	// set header
	//===========================================
	// NOTE: set header after data to determine the column type
	tr=document.createElement('tr')

	//set table headers
	$.each(data.header,function (index,item)
	{
		var th=document.createElement('th')
		th.className=(col_types[index] == "number" ? "number" : "") 
		th.innerHTML=item
		tr.appendChild(th)
	})
	
	// set the total column
	if(typeof data.disable_totals_column == "undefined" || data.disable_totals_column != true)
	{
		th=document.createElement('th')
		th.className='number'
		th.innerHTML='Total'
		tr.appendChild(th)
	}

	thead.appendChild(tr)

	//===========================================
	// set footer
	//===========================================
	if(typeof data.disable_totals_row == "undefined" || data.disable_totals_row != true)
	{
		total=0
		tr=document.createElement('tr')
		th=document.createElement('th')
		th.innerHTML='Total'
		tr.appendChild(th)

		$.each(col_totals,function (index,item)
		{
			th=document.createElement('th')

			if(typeof item == "number") 
			{
				th.className="number"
				th.innerHTML=Math.round(item*100,2)/100
				total+=parseFloat(item)
			}

			tr.appendChild(th)
		})

		if(typeof data.disable_totals_column == "undefined" || data.disable_totals_column != true)
		{
			th=document.createElement('th')
			th.className='number'
			th.innerHTML=(typeof total == "number" ? Math.round(total*100,2)/100 : "")
			tr.appendChild(th)
		}

		tfoot.appendChild(tr)
	}

	//create table
	var table=document.createElement('table')
	table.className='table table-striped table-hover table-condensed'
	table.appendChild(thead)
	table.appendChild(tbody)
	table.appendChild(tfoot)

	var _default_sort_column_index=0

	// for setting last columnt to be default sort column
	if(typeof data.disable_totals_column == "undefined" || data.disable_totals_column != true)
	{
		_default_sort_column_index=data.header.length

		if(typeof data.header_legend == "string" && data.header_legend.length >0)
			_default_sort_column_index+=1
	}

	/* insert the html string*/
	$('#'+id+' #data').html(table);
	try
	{
		$('#'+id+' table').tablesorter({sortList: [[_default_sort_column_index,1]]}); 
	}catch(e){}
}

/**
 * create a graph given the data
 * @param string id the id of the element to render the graph in
 * @param string type the graph type, possible values:
 *					spline - Line Graph
 *                  area - Line Graph (Stacked)
 *                  column - Bar Graph
 *                  bar - Bar Graph (Stacked)
 *                  pie - Pie Chart (experimental)
 * @param string title the graph title
 * @param obj data (optional) json object, if no data object given then it 
 *                 will try to get a previous data object set to node at 
 *                 provided id. the object needs the following keys:
 *
 * 				   data - array of data
 *				   label_xAxis - string label for the x-axis
 *				   label_yAxis - array of labels for the y-axis
 *				   title - string title
 *		
 * @return void
 **/
function set_graph(id,type,title,data)
{
	// if data not give, use what's there and assign locally
	if(typeof data == "undefined")
	{
		data=document.getElementById(id).data
		console.log("fetching from stored data id: '"+id+"'")
		console.dir(data)
	}
	else data=document.getElementById(id).data=data

	if(typeof title == "undefined")
		title=$("#"+id).title
	else $("#"+id).title="hello world"

	chart=new Highcharts.Chart
	({
		 title: 
		{
			text: title
		}
		,chart: 
		{
			 renderTo: id
			,defaultSeriesType: type
			,zoomType: 'x'
		}
		,credits:{ enabled:false }
		,legend:
		{
			 layout:"vertical"
			,align:"right"
			,verticalAlign:"middle"
		}
		,xAxis: 
		{
			 categories: data.xaxis
			,minPadding: 0.2
			,maxPadding: 0.2
			,gridLineDashStyle: 'dot'
			,gridLineWidth:1
			,title:
			{
				 text: data.title_xaxis
				,margin: 10
			}
			,labels: 
			{
				 rotation: 45
				,align:(type=="bar" ? "right" : "left")
			}
			,tickmarkPlacement:"on"
		}
		,yAxis: 
		{
			 minPadding: 0.2
			,maxPadding: 0.2
			,title: 
			{
				 text: data.title_yaxis
				,margin: 10
			}
		}
		,plotOptions: 
		{
			area: 
			{
				 stacking: 'normal'
				,lineColor: '#666666'
				,lineWidth: 1
				,marker: 
				{
					 lineWidth: 1
					,lineColor: '#666666'
				}
			}
			,bar:
			{
				stacking: 'normal'
			}
			,pie:
			{
				 allowPointSelect: true
				,dataLabels: { 
					 enabled: true
					,format: '<b>{point.name}</b>: {point.percentage:.1f} %'
				}
			}
		}
		,series: (type=="pie" ? data.totals : data.series )
	});
}	