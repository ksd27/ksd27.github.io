var tweets = []
var recents = []
var index = 0
var next = undefined
var timerId = undefined

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

var showTweet = function(){
  var prevItem = $("<div></div>").addClass("bb-item")
  prevItem.append($("<div></div>").addClass("bb-offset-content"))
  prevItem.append($("<img/>")
    .addClass("bb-image")
    .attr("src", "/assets/img/adjust-aspect-ratio.png"))
  var messageHtml = "今日はさんくっすんバースデー٩(๑❛ᴗ❛๑)۶<br>Twitterで <span class=\"hash_tag\">#くっすんBDフラスタ企画2016</span> を付けてお祝いメッセージをつぶやくとこのフラスタに『リアルタイム』で表示されます！！<br>皆でくっすんを「幸せで胃もたれ」させちゃいましょう٩(๑❛ᴗ❛๑)۶"
  prevItem.append($("<div></div>").addClass("message").html(messageHtml))
  var nextItem = $("<div></div>").addClass("bb-item")
  nextItem.append($("<div></div>").addClass("bb-offset-content"))
  nextItem.append($("<img/>")
    .addClass("bb-image")
    .attr("src", "/assets/img/adjust-aspect-ratio.png"))
  nextItem.append($("<div></div>").addClass("message").html(messageHtml))
  $("#bb-bookblock").empty()
  $("#bb-bookblock").append(prevItem)
  $("#bb-bookblock").append(nextItem)
  $("#bb-bookblock").bookblock("updateOwn", 0)
  $("#bb-bookblock").bookblock("next")
}

var updateTweets = function(){
  showTweet()
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
    url: "http://ksd27.net/apps/tweets",
    dataType: "json"
  }).success(handler).error(function(){
  })
}

$(function(){
  $("#bb-bookblock").bookblock({
    speed: 800,
    shadowSides: 0.8,
    shadowFlip: 0.4,
    orientation : 'horizontal'
  })

  fetchTweets()
  timerId = setInterval(fetchTweets, 5000)

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
