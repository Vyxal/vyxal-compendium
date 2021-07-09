$(document).ready(function() {
  const urlSearchParams = new URLSearchParams(window.location.search);
  const params = Object.fromEntries(urlSearchParams.entries());

  for (var include of (params.i || "").split(" ")) {
    var element = document.getElementById("include-" + include);
    if (element) element.checked = true;
  }

  for (var tag of (params.tags || "").split(" ")) {
    var element = document.getElementById("tag-" + tag);
    if (element) element.checked = true;
  }

  $("#search-box").val(params.q || "");
  M.updateTextFields();

  update_search();

  $(".tagbox").each(function(index, element) {
    var tagname = $(element).attr("data-name");
    var taginfo = $(element).attr("data-info");
    $(element).hover(function(e) {
      if (e.type == "mouseenter") {
        $("#tag-info-header").html("<a href='/search?tags=" + tagname + "'><kbd>" + tagname + "</kbd></a>");
        $("#tag-info").html(taginfo);
      }
    });
  });

  $("input").on("input", function() {
    update_search();
  });

  $("body").on("keydown", function(e) {
    if (e.keyCode == 27) {
      $("#search-box").focus();
    }
  });
});

function get_search() {
  var include = [];
  var tags = [];
  var query = $("#search-box").val();
  $(".include").each(function(index, element) {
    if (element.checked) {
      include.push(element.getAttribute("data-category"));
    }
  });
  $(".tag").each(function(index, element) {
    if (element.checked) {
      tags.push(element.parentNode.getAttribute("data-name"));
    }
  });
  return [include, tags, query];
}

function update_search() {
  var [include, tags, query] = get_search();
  var query_args = [];
  if (query) {
    query_args.push("q=" + encodeURIComponent(query));
  }
  if (include.length) {
    query_args.push("i=" + include.map(function(x) {
      return encodeURIComponent(x);
    }).join("+");
  }
  if (tags.length) {
    query_args.push("tags=" + tags.map(function(x) {
      return encodeURIComponent(x);
    }).join("+"));
  }
  window.history.replaceState("", "", "?" + query_args.join("&"));

  var do_major_types = include.indexOf("atoms") != -1 || include.indexOf("quicks") != -1 || include.indexOf("syntax") != -1;
  var do_minor_types = include.indexOf("nilads") != -1 || include.indexOf("monads") != -1 || include.indexOf("dyads") != -1;

  var keywords = query.split(/\W+/).filter(function(x) {
    return x.length;
  });

  $("table#search-results tr").each(function(index, element) {
    if (index == 0) return;
    var tagged = false;
    var kws = [];
    for (var property of element.classList) {
      if (property.startsWith("type-")) {
        var type = property.substring(5);
        if (type == "atoms" || type == "quicks" || type == "syntax") {
          if (do_major_types) {
            if (include.indexOf(type) == -1) {
              element.hidden = true;
              return;
            }
          }
        } else {
          if (do_major_types && do_minor_types) {
            if (include.indexOf(type) == -1) {
              element.hidden = true;
              return;
            }
          }
        }
      } else if (property.startsWith("tagged-")) {
        var tag = property.substring(7);
        if (tags.length == 0 || tags.indexOf(tag) != -1) {
          tagged = true;
        }
      } else if (property.startsWith("keyword-")) {
        var keyword = property.substring(8);
        kws.push(keyword);
      }
    }
    for (var keyword of keywords) {
      var found = false;
      for (var kw of kws) {
        if (kw.indexOf(keyword) != -1) {
          found = true;
          break;
        }
      }
      if (!found) {
        element.hidden = true;
        return;
      }
    }
    element.hidden = !tagged;
  });
}