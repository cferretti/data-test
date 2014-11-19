(function($) {
	$(document).ready(function(){

		String.prototype.capitalize = function() {
		    return this.charAt(0).toUpperCase() + this.slice(1);
		}

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
			terms_of_services : [],
			getServices : function(callback){
				$.ajax({
					url : this.URL+"/tos-services.json",
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
						callback(data, service);
					}
				});
			},
			getServicesPoints : function(callback){
				var datapoints = [];
				this.getServices(function(services){
					var nb_serv = services.length;
					for(i = 0; i < nb_serv; i++){
						//If last services call the callback
						if(i+1 >= nb_serv){
							AwsToS.getServicePoints(services[i], function(data,service){
								if(data !== null){
									console.log(service);
									datapoints[service] = data;
								}
								callback(datapoints);
							});
						}else{
							AwsToS.getServicePoints(services[i], function(data,service){
								if(data !== null){
									datapoints[service] = data;
								}
							});
						} 
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
			},
			getServiceTos : function(service, callback){
				var _self = this;
				$.ajax({
					url : this.URL+"/ToS/"+service+".json",
					dataType : 'json',
					type : 'GET',
					success : function(data){
						_self.terms_of_services[service] = data.points;
						callback();
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
							{'value' : services[i], id:'dropdown_services'}
						).text(services[i].capitalize());

					dropdown.append(option);
				}

				var _self = this;
				//add listener to dropdown
				dropdown.on('change', function _changeServiceListener(event){
					$('#btn_back').remove();
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
			        'iDisplayLength': 20,
			        order: [[ 3, "desc" ]]
				});
				
			},
			setData : function(){
				if(this.data.length > 0){
					this.datatable.fnClearTable();
			        this.datatable.fnAddData(this.data);
			        this.datatable.fnAdjustColumnSizing();
			    }
			}
		};





		var tableGeneratorPoint = {
			red: "#af0500",
			amber: "#af6800",
			green: "#0e7f00",
			elem : null,
			data : [],
			datatable : null,
			init : function(elem){
				this.elem = $(elem);
				var _self = this;
				this.initTable();
				AwsToS.getServices(function(services){
					var nb_services = services.length;
					for(i = 0; i < nb_services; i++){
						if(i + 1 >= nb_services){
							AwsToS.getServiceTos(services[i], function(){
								AwsToS.getServicesPoints(function(data){
									console.log(AwsToS.terms_of_services);
									_self.createDataPoint(data);
								});
							})
						}else{
							AwsToS.getServiceTos(services[i], function(){});	
						}	
					}	
				})
				
			},
			createDataPoint : function(data){
				var points_data = [];
				this.data = [];

				for(i in data){
					var service = i;
					var points = data[i];
					for(j in points){
						//{"name":"event/tos/takeaction/point/reasonablechange/facebook-E58aPtzP3jk-(null)-(null)","count":"1","start_time":"","end_time":""}
						var parts = points[j].name.split('/');
						var type = parts[offsetVoteType + 1];

						var details = parts[offsetService+1];
						//Check if revision exit
						var subparts = details.split('-');
						var term_id = '';

						if(typeof(subparts[1]) !== 'undefined' && subparts[1] !== ''){
							term_id = subparts[1];
							var nb_sub = subparts.length;
							for(k = 2; k < nb_sub - 2; k++){
								term_id += '-'+subparts[k];
							}
						}else if(!display_null){
							can_be_displayed = false;
						}

						var unreasonable_vote = 0;
						var reasonable_vote = 0;
						var index = service+term_id;

						if(type == down_vote){
							unreasonable_vote = parseInt(points[j].count);
						}else if(type == up_vote){
							reasonable_vote = parseInt(points[j].count);
						}

						var term = 'Not found';
						var point = "";
						var score = 0;
						for(k in AwsToS.terms_of_services[service]){
							if(AwsToS.terms_of_services[service][k].id === term_id){
								term = AwsToS.terms_of_services[service][k].title;
								point = AwsToS.terms_of_services[service][k].tosdr.point;
								score = AwsToS.terms_of_services[service][k].tosdr.score;
							}
						};
						
						if(typeof(points_data[index]) === 'undefined'){
							points_data[index] = {
								"point" : point,
								"score" : score,
								'rank' : 0,
								'service' : service,
								'term' : term,
								'term_id' : term_id,
								'unreasonable' : unreasonable_vote,
								'reasonable' : reasonable_vote
							};
						}else{
							points_data[index].unreasonable +=  unreasonable_vote;
							points_data[index].reasonable += reasonable_vote;
						}
					}
				}


				for(i in points_data){	
					this.data.push(points_data[i]);
				}

				this.data.sort(function(a,b) {
					return parseInt(b.unreasonable) - parseInt(a.unreasonable); 
				} );

				var rank = 1;
				for(i in this.data){	
					this.data[i].rank = rank;
					rank++;
				}

				this.setData();
			},
			initTable : function(){
				this.datatable = this.elem.dataTable({
					data: this.data,
					sDom : 'rtpli',
			        columns: [
			        	{ "title": "", "data" : "point" , "visible": false,"searchable": false},
			        	{ "title": "", "data" : "score" , "visible": false, "searchable": false},
			            { "title": "Rank", "class":"service", "data" : "rank" },
			            { "title": "Service", "class": "rev", "data" : "service" },
			            { "title": "Term", "data" : "term" },
			            { "title": "Id Term", "data" : "term_id" },
			            { "title": "Votes 'unreasonable'", "data" : "unreasonable" },
			            { "title": "Votes 'resonable'","data" : "reasonable" }
			        ],
			        'iDisplayLength': 20,
			        "fnRowCallback": function( nRow, aData, iDisplayIndex, iDisplayIndexFull ) {
			        	

			            if ( aData.point.toLowerCase() === "good" && aData.score > 20 )
			            {
			                $('td:eq(2)', nRow).css({ "background" : tableGeneratorPoint.green } );
			            }

			            if ( aData.point.toLowerCase() === "bad" && aData.score > 20 )
			            {
			                $('td:eq(2)', nRow).css({ "background" : tableGeneratorPoint.red } );
			            }

			            if ( aData.point.toLowerCase() === "blocker")
			            {
			                $('td:eq(2)', nRow).css({ "background" : tableGeneratorPoint.amber } );
			            }
			        },
			        order: [[ 2, "asc" ]]
				});
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


		$.fn.citizenTablePoint = function(options) {  
			var config = {}; 
			var defaults = $.extend(defaults, options);

			this.each(function() {
				tableGeneratorPoint.init(this);
			});

			return this;  
		}; 

		if($('#test').length > 0){
			$('#test').citizenTable();
		}else if($('#table-point-votes').length > 0){
			$('#table-point-votes').citizenTablePoint();
		}
	});
})(jQuery);