function h(s) {
        var map = {
                '<': '&lt;',
                '>': '&gt;',
                '&': '&amp;',
                "'": '&#39;',
                '"': '&quot;'
        };
        function f(s) { return map[s]; }
        return s.replace(/&(?!lt;)(?!gt;)(?!amp;)|'|"/g, f);
}
// https://gist.github.com/xendoc/4129696
function strlen(str) {
  var ret = 0;
  for (var i = 0; i < str.length; i++,ret++) {
    var upper = str.charCodeAt(i);
    var lower = str.length > (i + 1) ? str.charCodeAt(i + 1) : 0;
    if (isSurrogatePair(upper, lower)) {
      i++;
    }
  }
  return ret;
}
function substring(str, begin, end) {
  var ret = '';
  for (var i = 0, len = 0; i < str.length; i++, len++) {
    var upper = str.charCodeAt(i);
    var lower = str.length > (i + 1) ? str.charCodeAt(i + 1) : 0;
    var s = "";
    if(isSurrogatePair(upper, lower)) {
      i++;
      s = String.fromCharCode(upper, lower);
    } else {
      s = String.fromCharCode(upper);
    }
    if (begin <= len && len < end) {
      ret += s;
    }
  }
  return ret;
}
function isSurrogatePair(upper, lower) {
  return 0xD800 <= upper && upper <= 0xDBFF && 0xDC00 <= lower && lower <= 0xDFFF;
}
// https://gist.github.com/wadey/442463
function linkify(o) {
        var s = o['text'];
        var map = {};
        $.each(o['entities']['urls'], function (i, entry) {
                map[entry.indices[0]] = [entry.indices[1], function (s) {
                        return "<a href=\""+ h(entry.expanded_url) + "\">" +
                                        h(entry.display_url) + "</a>";
                }];
        });
        $.each(o['entities']['user_mentions'], function (i, entry) {
                map[entry.indices[0]] = [entry.indices[1], function (s) {
                        return "<a href=\"https://twitter.com/" + h(entry.screen_name) + "\">@" +
                                        h(entry.screen_name) + "</a>";
                }];
        });
        $.each(o['entities']['hashtags'], function (i, entry) {
                map[entry.indices[0]] = [entry.indices[1], function (s) {
                        return "<a href=\"https://twitter.com/search?q=#" + h(entry.text) + "\">#" +
                                        h(entry.text) + "</a>";
                }];
        });
        if ('extended_entities' in o && 'media' in o['extended_entities']) {
                $.each(o['extended_entities']['media'], function (i, entry) {
                        map[entry.indices[0]] = [entry.indices[1], function (s) {
                                return "<a href=\""+ h(entry.expanded_url) + "\">" +
                                                h(entry.display_url) + "</a>";
                        }];
                });
        }
        var i = 0, last = 0;
        var result = '';
        for (var i=0;i<strlen(s);i++) {
                var index = map[i];
                if (index != undefined) {
                        var end = index[0];
                        var f = index[1];
                        if (i != last) {
                                result += h(substring(s, last, i));
                        }
                        result += f(substring(s, i, end));
                        i = end - 1;
                        last = end;
                }
        }
        if (i != last) {
                result += h(substring(s, last, i));
        }
        return result;
}

var tweets = []
var recents = []
var index = 0
var next = undefined
var timerId = undefined

jQuery(document).ready(function($){
    fetchTweets();
    
	var timelineBlocks = $('.cd-timeline-block'),
		offset = 0.8;

	//hide timeline blocks which are outside the viewport
	hideBlocks(timelineBlocks, offset);

	//on scolling, show/animate timeline blocks when enter the viewport
	$(window).on('scroll', function(){
		(!window.requestAnimationFrame) 
			? setTimeout(function(){ showBlocks(timelineBlocks, offset); }, 100)
			: window.requestAnimationFrame(function(){ showBlocks(timelineBlocks, offset); });
	});

	function hideBlocks(blocks, offset) {
		blocks.each(function(){
			( $(this).offset().top > $(window).scrollTop()+$(window).height()*offset ) && $(this).find('.cd-timeline-img, .cd-timeline-content').addClass('is-hidden');
		});
	}

	function showBlocks(blocks, offset) {
		blocks.each(function(){
			( $(this).offset().top <= $(window).scrollTop()+$(window).height()*offset && $(this).find('.cd-timeline-img').hasClass('is-hidden') ) && $(this).find('.cd-timeline-img, .cd-timeline-content').removeClass('is-hidden').addClass('bounce-in');
		});
	}
});

var handler = function(json){
  var newTweets = $.map(json, function(e){
    return JSON.parse(e)
  })
  var html="";
  for(var i = 0; i < newTweets.length; ++i ){
     var tweet = newTweets[i];
     html +="<div class=\"cd-timeline-block\">";
     html +="<img class=\"cd-timeline-img cd-picture\" src=\"" + tweet.user.profile_image_url + "\"></img>";
     html +="<div class=\"cd-timeline-content\">";
     html +="<p>" + linkify(tweet) + "<p>";
     if (tweet.extended_entities && tweet.extended_entities.media) {
       $.each(tweet.extended_entities.media, function(i, entry) {
         html += "<br /><img src=\"" + entry.media_url_https + "\" />";
       })
     }
     html +="<span class=\"cd-date\">" + tweet.user.name + " さんより</span>";
     html +="</div>";
     html +="</div>";
  }
  $("#cd-timeline").html(html);
}

var fetchTweets = function(){
  $.ajax({
    type: "GET",
    // URLが変わったら編集する
    url: "http://ksd27.net/apps/tweets",
    dataType: "json"
  }).success(handler).error(function(){
  })
}
