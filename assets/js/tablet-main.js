var contains = function(arr, id){
  var r = false
  $.each(arr, function(i, e){
    if (e.id_str == id) {
      r = true
      return false
    }
  })
  return r
}
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
			return "<a href=\"https://twitter.com/search?q=%23" + h(entry.text) + "\">#" +
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
var dateString = function(d){
  // https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Date
  function pad(n){return n<10 ? '0'+n : n}
  return d.getFullYear()+'/'
    + pad(d.getMonth()+1)+'/'
    + pad(d.getDate())+' '
    + pad(d.getHours())+':'
    + pad(d.getMinutes())+':'
    + pad(d.getSeconds())
}

var tweets = []
var recents = []
var tweetIndex = 0
var next = undefined
var timerId = undefined
var showCount = 0
var backgroundUrls = [
  "/assets/img/adjust-aspect-ratio.png",
  "/assets/img/img01.png",
  "/assets/img/img02.png",
  "/assets/img/img03.png",
  //"/assets/img/img04.png",
  "/assets/img/img05.png",
  "/assets/img/img06.png",
  "/assets/img/img07.png",
  "/assets/img/img08.png",
  "/assets/img/img09.png",
  "/assets/img/img10.png",
  "/assets/img/img11.png",
  "/assets/img/img12.png"
]
var kokuchiUrls = [
  "/assets/img/img00_1.png",
  "/assets/img/img00_2.png"
]

var applyContent = function(item, tweet){
  item.find(".user-icon").attr("src", tweet.user.profile_image_url)
  item.find(".user-name").text(tweet.user.name)
  item.find(".text").html(linkify(tweet))
}

var showTweet = function(prevTweet, nextTweet){
  var prevItem = $($.parseHTML($("#template1").html()))
  var nextItem = $($.parseHTML($("#template1").html()))
  if (prevTweet) {
    applyContent(prevItem, prevTweet)
    prevItem.find(".bb-image").attr("src",
      backgroundUrls[(showCount - 1 + backgroundUrls.length) % backgroundUrls.length])
    // 文字サイズ可変
    var size = 100 * (1.0 - Math.min(prevTweet.text.length / 140.0, 1.0))
    prevItem.find(".text").css("font-size", "" + (220 + size) + "%")
  } else {
    prevItem = $($.parseHTML($("#template2").html()))
    // 告知画像を切り替えるために少し複雑になっている
    var i = Math.floor(showCount - 1 + showCount / 6)
    prevItem.find(".bb-image").attr("src",
      kokuchiUrls[(i + kokuchiUrls.length) % kokuchiUrls.length])
    prevItem.find(".message").css("font-size", "" + 250 + "%")
  }
  if (nextTweet) {
    applyContent(nextItem, nextTweet)
    nextItem.find(".bb-image").attr("src",
      backgroundUrls[showCount % backgroundUrls.length])
    // 文字サイズ可変
    var size = 100 * (1.0 - Math.min(nextTweet.text.length / 140.0, 1.0))
    nextItem.find(".text").css("font-size", "" + (220 + size) + "%")
  } else {
    nextItem = $($.parseHTML($("#template2").html()))
    // 告知画像を切り替えるために少し複雑になっている
    var i = Math.floor(showCount + showCount / 6)
    nextItem.find(".bb-image").attr("src",
      kokuchiUrls[i % kokuchiUrls.length])
    nextItem.find(".message").css("font-size", "" + 250 + "%")
  }
  $("#bb-bookblock").empty()
  $("#bb-bookblock").append(prevItem)
  $("#bb-bookblock").append(nextItem)
  $("#bb-bookblock").bookblock("updateOwn", 0)
  $("#bb-bookblock").bookblock("next")
}

var updateTweets = function(){
  if (showCount % 6 == 0) {
    var prev = next
    showTweet(prev, undefined)
    next = undefined
  } else if (recents.length > 0) {
    // recentsを優先する
    var prev = next
    next = recents.shift()
    showTweet(prev, next)
    tweets.push(next)
  } else if (tweets.length > 0) {
    // 範囲内にする
    tweetIndex = tweetIndex % tweets.length
    // 連続を避ける
    if (tweets.length > 2 && next != undefined && next.id_str == tweets[tweetIndex].id_str) {
      tweetIndex += 1
    }
    // 範囲内にする
    tweetIndex = tweetIndex % tweets.length

    var prev = next
    next = tweets[tweetIndex]
    showTweet(prev, next)
    tweetIndex += 1
  }
  showCount += 1

  // 待機時間可変
  var delay = 5000
  if (next) {
    delay = 5000 * Math.min(next.text.length / 140.0, 1.0)
  }
  //console.log(5000 + delay)
  timerId = setTimeout(fetchTweets, 5000 + delay)
}

var handler = function(json){
  var oldTweets = recents.concat(tweets)
  var newTweets = $.map(json, function(e){
    return JSON.parse(e)
  })
  // 追加分と削除分の検出
  var addingTweets = newTweets.filter(function(e){
    return !contains(oldTweets, e.id_str)
  })
  var deletingTweets = oldTweets.filter(function(e){
    return !contains(newTweets, e.id_str)
  })
  // 追加分はrecentsに入れる
  addingTweets.forEach(function(e){
    recents.unshift(e)
  })
  // 削除分はtweetsとrecentsの両方から削除する
  tweets = tweets.filter(function(e){
    return !contains(deletingTweets, e.id_str)
  })
  recents = recents.filter(function(e){
    return !contains(deletingTweets, e.id_str)
  })
  // 表示に反映する
  updateTweets()
}

var fetchTweets = function(){
  $.ajax({
    type: "GET",
    // URLが変わったら編集する
    url: "/apps/tweets",
    dataType: "json",
    timeout: 5000
  }).success(handler).error(function(){
    // エラーでも更新する
    updateTweets()
  })
}

$(function(){
  $("#bb-bookblock").bookblock({
    speed: 800,
    shadowSides: 0.8,
    shadowFlip: 0.4
  })

  fetchTweets()

  $("#fs").click(function(){
    var e = document.getElementById("bb-bookblock")
    if (e.requestFullscreen) {
      e.requestFullscreen()
    } else if (e.msRequestFullscreen) {
      e.msRequestFullscreen()
    } else if (e.mozRequestFullscreen) {
      e.mozRequestFullscreen()
    } else if (e.webkitRequestFullscreen) {
      e.webkitRequestFullscreen()
    }
  })
})
