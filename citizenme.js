$(document).ready(function(){

	/*
	AWS S3 Getter for get data
	*/

	var AwsToS = {
		URL : 'http://citizenme-tos-votes.s3.amazonaws.com',
		services : [],
		getServices : function(){
			$.ajax({
				url : this.URL,
				dataType : 'text',
				success : function(data){
					console.log(data);
				}
			});
		}
	}

	AwsToS.getServices();

	var urlDataTotal = 'https://rawgit.com/cferretti/data-test/master/%s-total.json';
	var urlDataPoint = 'https://rawgit.com/cferretti/data-test/master/%s-points-total.json';
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
						{'value' : this.services[i]._id, id:'dropdown_services'}
					).text(this.services[i].text);

				dropdown.append(option);
			}

			var _self = this;
			//add listener to dropdown
			dropdown.on('change', function _changeServiceListener(event){
				$('#btn_back').remove();
				_self.setRowsEvent(true);
				_self.setRowsEvent();
				_self.getDataTotal(this, function(data){ _self.createData(data); });
			});

			dropdown.trigger('change');
			this.elem.before(dropdown);
		},
		createBackBtn : function(){
			if($('#btn_back').length > 0){
				$('#btn_back').remove();
			}

			var btn_back = $('<button></button>');
			btn_back.attr({
				id : 'btn_back'
			}).text('Back');

			var _self = this;
			this.setRowsEvent(true);
			btn_back.on('click', function(e){
				e.preventDefault();
				$('#dropdown_services').trigger('change');
				_self.setRowsEvent();
				this.remove();
			});

			this.elem.after(btn_back);
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
				if(typeof(subparts[2]) !== 'undefined' && subparts[2] !== ''){
					revision = subparts[2];
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
						var date = new Date(data[i].start_time*1000);
						converted_data[index] = { 
							'service' : service,
							'rev' : revision,
							'unreasonable' : unreasonable_vote,
							'reasonable' : reasonable_vote,
							'time' : date.getUTCFullYear()+"/"+(date.getUTCMonth() + 1)+"/"+date.getUTCDate()
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
		createDataPoint : function(data, rev){
			var converted_data = [];
			this.data = [];
			var can_be_displayed = false;
			for(i in data){
				can_be_displayed = true;
				//Get part of the string
				var parts = data[i].name.split('/');
				var service = parts[offsetService+1];
				var type = parts[offsetVoteType+1];
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

				if(subparts[2] !== rev){
					can_be_displayed = false;
				}

				var index = service+revision;

				if(can_be_displayed){
					if(converted_data.indexOf(index) === -1){
						var date = new Date(data[i].start_time*1000);
						converted_data[index] = { 
							'service' : service,
							'rev' : revision,
							'unreasonable' : unreasonable_vote,
							'reasonable' : reasonable_vote,
							'time' : date.getUTCFullYear()+"/"+(date.getUTCMonth() + 1)+"/"+date.getUTCDate()
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

			if(this.data.length > 0){
				this.setData();
				this.createBackBtn();
			}else{
				alert('No details');
			}
		},
		initTable : function(){
			this.datatable = this.elem.dataTable({
				data: this.data,
				sDom : 'rtpli',
		        columns: [
		            { "title": "Service", "class":"service", "data" : "service" },
		            { "title": "Revision", "class": "rev", "data" : "rev" },
		            { "title": "Reasonable", "data" : "reasonable" },
		            { "title": "Unreasonable", "data" :"unreasonable"},
		            { "title": "Date", "data" : "time" }
		        ],
		        order: [[ 4, "desc" ]]
			});

			this.setRowsEvent();
			
		},
		setRowsEvent : function(disabled){
			var _self = this;
			//By default put as enabled
			if(typeof(disabled) === 'undefined'){
				disabled = false;
			}

			var tbody = this.elem.find('tbody');
			if(!disabled){
				tbody.on( 'click', 'tr', function () {
					var rev = $(this).find('.rev').text()
					var service = $(this).find('.service').text()
					_self.getDataPoint(rev, service, function(data){ _self.createDataPoint(data, rev); });
				});
			}else{
				//Disabled event
				tbody.off( 'click', 'tr');
			}
		},
		setData : function(){
			if(this.data.length > 0){
				this.datatable.fnClearTable();
		        this.datatable.fnAddData(this.data);
		        this.datatable.fnAdjustColumnSizing();
		    }
		},
		getDataTotal : function(select, callback){
			$.ajax({
				url : urlDataTotal.replace('%s',$(select).val()),
				success : function(data){
					console.log(data);
					callback(data);
				}
			});
		},
		getDataPoint : function(revision, service, callback){
			$.ajax({
				url : urlDataPoint.replace('%s',service),
				success : function(data){
					console.log(data);
					callback(data);
				}
			});
		}
	};


	jQuery.fn.citizenTable = function(options) {  
		var config = {}; 
		var defaults = $.extend(defaults, options);

		this.each(function() {
			tableGenerator.init(this);
		});

		return this;  
	}; 

	$('#test').citizenTable();
});