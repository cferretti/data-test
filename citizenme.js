$(document).ready(function(){
	var urlDataTotal = 'https://rawgit.com/cferretti/data-test/master/%s-total.json';
	var offsetService = 4;
	var offsetVoteType = 3;
	var down_vote = 'unreasonablechange'; 
	var up_vote = 'reasonablechange';
	var display_null = true;

	var tableGenerator = {
		elem : null,
		services : [
			{
				_id : 'facebook',
				text : 'Facebook'
			},
			{
				_id : 'twitter',
				text : 'Twitter'
			},
			{
				_id : 'flickr',
				text : 'Flickr'
			},
			{
				_id : 'google',
				text : 'Google'
			},
			{
				_id : 'linkedin',
				text : 'LinkedIn'
			},
			{
				_id : 'instagram',
				text : 'Instagram'
			},

		],
		data : [],
		datatable : null,
		init : function(elem){
			this.elem = $(elem);
			this.initTable();
			this.createDropdown();
		},
		createDropdown : function(){
			var dropdown = $('<select></select>');
			for(i in this.services){
				var option = $('<option></option>').attr(
						{'value' : this.services[i]._id	}
					).text(this.services[i].text);

				dropdown.append(option);
			}

			var _self = this;
			//add listener to dropdown
			dropdown.on('change', function _changeServiceListener(event){
				_self.getDataTotal(this, function(data){ _self.createData(data) });
			});

			dropdown.trigger('change');
			this.elem.before(dropdown);
		},
		createData : function(data){
			var converted_data = [];
			this.data = [];
			var can_be_displayed = false;
			for(i in data){
				can_be_displayed = true;
				//Get part of the string
				var parts = data[i].name.split('/');
				var service = parts[offsetService];
				var type = parts[offsetVoteType];
				//Check if revision exit
				var subparts = service.split('-');
				var revision = '';
				if(typeof(subparts[1]) !== 'undefined' && subparts[1] !== ''){
					revision = subparts[1];
				}else if(!display_null){
					can_be_displayed = false;
				}

				if(typeof(subparts[1]) !== 'undefined'){
					service = subparts[0];
				}

				var reasonable_vote = 0;
				var unreasonable_vote = 0;

				if(type == down_vote){
					unreasonable_vote = data[i].count;
				}else if(type == up_vote){
					reasonable_vote = data[i].count;
				}

				var index = service+revision;
				
				if(can_be_displayed){
					if(converted_data.indexOf(index) === -1){
						converted_data[index] = { 
							'service' : service,
							'rev' : revision,
							'unreasonable' : unreasonable_vote,
							'reasonable' : reasonable_vote,
							'time' : new Date(data[i].start_time*1000).toLocaleDateString()
						};
					}else{
						if(type == down_vote){
							converted_data[index].unreasonable = unreasonable_vote;
						}else if(type == up_vote){
							converted_data[index].reasonable = reasonable_vote;
						}
					}
				}

			}

			for(i in converted_data){
				this.data.push(converted_data[i]);
			}

			this.setData();
		},
		initTable : function(){
			this.datatable = this.elem.dataTable({
				data: this.data,
				sDom : 'rtpli',
		        columns: [
		            { "title": "Service", "data" : "service" },
		            { "title": "Revision", "class": "center", "data" : "rev" },
		            { "title": "Reasonable", "data" : "reasonable" },
		            { "title": "Unreasonable", "data" :"unreasonable"},
		            { "title": "Avg. Note", "data" : "time" }
		        ],
		        order: [[ 4, "desc" ]]
			});
		},
		setData : function(){
			this.datatable.fnClearTable();
	        this.datatable.fnAddData(this.data);
	        this.datatable.fnAdjustColumnSizing();
		},
		getDataTotal : function(select, callback){
			$.ajax({
				url : urlDataTotal.replace('%s',$(select).val()),
				success : function(data){
					console.log(data);
					callback(data);
				}
			});
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