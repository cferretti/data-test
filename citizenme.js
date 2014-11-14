(function($) {
	$(document).ready(function(){

		function nodeToObject(node) {
		    var obj = {}, i;
		    obj.nodeType = node.nodeType;
		    obj.nodeName = node.nodeName;
		    obj.nodeValue = node.nodeValue;
		    obj.childNodes = [];
		    obj.attributes = {};
		    if (node.childNodes && node.childNodes.length)
		        for (i = 0; i < node.childNodes.length; ++i)
		            obj.childNodes.push(nodeToObject(node.childNodes[i]));
		    if (node.attributes && node.attributes.length)
		        for (i = 0; i < node.attributes.length; ++i)
		            obj.attributes[node.attributes[i].nodeName] = node.attributes[i].nodeValue;
		    return obj;
		}

		/*
		AWS S3 Getter for get data
		*/

		var AwsToS = {
			URL : 'http://citizenme-tos-votes.s3.amazonaws.com',
			services : [],
			getServices : function(callback){
				$.ajax({
					url : "https://rawgit.com/cferretti/data-test/master/services.json",
					type : "GET",
					dataType : "json",
					success: function(data){
						this.services = data;
						callback(data);
					}
				})
			},
			getServiceTotal : function(service, callback){
				$.ajax({
					url : this.URL+"/votes/"+service+"-total.json",
					dataType : 'json',
					type : 'GET',
					success : function(data){
						callback(data);
					}
				});
			},
			getServicePoints : function(service, callback){
				$.ajax({
					url : this.URL+"/votes/"+service+"-points-total.json",
					dataType : 'json',
					type : 'GET',
					success : function(data){
						callback(data);
					}
				});
			},
			getServiceDetails : function(service,callback){
				$.ajax({
					url : this.URL+"/git-history/"+service+".json",
					dataType : 'json',
					type : 'GET',
					success : function(data){
						callback(data);
					}
				});
			}
		};
		
		var offsetService = 4;
		var offsetVoteType = 3;
		var down_vote = 'unreasonablechange'; 
		var up_vote = 'reasonablechange';
		var display_null = true;

		var tableGenerator = {
			elem : null,
			data : [],
			datatable : null,
			init : function(elem){
				this.elem = $(elem);
				var _self = this;
				this.initTable();
				AwsToS.getServices(function(data){
					_self.createDropdown(data);
				});
			},
			createDropdown : function(services){
				var dropdown = $('<select></select>');
				for(i in services){
					var option = $('<option></option>').attr(
							{'value' : services[i].id, id:'dropdown_services'}
						).text(services[i].name);

					dropdown.append(option);
				}

				var _self = this;
				//add listener to dropdown
				dropdown.on('change', function _changeServiceListener(event){
					$('#btn_back').remove();
					// _self.setRowsEvent(true);
					// _self.setRowsEvent();
					var service = $(this).val();
					AwsToS.getServiceTotal(service, function(data){ 
						AwsToS.getServiceDetails(service, function(details){ 
							_self.createData(data, details); 
						} );
					} );
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
				// this.setRowsEvent(true);
				btn_back.on('click', function(e){
					e.preventDefault();
					$('#dropdown_services').trigger('change');
					_self.setRowsEvent();
					this.remove();
				});

				this.elem.after(btn_back);
			},
			createData : function(data, details){
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

					var message = 'No message found';
					var date_change = 'No date found';
					if(revision !== ''){
						var j = 0;
						var founded = false;
						do{
							console.log(details[j].sha.substr(0,revision.length));
							if(details[j].sha.substr(0,revision.length) === revision){
								message = details[j].commit.message;
								date_change = details[j].commit.author.date.substr(0,10);
								founded = true;
							}
							j++;
						}while(j < details.length && !founded);
					}

					if(can_be_displayed){
						if(typeof(converted_data[index]) === 'undefined'){
							var end_date = new Date(data[i].end_time*1000);
							var start_date = new Date(data[i].start_time*1000);
							converted_data[index] = { 
								'service' : service,
								'rev' : revision,
								'unreasonable' : unreasonable_vote,
								'reasonable' : reasonable_vote,
								'end_time' : end_date.getUTCFullYear()+"/"+(end_date.getUTCMonth() + 1)+"/"+end_date.getUTCDate(),
								"start_time" :  start_date.getUTCFullYear()+"/"+(start_date.getUTCMonth() + 1)+"/"+start_date.getUTCDate(),
								'message' : message,
								'date_change' : date_change
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
					console.log(type, data[i]);
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
			            { "title": "Start Date", "data" : "start_time" },
			            { "title": "End Date", "data" : "end_time" },
			            { "title": "Reasonable","align":"right", "data" : "reasonable" },
			            { "title": "Unreasonable","align":"right", "data" :"unreasonable"},
			            { "title": "Comment", "data" :"message"},
			            { "title": "Date change", "data" :"date_change"},
			        ],
			        order: [[ 3, "desc" ]]
				});

				// this.setRowsEvent();
				
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
						AwsToS.getServicePoints(service, function(data){ _self.createDataPoint(data, rev); });
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
			}
		};


		$.fn.citizenTable = function(options) {  
			var config = {}; 
			var defaults = $.extend(defaults, options);

			this.each(function() {
				tableGenerator.init(this);
			});

			return this;  
		}; 

		$('#test').citizenTable();
	});
})(jQuery);