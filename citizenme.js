$(document).ready(function(){

	var tableGenerator = {
		elem : null,
		services : [],
		datatable : null,
		init : function(elem){
			this.elem = $(elem);
			var _self = this;
			this.getData(function(data){
				_self.getServices(data);
				_self.setData(data);
			});
		},
		setData : function(data){
			console.log(data);
			console.log(this);
			this.datatable = this.elem.dataTable({
				data: data,
				bFilter : true,
				sDom : 'rtpli',
		        columns: [
		            { "title": "Service" },
		            { "title": "Version", "class": "center" },
		            { "title": "Avg. Note" }
		        ]
			});

			//Create the dropdown menu
			var dropdown = $('<select></select>');
			for(i in this.services){
				var option = $('<option></option>').attr(
						{'value' : this.services[i]	}
					).text(this.services[i]);

				dropdown.append(option);
			}

			var _self = this;
			//add listener to dropdown
			dropdown.on('change', function _changeServiceListener(event){
				_self.changeServiceEvent(this)
			});

			dropdown.trigger('change');

			this.elem.before(dropdown);
		},
		getData : function(callback){
			console.log('ok');
			$.ajax({
				url : 'https://rawgit.com/cferretti/data-test/master/getAWSData.json',
				success : function(data){
					callback(data);
				}
			})
		},
		getServices : function(data){
			for(i in data){
				//Makeit unik
				if(this.services.indexOf(data[i][0]) === -1){
					this.services.push(data[i][0]);
				}
			}

			console.log(this.services);
		},
		changeServiceEvent : function(select){
			this.datatable.fnFilter($(select).val());
		}
	};

	var Chart = {
		elem : null,
		lines : [],
		generate : function(elem){
			this.elem = elem;
			var svg = d3.select(this.elem)
			.append("svg")
			.attr('width', 800)
			.attr('height', 200)
			.style('background','red');

			this.lines = svg.append('g').attr('class', 'lines');
			//make the line
			this.createLines();
			//Make the row

			//Place point
		},
		createLines : function(){
			this.lines
			.selectAll('line')
			.data([0,50,1,20])
			.enter()
			.append('line')
			.attr('class','line')
			.style('fill','black')
			.attr('x',function(d){
				return d;
			})
			.attr('y', function(d){
				return d;
			});
		},
		createRows : function(){

		},
		placePoints : function(){

		}
	}
	$.fn.citizenTable = function(options) {  
		var config = {}; 
		var defaults = $.extend(defaults, options);

		this.each(function() {
			tableGenerator.init(this);
		});

		return this;  
	}; 

	$.fn.citizenGraphic = function(options){
		var config = {};
		var defaults = $.extend(defaults, options);

		this.each(function() {
			Chart.generate(this);
		});

		return this;
	}
	$('#test').citizenTable();
	$('#graphics').citizenGraphic();
});