/*      niko.io was here                _                               _       
 _ __ ___  __ _ _   _(_)_ __ ___ _ __ ___   ___ _ __ | |_ ___ 
| '__/ _ \/ _` | | | | | '__/ _ \ '_ ` _ \ / _ \ '_ \| __/ __|
| | |  __/ (_| | |_| | | | |  __/ | | | | |  __/ | | | |_\__ \
|_|  \___|\__, |\__,_|_|_|  \___|_| |_| |_|\___|_| |_|\__|___/
             |_|                                              
*/

/*
 * jquery.js
	underscore-min.js

	d3.min.js
	* 
	topojson.v1.min.js
	datamaps.world.min.js
	* 
	worldbankcountries.json
	* 
	* */


/*
       _       _           _     
  __ _| | ___ | |__   __ _| |___ 
 / _` | |/ _ \| '_ \ / _` | / __|
| (_| | | (_) | |_) | (_| | \__ \
 \__, |_|\___/|_.__/ \__,_|_|___/
 |___/                           
	
*/		



	var DEBUG = false;

	
	worldbankcountrieslist = worldbankcountrieslist;

	var selected_country = null;
	var clicked_country = null;
	
	var allcountries = [];
	var allmedia = [];
	var allcompanies=[];

	function getSelectedCountry(){
		console.log('x');
		console.log(selected_country);
		return selected_country;
	}
	
	function getClickedCountry(){
		console.log('y');
		console.log(clicked_country);
		return clicked_country;
	}
	
	var clock = [];

/*
	 _       _              _                   _                       
  __| | __ _| |_ __ _   ___| |_ _ __ _   _  ___| |_ _   _ _ __ ___  ___ 
 / _` |/ _` | __/ _` | / __| __| '__| | | |/ __| __| | | | '__/ _ \/ __|
| (_| | (_| | || (_| | \__ \ |_| |  | |_| | (__| |_| |_| | | |  __/\__ \
 \__,_|\__,_|\__\__,_| |___/\__|_|   \__,_|\___|\__|\__,_|_|  \___||___/
                                                                        
*/
	function Country(country, supportedcountrylist) {

		this.displayName = country.name;
		this.lowerCasename = this.displayName.toLowerCase();
	    this.twoLetterCode = country.iso2Code;
	   	this.threeLetterCode = country.id;
	   	this.latitude = country.latitude;
	   	this.longitude = country.longitude;

		var enabled = false;
		$.each(supportedcountrylist, function(i, possibl){
			if(country.id == possibl) {
				enabled = true;
			}
		});
		this.enabled = enabled
	}


	function Media(media){
		/*
		 Codename:
		 	Revelations: "NSA intelligence on the UN Security Council
		 	"Sources: "https://freesnowden.is/revelations#nsa-intelligence-on-the-UN-security-council
		 	"Target: "UN Security Council members (representatives of countries)"
		 	Type: "Signals intelligence (SIGINT)"
		 	Why: "To ensure that the Security Council voted for increased sanctions against Iran"
		 	ia: "NSA"
		 */
		this.category = media.category;
		this.id = media.id;
		this.revelations = media.Revelations;
		this.sources = media.Sources;
		this.target = media.Target;
		this.type = media.Type;
		this.why= media.Why;
		this.ia = media.ia;
	}
	
	
	function Server(server){
		this.host = server.host;
		this.intended = server.is_intended_media;
		this.media_id = server.media_id;
        this.is_same_domain = server.is_same_domain;
		
		this.media = _.find(allmedia, function(media){
			//DEBUG && console.log((server.target_country).toLowerCase() + " == " + country.lowerCasename);
			return server.media_id == media.id;
		});

		// instead of just a sting, we want a pointer to the country object
		// allcountries is a global
		this.endpointCountry = _.find(allcountries, function(country){
			//DEBUG && console.log((server.target_country).toLowerCase() + " == " + country.lowerCasename);
			return server.target_country == country.threeLetterCode;
		});

		console.log("HERE HAS TO BE PATCHED!");
		this.company = server.company;
		this.id = server.id;
		this.for_media = server.media_url;
		this.original_country_chain = server.country_chain;
		
		var country_chain = [];
		
		// this next bit reduces the country chain to distinct values, removes duplicates
		// and also finds the country object to add a pointer to instead of a string
		var lastcountry = null;
		_.each(this.original_country_chain, function(country_string){
			if(lastcountry && country_string == lastcountry){
				//do nothing
			}else{
				// this will find the country object from the string
				var tempcountry = _.find(allcountries, function(country){
						return country_string == country.threeLetterCode;
					});
				// make sure it exists
				if (tempcountry){
					// add it to the chain
					country_chain.push(tempcountry);
				} // endif
			}
			lastcountry = country_string;
		});
		
		//store it as a property, brah!
		this.country_chain= country_chain;
		
		DEBUG && console.log(this);

	}
/*
     _       _                                             
  __| | __ _| |_ __ _   _ __   __ _ _ __ ___  ___ _ __ ___ 
 / _` |/ _` | __/ _` | | '_ \ / _` | '__/ __|/ _ \ '__/ __|
| (_| | (_| | || (_| | | |_) | (_| | |  \__ \  __/ |  \__ \
 \__,_|\__,_|\__\__,_| | .__/ \__,_|_|  |___/\___|_|  |___/
                       |_|                                 
*/
	// paint the map, get the data ready for datamaps
	// we make the data and the arcs here, then pass them to renderMap
	function updateMapData(servers){
		var countries_dataformatted = {};
		var arcs = {
				intended:[],
				unintended:[],
			};		
		
		_.each(servers, function(server){
			//DEBUG && console.log(server);
			
			var i = 0;
			var u = 0;
			var lastcountry = null;
			_.each(server.country_chain, function(country){
				
				
				
				//If the country in the country chain does not exist in the map data yet, create it
				if(!countries_dataformatted[country.threeLetterCode]){
					countries_dataformatted[country.threeLetterCode] = {};
				}
				
				//add it as a transit country if it does not already have a designation
				if(!(countries_dataformatted[country.threeLetterCode].fillKey == "destination" || countries_dataformatted[country.threeLetterCode].fillKey == "baddestination")){
					countries_dataformatted[country.threeLetterCode].fillKey = "transit";
				}
				
				// add some bits of wisdom to the map data : namely which servers are in each country.  kind of reversing the way the data is portrayed
				// first make an empty object if there is none:
				if(!countries_dataformatted[country.threeLetterCode].servers){
					countries_dataformatted[country.threeLetterCode].servers = [];
				}
				// then populate that with the country



				console.log("xxx has to be patched too");
                if(server.intended || (server.endpointCountry
                    && server.endpointCountry.threeLetterCode == country.threeLetterCode) ){

				}else{
					countries_dataformatted[country.threeLetterCode].servers.push({host:server.host, media:server.media.url, company:server.company, type:"transit"});
				}
				
				
				
				//populate the arcs array
				if(lastcountry && country){
					if (arcs.intended[i]){}else{arcs.intended[i]=[];}
					if (arcs.unintended[u]){}else{arcs.unintended[u]=[];}
					var temparc = {};
					temparc.origin = {};
					temparc.destination = {};
					temparc.origin.latitude = lastcountry.latitude;
					temparc.origin.longitude = lastcountry.longitude;
					temparc.destination.latitude = country.latitude;
					temparc.destination.longitude = country.longitude;
					
					if (server.intended){
						temparc.options = {};
						temparc.options.strokeWidth = 2;
						temparc.options.strokeColor = "rgba(20, 103, 255, .3)";
						arcs.intended[i].push(temparc);
						i++;
					}else{
						temparc.options = {};
						temparc.options.strokeWidth = 1;
						temparc.options.strokeColor = "rgba(255, 0, 1, .3)";
						arcs.unintended[u].push(temparc);
						u++;
					}
					
				}
				lastcountry=country;
			});
			
			// and one more time for the last hop.  
			if(server.endpointCountry){
				var country = server.endpointCountry
				if (lastcountry && country != lastcountry){
				
					//this is a direct copy of the above code, copy it!
					if (arcs.intended[i]){}else{arcs.intended[i]=[];}
					if (arcs.unintended[u]){}else{arcs.unintended[u]=[];}
					var temparc = {};
					temparc.origin = {};
					temparc.destination = {};
					temparc.origin.latitude = lastcountry.latitude;
					temparc.origin.longitude = lastcountry.longitude;
					temparc.destination.latitude = country.latitude;
					temparc.destination.longitude = country.longitude;
					
					if (server.intended){
						temparc.options = {};
						temparc.options.strokeWidth = 2;
						temparc.options.strokeColor = "rgba(20, 103, 255, .3)";
						arcs.intended[i].push(temparc);
						i++;
					}else{
						temparc.options = {};
						temparc.options.strokeWidth = 1;
						temparc.options.strokeColor = "rgba(255, 0, 1, .3)";
						arcs.unintended[u].push(temparc);
						u++;
					}
				}
				
				if(!countries_dataformatted[server.endpointCountry.threeLetterCode]){
					countries_dataformatted[server.endpointCountry.threeLetterCode] = {};
				}
				if(!countries_dataformatted[server.endpointCountry.threeLetterCode].servers){
					countries_dataformatted[server.endpointCountry.threeLetterCode].servers = [];
				}
				if(server.intended){
					countries_dataformatted[server.endpointCountry.threeLetterCode].servers.push({host:server.host, media:server.media.url, company:server.company, type:"media"});
				}else{
					countries_dataformatted[server.endpointCountry.threeLetterCode].servers.push({host:server.host, media:server.media.url, company:server.company, type:"datastored"});
				}
				
			}
			
			
			if(server.endpointCountry){
				if(!countries_dataformatted[server.endpointCountry.threeLetterCode]){
					countries_dataformatted[server.endpointCountry.threeLetterCode] = {};
				}
				if (server.intended){
					countries_dataformatted[server.endpointCountry.threeLetterCode].fillKey = "destination";
				}else{
					if(countries_dataformatted[server.endpointCountry.threeLetterCode].fillKey != "destination"){
						countries_dataformatted[server.endpointCountry.threeLetterCode].fillKey = "baddestination";
					}
				}
			}
			
		if(!countries_dataformatted[selected_country.threeLetterCode]){
			countries_dataformatted[selected_country.threeLetterCode] = {};
		}
		countries_dataformatted[selected_country.threeLetterCode].fillKey = "home";

		});
		
		

		DEBUG && console.log(countries_dataformatted);
		renderMap(countries_dataformatted, arcs);
		
	}
	
	
		// allcountries as global needed to be initialized before this
	function initialMapData(){
		//DEBUG && console.log(allcountries);
		//var enabled_countries = _.filter(allcountries, function(country){
			//return country.enabled;
		//});
		var enabled_countries_dataformatted = {};

		_.each(allcountries, function(country){
			enabled_countries_dataformatted[country.threeLetterCode] = {};
			if (country.enabled){
				enabled_countries_dataformatted[country.threeLetterCode].fillKey = "destination";
			}
			enabled_countries_dataformatted[country.threeLetterCode]['country'] = country;
		});


		return enabled_countries_dataformatted;
	}
	



/*
 _                     _ _               
| |__   __ _ _ __   __| | | ___ _ __ ___ 
| '_ \ / _` | '_ \ / _` | |/ _ \ '__/ __|
| | | | (_| | | | | (_| | |  __/ |  \__ \
|_| |_|\__,_|_| |_|\__,_|_|\___|_|  |___/
 */                                      
		


	function getMediaListById(mediaid_list){
		DEBUG && console.log("getMedialistById()");
		DEBUG && console.log(mediaid_list);
		return _.filter(allmedia, function(media){ 
			return (mediaid_list.indexOf(media.id+"") > -1); });
	}
	
	
	function initializeMediaList(api_url, country, callbackfunction){
		DEBUG && console.log("getting " + api_url+'/country/'+country +'/');
		
		if(selected_country == null){
			selected_country = _.find(allcountries, function(c){
				return c.threeLetterCode == country;
			});
		}

        var api_get_request = api_url+'/country/'+country +'/';

		jQuery.getJSON(api_get_request, function(data){
			DEBUG && console.log("done");
			var media_list = [];
			_.each(data, function(media){
				var tempmedia = new Media(media);
				//DEBUG && console.log(tempmedia);
				media_list.push(tempmedia);
			});
			allmedia = [];
			allmedia = media_list;
			DEBUG && console.log("added media: " + allmedia.length);
			callbackfunction(media_list);

		});

	}


	function handleCountryClick(country_id, mapdata){
		/*
			sets the initial home country.  gets country data otherwise.

		*/
		// Only do this if there is no otherwise selected country
		if(!(selected_country != null && selected_country.enabled)){
			selected_country = mapdata[country_id]['country'];
		}
		clicked_country = _.find(allcountries, function(country){
			return country_id == country.threeLetterCode;
		});
		//copy the object as to not do any damage to the original
		clicked_country = jQuery.extend({},clicked_country);
		// add servers
		if(mapdata[country_id].servers){
			clicked_country.servers = mapdata[country_id].servers;
		}
		DEBUG && console.log("selected country :");
		DEBUG && console.log(selected_country);
		DEBUG && console.log("clicked country :");
		DEBUG && console.log(clicked_country);
	}


	function renderMap(mapdata, arcs){
		arcs = arcs || null;
		
		jQuery('#container1').empty();
		var map = new Datamap({
				   element: document.getElementById("container1"),
				   scope: 'world',
				   projection: 'mercator',
				   geographyConfig: {
					 highlightOnHover: false,
				     popupTemplate: function(geography, data) {

				     		var htmlstring ='<div class="hoverinfo">' + geography.properties.name + '</div>';

				     		return  htmlstring;

				     },
				   },/*
					setProjection: function(element) {
						var projection = d3.geo.mercator()
						  .center([0, 50])
						  .scale(200)
						  ;
						var path = d3.geo.path()
						  .projection(projection);
						
						return {path: path, projection: projection};
					}, */
				   fills: {
				     destination: 'rgba(0, 0, 255, .5)',
				     baddestination: 'rgba(255, 0, 0, .5)',
				     defaultFill: 'lavender',
				     transit: 'rgba(80, 9, 80, .5)',
				     home:'rgba(0,120,0,.5)',
				   },
				   done: function(datamap) {
			            datamap.svg.selectAll('.datamaps-subunit').on('click', function(geography) {
			                DEBUG && console.log(geography.id);
			                handleCountryClick(geography.id, mapdata);
			            });
			        },
				   data: mapdata,
		});
		
		
		//ARCS!!!!!!!!!!!!!!!!!!!!!!!!!!!!
		_.each(clock, function(myclock){
			DEBUG && console.log("clearing clock");
			clearTimeout(myclock);
		});
		clock=[];
		if(arcs){
			DEBUG && console.log(arcs);
			DEBUG && console.log(arcs.length);
		
			var temparc_drawset = [];
			var i = 000;
			_.each(arcs.intended, function(arcset){
				temparc_drawset = temparc_drawset.concat(arcset);
				drawarc(temparc_drawset.slice(0),i,.1);
				i+=1000;
			});
			_.each(arcs.unintended, function(arcset){
				temparc_drawset = temparc_drawset.concat(arcset);
				drawarc(temparc_drawset.slice(0),i,.5);
				i+=1000;
			});
		}
		function drawarc(arcarray, delay, sharpness){
			var temporaryclock = setTimeout(function() {
					map.arc(arcarray,  {arcSharpness:sharpness});
					DEBUG && console.log("next arc step");
			}, delay);
			clock.push(temporaryclock);
		}
	};
	



	//
	// Functions - this is where all the rusable code is put.  the app happens beneath
	//
	//

	//this is the first function run by the application, gets the countries available for the users first choice
	//It sees which countries have data, then fills the select box with them
	function initializeMap(api_url){
		// reset the globals!
		selected_country = null;
		allcountries = [];
		allmedia = [];
		jQuery.getJSON(api_url +"/countries", function(data){

			_.each(worldbankcountrieslist, function(country) {
				var tempcountry = new Country(country, data);
				if(tempcountry.latitude){
					allcountries.push(tempcountry);
				}else{
					//check to make sure it is actually a country in the world bank data and not a region
					DEBUG && console.log('skipped '+tempcountry.displayName)
				}
			});

			renderMap(initialMapData());
		});
		
		jQuery.getJSON(api_url +"/company/", function(data){
			DEBUG && console.log("gotcompanies!");
			allcompanies = data;
			DEBUG && console.log(allcompanies);
			
		});
	};

	//update the media list given a certain country
	// once the country is chosen, this should update
	//get the json for that country and then parse it into something useable for us
	var updatemedia = function(country){
		jQuery.getJSON(apiurl+'/country/'+country, function(data){
			//reset the globals
			medialist = [];
			nationalmedia = [];
			localmedia = [];
			blogmedia = [];
			//cycle through the json and parse it into something useful for the select2 plugin
			console.log(data);
			jQuery.each( data, function( key, val ) {
				//DEBUG && console.log(key);
				//DEBUG && console.log(val);
				console.log(key);
				console.log(val);
				var currentmedia = {
					/* media! not countries!! */
						type:val.type,
						category:val.category,
						revelations:val.revelations,
						sources:val.sources,
						target:val.target,
						why:val.why,
						ia:val.ia
					};
				console.log(currentmedia);
				switch (currentmedia.type){
					case "national":
						nationalmedia.push(currentmedia);
						break;
					case "local":
						localmedia.push(currentmedia);
						break;
					case "blog":
						blogmedia.push(currentmedia);
						break;
					default :
						console.log("Something goes wrong ");
						console.log(currentmedia);
						break
				}
				//DEBUG && console.log(currentmedia);
				medialist = [
					{text:'National Media', children:nationalmedia},
					{text:'Local Media', children:localmedia},
					{text:'Blogs', children:blogmedia}
				]
			});

			jQuery('#nationalmedias').select2({
				allowClear:true,
				multiple:true,
				data:nationalmedia,
				placeholder: "National Media",
			});
			jQuery('#localmedias').select2({
				allowClear:true,
				multiple:true,
				data:localmedia,
				placeholder: "Local Media",
			});
			jQuery('#blogmedias').select2({
				allowClear:true,
				multiple:true,
				data:blogmedia,
				placeholder: "Blogs",
			});

		});
	}
	
	
	//updates the map based on the media selections
	function updateMap(api_url, selected_media, countryname){
		var servers = [];
		var medialist = selected_media.join(',');

		var windowhash_array = window.location.hash.split("_");
		if ( windowhash_array == "" || windowhash_array[0].length == 4) {
			var api_get_request = api_url+'/data/'+countryname+'/id/'+medialist;
		} else {
			var ftid = windowhash_array[0].substring(4, windowhash_array[0].length)
			var api_get_request = api_url+'/contextual/'+ftid+'/id/'+medialist;
		}

		DEBUG && console.log("updating map...");
		DEBUG && console.log(api_get_request);

		// lets snag that json.  here is the url
		jQuery.getJSON(api_get_request, function(data){
			//success
			DEBUG && console.log("json success");
			// now lets go through each server and make a new object
			_.each(data, function(server){
				var srvr = new Server(server);
                servers.push(srvr);
			});
			
			DEBUG && console.log("servers added: " + servers.length);
			
			//this function goes back to renderMap()
			updateMapData(servers);
			
			
		});
	}
