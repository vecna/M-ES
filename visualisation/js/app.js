// Appjs handles interaction functionality.  any heavy crunching is handled in functions.js
// this file exists to make it easy to change small things about the interaction without having
// to go into crunchy code
// also handles templating

// functions used in duntions.js include:
// 	initializeMap(api_url);
//  getSelectedCountry();
//  initializeMediaList(api_url, selectedcountry.lowerCasename, renderMedia, test_id (0 = ignore) );
//  updateMap(api_url, currently_selected_media, currently_selected_country.lowerCasename);
//niko.io was here


  // If help is true, shepherd.js is activated at each step
var help = false;
	media_first= true;
	media_click_item=true;
	map_first=true;
	country_first = true;
	company_first = true;

(function($){
	
	
	
	// Global variables and datastores:


  //var api_url="http://213.108.108.94:8000";
  //var api_url="http://127.0.0.1:8000";
	var api_url ="";

  
    // ya. I'm sure some day I'll commit in production the URL with localhost.

	var country_pane_data =   {
			country: 'Choose a Country',
			enabled:false,
		};

	var infobox_data =   {
			wanted: 0,
			unwanted:0,
			message:"click on a country to get started",
		};
		
	var single_company_pane_data =   {
			company:null,
		};

	var media_pane_data =   {
			country: 'no country selected yet',
			medialist:[],
			message:'please select a country',
			mediacount : 0,
		};
	var company_pane_data =   {
			media_list: [],
			companytemplate: _.template($('#company_template').html()),
		};
	var info_pane_data =   {
			country: 'Germany', 
			message:'Please select some media to see how this country tracks you!',
			companies: null,
			companytemplate: _.template($('#company_template').html()),
		};

		
	var currently_selected_media = [];
	var currently_selected_country = null;
	var temp_url_media = [];
	
	
	var window_url = {
			country:"",
			medialist:"",
			setHash: function(){
				this.medialist = currently_selected_media.join("a");
				this.country = currently_selected_country.threeLetterCode;

				var windowhash_array = window.location.hash.split("_");
				if (windowhash_array[0].length == 4) {
					ftid = 0;
					window.location.hash = this.country + "_" + this.medialist;
				} else {
					ftid = windowhash_array[0].substring(4, windowhash_array[0].length)
					window.location.hash = this.country + ftid + "_" + this.medialist;
				}


			},
		}


	$(window).load(function() {


		// behaviours and working objects:

		var infobox= {
			element:$('#infobox'),
			template:null,
			renderpane : function(){
				this.element.html(this.template(infobox_data));
				$("#startover").click(function(){
					window.location.hash ="";
					location.reload(); 
				});
				$('#seeitagain').click(function(){
					updateMap(api_url, currently_selected_media, currently_selected_country.threeLetterCode);
				});
				
			},
			init: function(){
				this.template = _.template(
						$('#infobox_template').html()
					);
				this.renderpane();
			},
			open: function(){
				this.element.addClass('open');
			},
			close: function(){
				this.element.removeClass('open');
			}
		}
		infobox.init();



		var countrypane= {
			element:$('#countrypane'),
			template:null,
			renderpane : function(){
				this.element.html(this.template(country_pane_data));
				var e = this.element
				this.element.find('.panetoggle').click(function(){
					e.toggleClass('open');

				});
				$("#reset").click(function(){
					window.location.hash ="";
					location.reload(); 
				});
			},
			init: function(){
				this.template = _.template(
						$('#country_pane_template').html()
					);
			},
			open: function(){
				this.element.addClass('open');
				mediapane.close();
			},
			close: function(){
				this.element.removeClass('open');
			}
		}
		countrypane.init();




		var mediapane= {
			element:$('#mediapane'),
			template:null,
			renderpane : function(){
				this.element.html(this.template(media_pane_data));
				var e = this.element;
				this.element.find('.panetoggle').click(function(){
					e.toggleClass('open');
				});
				$( ".mediablock h3" ).click(function() {
					$(this).parent().find(".medialist").toggle( "fast", function() {
					});
					if($(this).parent().hasClass("open")){$(this).parent().removeClass("open");}
					else{$(this).parent().addClass("open");}
				});
				
				$(".medialist").hide();

				$(".openfirst").trigger("click");


				$(".media").click(function(){
					if (help && media_click_item){
								tour.cancel();

								tour.addStep('media-step-2', {
								  text: 'When you are done, click here to close the panel.',
								  attachTo: '#mediapane .panetoggle right',
								  classes: 'shepherd-theme-arrows',

								  buttons: [
								    {
							          text: 'OK',
							          classes: 'shepherd-button-primary',
							          action: tour.cancel
						        	},/*{
								      text: 'Next',
								      action: tour.next
								    }*/
								  ]
								});

								setTimeout(function(){tour.next();},1000);
								media_first=false;
					}

				})


					if (help && media_first){
								tour.addStep('media-step-1', {
								  title:'Select Media',
								  text: '<p>In this panel you can view categories of media websites: global, national, local and blogs. </p><p>Select the media websites you are interested in.</p>',
								  attachTo: '#mediapane right',
								  classes: 'shepherd-theme-arrows',

								  buttons: [
								    {
							          text: 'OK',
							          classes: 'shepherd-button-primary',
							          action: tour.next
						        	},/*{
								      text: 'Next',
								      action: tour.next
								    }*/
								  ]
								});

								setTimeout(function(){tour.next();},1000);
								media_first=false;
					}
				
			},
			init: function(){
				this.template = _.template(
						$('#media_pane_template').html()
					);
			},
			open: function(){
				this.element.addClass('open');
				countrypane.close();
			},
			close: function(){
				if(help){
					tour.cancel();
				}
				this.element.removeClass('open');
			}
		}
		mediapane.init();
		
		
		var companypane= {
			element:$('#companypane'),
			template:null,
			renderpane : function(){
				DEBUG && console.log("rendering company pane!");
				DEBUG && console.log(company_pane_data);
				this.element.html(this.template(company_pane_data));
				var e = this.element;
				this.element.find('.panetoggle').click(function(){
					e.toggleClass('open');
				});
				$(".triggerCompany").click(function(){
					triggerCompany($(this).attr("data-company"));
				});
				$(".click_to_legend").click(function(){
					console.log("sup");
					console.log($(this).attr("data-target"));
					$('#companypane .paneinner').animate({
        				scrollTop: $($(this).attr("data-target")).offset().top
    				}, 2000);
				});

			},
			init: function(){
				this.template = _.template(
						$('#company_pane_template').html()
					);
			},
			open: function(){
				this.element.addClass('open');
				infopane.close();
				singlecompanypane.close();
			},
			close: function(){
				this.element.removeClass('open');
			}
		}
		companypane.init();
		
		
		var infopane= {
			element:$('#infopane'),
			template:null,
			renderpane : function(){
				DEBUG && console.log("rendering info pane!");
				DEBUG && console.log(info_pane_data);
				this.element.html(this.template(info_pane_data));
				var e = this.element;
				this.element.find('.panetoggle').click(function(){
					e.toggleClass('open');
				});
				$( ".clicktoggle" ).click(function() {
					$($(this).attr("data-target")).toggle( "fast", function() {
					});
				});
				$(".serverlist").hide();
				$(".triggerCompany").click(function(){
					triggerCompany($(this).attr("data-company"));
				});
			},
			init: function(){
				this.template = _.template(
						$('#info_pane_template').html()
					);
			},
			open: function(){
				this.element.addClass('open');
				companypane.close();
				singlecompanypane.close();
			},
			close: function(){
				this.element.removeClass('open');
			}
		}
		infopane.init();
		
		
		var singlecompanypane= {
			element:$('#singlecompanypane'),
			template:null,
			renderpane : function(){
				this.element.html(this.template(single_company_pane_data));
				var e = this.element
				this.element.find('.panetoggle').click(function(){
					e.toggleClass('open');

				});
				$("#reset").click(function(){
					location.reload(); 
				});
			},
			init: function(){
				this.template = _.template(
						$('#single_company_pane_template').html()
					);
			},
			open: function(){
				this.element.addClass('open');
				companypane.close();
				infopane.close();
			},
			close: function(){
				this.element.removeClass('open');
			}
		}
		singlecompanypane.init();
	



		$('.panetoggle').click(function(){
			$(this).parent().toggleClass('open');
		});
		
		$('#mediapane .pantoggle').click(function(){
			if($(this).parent().hasClass('open')){
				
				}
		});
		
		
		
		
		
		
		
		
		// application logic:

		// handles when the map is clicked on, to get the country and handle the logic.
		$('#container1').click(function(){
			
			if(currently_selected_country == null){
				var selectedcountry = getSelectedCountry();
				
				currently_selected_media = []
				
				selectCountry(selectedcountry);
				if(help){
					tour.cancel();
				}
				
				
			}else{
				var clickedcountry = getClickedCountry();
				info_pane_data.companies = clickedcountry.servers;
				info_pane_data.country = clickedcountry.displayName;
				if(!currently_selected_media.length==0){
					info_pane_data.message = "";
				}
				infopane.renderpane();
				infopane.open();
				if(help){
					tour.cancel();
				}
			}

		});
		
		
		
		function selectCountry(selectedcountry){
				currently_selected_country = selectedcountry;

				country_pane_data.country = selectedcountry.displayName;
				country_pane_data.enabled = selectedcountry.enabled;
				media_pane_data.country = selectedcountry.displayName;

				countrypane.renderpane();

				if(selectedcountry.enabled){
					// renderMedia is passed as a callack function.
					// this gets the media from the api, then sends that data to the callback 
					// function for render
					initializeMediaList(api_url, selectedcountry.threeLetterCode, renderMedia);

					// open the media pane, since the last function with callback 
					// rendered it
					mediapane.open();

					// update the informational panel with the data
					infobox_data.message = "<span class='selected'>" +
								selectedcountry.displayName + " Selected </span>" +
								"Please select the media that you read, or " +
								"<span class='actions'><span id='startover'>Select a new country</span></span>";
					infobox.renderpane();

				}else{
					// is triggered if we do not have data for the selected country
					countrypane.open();
					infobox_data.message = "Please select an available country";
					infobox.renderpane();
					currently_selected_country= null;
				}
		}
		
		
		
		
		


		

		// this function is called as a callback after the media list is updated for
		// a selected country.
		// medialist is an array of media objects ready to be rendered
		function renderMedia(medialist){
			
			//do rendering
			DEBUG && console.log(medialist);
			
			// send the medialist to the template:
			media_pane_data.medialist = medialist;
			// render the template:
			mediapane.renderpane();
			
			// after the media is rendered, the .js behaviours need to be attached again
			// so we put them all here:
			$('.media').click(function(){
				DEBUG && console.log("hey! clicked media!");
				// add a selected class the the .media div, and also add it to the currently
				// selected media
				if(!$(this).hasClass('selected')){
					$(this).addClass('selected');
					// get the ID of the data and push it to the array
					currently_selected_media.push($(this).attr('data-id'));
					// lets see that
					update_media_click();
				}else{
					$(this).removeClass('selected');
					currently_selected_media.splice(currently_selected_media.indexOf($(this).attr('data-id')),1);
					update_media_click();
				}
				function update_media_click(){
					$(".mediacount").html(currently_selected_media.length);
					updateMap(api_url, currently_selected_media, currently_selected_country.threeLetterCode);
					
					var media_object_list = getMediaListById(currently_selected_media);
					
					company_pane_data.media_list = media_object_list;
					companypane.renderpane();
					
					infobox_data.wanted = media_object_list.length;
					infobox_data.unwanted = _.reduce(media_object_list, function(memo, obj) { return obj.linked_hosts + memo; }, 0)
					
					infobox.renderpane();
					
					DEBUG && console.log(currently_selected_media);
				}
				
				$("#legend").show();
				window_url.setHash();
			});
			
			_.each(temp_url_media, function(mediaid){
					$("#media-"+mediaid)[0].click();DEBUG && console.log("#media-"+mediaid);
				});
			temp_url_media= [];
			
			// handles updating the map with selected media:
			// also needs to be added after template render
			function mediapaneclose(){
				updateMap(api_url, currently_selected_media, currently_selected_country.threeLetterCode);

				infobox_data.message = "<span class='selected'>" +
					currently_selected_country.displayName + " Selected </span>" +
					"Below is a visualisation of your internet traffic when you access media websites. " +
					"Click on a country to learn more " +
					"<span class='actions'><span id='seeitagain'>see it again</span><span id='startover'>select a new country</span></span>";
				infobox.renderpane();

				if(help && map_first){
							tour.addStep('map-step-1', {
								  title:'This is a map of your Internet traffic',
								  text: '<p>Based on the media websites you have selected, the map below shows your internet traffic.</p><p><span style="color:blue"> The blue</span> arcs show the path that your internet traffic takes to reach the servers of the media websites you have selected.  <span style="color:red"> The red</span> arcs are the internet connections to the servers of companies that are tracking you through your selected media websites, also known as "unintended connections"</p><p>These connections are included above numerically. Watch them increase as you select more media websites!</p>',
								  attachTo: '#infobox bottom',
								  classes: 'shepherd-theme-arrows',

								  buttons: [
								    {
							          text: 'Next',
							          classes: 'shepherd-button-primary',
							          action: tour.next
						        	},/*{
								      text: 'Next',
								      action: tour.next
								    }*/
								  ]
								});

								tour.addStep('map-step-1-5', {
								  title:'Legend',
								  text: 'The countries have colors and this legend explains what those mean.',
								  attachTo: '#legend top',
								  classes: 'shepherd-theme-arrows',

								  buttons: [
								    {
							          text: 'Next',
							          classes: 'shepherd-button-primary',
							          action: tour.next
						        	},/*{
								      text: 'Next',
								      action: tour.next
								    }*/
								  ]
								});

								tour.addStep('map-step-2', {
								  text: '<p>Click here to view more information about the companies tracking you.</p><p>The data they collect can include your IP address (your computers unique fingerprint), your browsing history, your search history and even the websites you are likely to visit in the future. All this data tells a story about you – which may or may not be true. Trackography gives you the opportunity to find out which companies are tracking you when you access your favorite media websites.</p><p>But this is not all: Trackography also tells you more about the tracking companies and their business model, which can include market research, user profling and advertisements.</p>',
								  attachTo: '#companypane .panetoggle left',
								  classes: 'shepherd-theme-arrows',

								  buttons: [
								    {
							          text: 'OK',
							          classes: 'shepherd-button-primary',
							          action: tour.next
						        	},/*{
								      text: 'Next',
								      action: tour.next
								    }*/
								  ]
								});

								tour.addStep('map-step-3', {
								  text: 'Click on a country to see which tracking companies have servers located there',
								  attachTo: '#container1 bottom',
								  classes: 'shepherd-theme-arrows',

								  buttons: [
								    {
							          text: 'OK',
							          classes: 'shepherd-button-primary',
							          action: tour.cancel
						        	},/*{
								      text: 'Next',
								      action: tour.next
								    }*/
								  ]
								});

								map_first=false;
								setTimeout(function(){tour.next();},200);
						}

						
			}
		
			
			$('#mediapane .panetoggle').click(function(){
					mediapaneclose();
			});
			
		}
		
		
		
		function triggerCompany(company){
			var this_company = _.find(allcompanies, function(comp){
				return company.toLowerCase() == comp.name.toLowerCase();
			});
			single_company_pane_data.company=this_company;
			singlecompanypane.renderpane();
			singlecompanypane.open();
			
		}
		
		
		
		
		
		
		
		//START THE FUN!!!!!  APP LOADS ALL WITH THIS FUNCTION WOOOOHOOOOOOOOOO
		$("#legend").hide();
		$("#redblueinfo").hide();
		initializeMap(api_url);

		
			try{
				/* if is spotted a window location bigger than three, is accepted and
				   the number after the country indication is kept. this hack is used to
				   render the contextual result, being able to specify exactly with
				   test_id need to be rendered.
				 */
				var windowhash_array = window.location.hash.split("_");
				if (windowhash_array[0].length == 4) {
					var forced_test_id = 0;
				} else {
					var forced_test_id = windowhash_array[0].substring(4, windowhash_array[0].length)
				}
				var hash_country = windowhash_array[0].substring(1, 4);
				var hash_list = windowhash_array[1].split("a");
				if(hash_country && hash_list){
					setTimeout(destroy,200);
					setTimeout(hashMe, 1000);
				}
			}catch(e){
				var tour;

					tour = new Shepherd.Tour({
					  defaults: {
					    classes: 'shepherd-theme-arrows',
					    scrollTo: true,
					    showCancelLink: true,
					  }
					});

					tour.addStep('welcome-step', {
					  title: 'Welcome to Trackography!',
					  text: '<p>Find out who is tracking you when you are reading your favourite news online.</p><p>Start now: Click on a blue country in the map. Then click on a media website you are interested in to view who tracks you, which country your data travels to and how your data is handled every time you access this media website.</p><p> Is this your first time here and would you like help through the process?</p>',
					  attachTo: '#infobox bottom',
					  classes: 'shepherd-theme-arrows',

					  buttons: [
					    {
				          text: 'Show me what to do',
				          classes: 'shepherd-button-primary',
				          events:{'click': function(){help=true;tour.next();}}
			        	},{
				          text: 'I can do this alone',
				          classes: 'shepherd-button-secondary',
				          action: tour.cancel
			        	},/*{
					      text: 'Next',
					      action: tour.next
					    }*/
					  ]
					});

					tour.addStep('second-step', {
					  text: 'The first step is to select a country. Choose one of the highlighted countries that you access the internet from.',
					  attachTo: '#infobox bottom',
					  classes: 'shepherd-theme-arrows',

					  buttons: [
					    {
				          text: 'OK',
				          classes: 'shepherd-button-primary',
				          action: tour.cancel
			        	},/*{
					      text: 'Next',
					      action: tour.next
					    }*/
					  ]
					});

					// tour.start();
			}
			
		function destroy(){
			$("#container1").empty();
			$("#container1").empty();
		}
		
		
		function hashMe(){
			temp_url_media = hash_list;
			selectCountry(_.find(allcountries, function(country){
				country.test_id = forced_test_id;
				return hash_country == country.threeLetterCode;
			}));
			mediapane.close();
		}


		
		
		

	});
}(jQuery));
