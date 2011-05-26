jQuery.fn.fbMention = function(autocomplete_data, options) {
	var options = jQuery.extend({
		trigger: '@'
	}, options);
	
	// Generate textarea, containers, lists and hidden input
	formGenerate = "<div class='textarea-container'><span class='highlighter'></span><textarea class='textarea' cols='40' rows='10'></textarea></div><ul class='autocomplete' style='display: none;'><li><a href='#'>Konstantin Kovshenin</a></li></ul><input type='text' style='width: 1000px;' class='hidden' />";
	$(this).html(formGenerate);
	
	// Global variables
	var isAutocomplete = false;
	var isAutocompleteLoaded = false;
	var isAutocompleteLoading = false;
	var autocomplete_data = null;
	var mentions = [];
	
	// Check or load array
	if (!autocomplete_data) {
		$('.textarea').focus(function() {
			
			if (!isAutocompleteLoaded && !isAutocompleteLoading) {
				isAutocompleteLoading = true;
				
				$.post('test.php', {}, function(response) {
					autocomplete_data = response;
					isAutocompleteLoaded = true;
				}, 'json');
				
			}
		});
	}
	else {
		isAutocompleteLoading = true;
		isAutocompleteLoaded = true;
	}
	
	// Register all keydown events on textarea
	$('.textarea').keydown(function(e){
		
		if (isAutocomplete) { // If in autocomplete mode
			
			if (e.keyCode == '13') { // Enter key press
				var selected = $('.autocomplete a.mention-selected');
				var user_id = $(selected).attr('data-id');
				var name = $(selected).attr('data-name');
				
				for (i = 0; i < autocomplete_data.length; i++)
					if (autocomplete_data[i].id == user_id)
						mentions.push($.extend(true, {}, autocomplete_data[i]));
				
				var original = $('.textarea').val();
				var current_position = $('.textarea')[0].selectionStart;
				var at_position = $('.textarea').val().indexOf(options.trigger);
				
				var s = original.substring(0, at_position) + name + original.substring(current_position, original.length) + ' ';
				$('.textarea').val(s);
				$('.textarea')[0].selectionStart = at_position + name.length + 1;
				$('.textarea')[0].selectionEnd = $('.textarea')[0].selectionStart;
				
				$('.autocomplete').hide();
				isAutocomplete = false;
				
				e.preventDefault();
				return
			
			} else if (e.keyCode == '38') { // Up key press
				
				var selected = $('.autocomplete a.mention-selected');
				var previous = $(selected).parent('li').prev('li').find('a');
				
				if (previous.length) {
					$(selected).removeClass('mention-selected');
					$(previous).addClass('mention-selected');
				}
				
				e.preventDefault();
				return
				
			} else if (e.keyCode == '40') { // Down key press

				var selected = $('.autocomplete a.mention-selected');
				var next = $(selected).parent('li').next('li').find('a');
				
				if (next.length) {
					$(selected).removeClass('mention-selected');
					$(next).addClass('mention-selected');
				}

				e.preventDefault();
				return

			}
		}
	});
	
	$(document).keyup(function(e){
		// Cancel autocomplete mode on ESC key press
		if (e.keyCode == 27) {
			isAutocomplete = false;
			$('.autocomplete').hide();
			return;
		}
	});
	
	$('.textarea').keyup(function(e){
		
		if (isAutocomplete && (e.keyCode == 38 || e.keyCode == 40)) return;
		
		var original = $(".textarea").val();
		var highlight_string = original;
		var hidden_string = original;
		var remove_mentions = [];
		
		// Create hidden value and highlight data
		for (i = 0; i < mentions.length; i++) {
			mention = mentions[i];
			if (mention == undefined) continue;
			if (original.indexOf(mention.name) >= 0) {
				
				var hl_expr = new RegExp(mention.name + '(?!\<\/b\>)');
				var hd_expr = new RegExp(mention.name + '(?!\])');
				
				highlight_string = highlight_string.replace(hl_expr, '<b>' + mention.name + '</b>');
				hidden_string = hidden_string.replace(hd_expr, options.trigger +'[' + mention.id + ':' + mention.name + ']');
				
			} else if (original.indexOf(mention.name.split(' ')[0]) >= 0) {
				
				mention.name = mention.name.split(' ')[0];
				
				var hl_expr = new RegExp(mention.name);
				var hd_expr = new RegExp(mention.name);
				
				highlight_string = highlight_string.replace(hl_expr, '<b>' + mention.name + '</b>');
				hidden_string = hidden_string.replace(hd_expr, options.trigger +'[' + mention.id + ':' + mention.name + ']');
			} else {
				delete mentions[i];
			}
		}
		
		$('.highlighter').html(highlight_string);
		$('.hidden').val(hidden_string);
		
		// Searching for autocomplete(AC) mode activator
		var current_position = this.selectionStart;
		var at_position = $(this).val().indexOf(options.trigger);
		if (current_position < at_position || at_position < 0) return;

		var piece = $(this).val().substring(at_position, current_position);
		
		// Mask for AC mode activator
		var reg = new RegExp("^"+options.trigger+"\\w+ ?(\\w+)?$");
		if (piece.match(reg) && isAutocompleteLoaded) {
			var search = piece.substring(1, piece.length);
			var found_users = [];
			
			for (i = 0; i < autocomplete_data.length; i++) {
				var user = autocomplete_data[i];
				if (user.name.toLowerCase().indexOf(search) > -1) {
					found_users.push(user);
				}
			}
			
			// Black magic
			found_users.sort(function(a,b) {
				if (a.name.toLowerCase().indexOf(search) > b.name.toLowerCase().indexOf(search))
					return 1;
				else if (a.name.toLowerCase().indexOf(search) < b.name.toLowerCase().indexOf(search))
					return -1;
				else
					return 0;
			});
			
			// Limit output
			found_users = found_users.slice(0,5);
			
			// Display search results
			html = '';
			for (i = 0; i < found_users.length; i++) {
				avatar = '<img class="avatar" src="' + found_users[i].profile_image_url + '&s=40" width="40" height="40" />';
				name = '<span class="name">' + found_users[i].name + '</span><br />';
				email = '<span class="email">' + found_users[i].email + '</span>';
				html += '<li><a data-id="' + found_users[i].id + '" data-name="' + found_users[i].name + '" href="#' + found_users[i].id + '"><span class="wrapper">' + avatar + name + email + '</span></a></li>';
			}
			$('.autocomplete').html(html);
			$('.autocomplete a:first').addClass('mention-selected');
			$('.autocomplete').show();
			isAutocomplete = true;

		} else { // Hide search results
			$('.autocomplete').hide();
			isAutocomplete = false;
		}
	});	
	
	$('.autocomplete li a').live('click', function(){ // add element to textarea on click
		if (!isAutocomplete) return false;

		var selected = $(this);
		var user_id = $(selected).attr('data-id');
		var name = $(selected).attr('data-name');

		for (i = 0; i < autocomplete_data.length; i++)
			if (autocomplete_data[i].id == user_id)
				mentions.push(autocomplete_data[i]);

		var original = $('.textarea').val();
		var current_position = $('.textarea')[0].selectionStart;
		var at_position = $('.textarea').val().indexOf(options.trigger);
		
		var s = original.substring(0, at_position) + name + original.substring(current_position, original.length) + ' ';
		$('.textarea').val(s);
		$('.textarea')[0].selectionStart = at_position + name.length + 1;
		$('.textarea')[0].selectionEnd = $('.textarea')[0].selectionStart;
		$('.textarea').keyup();
		$('.autocomplete').hide();
		isAutocomplete = false;
		
		$('.textarea').focus();
		return;
	});
	
	$('.autocomplete li a').live('hover', function() {
		$('.autocomplete li a.mention-selected').removeClass('mention-selected');
		$(this).addClass('mention-selected');
	});
};
