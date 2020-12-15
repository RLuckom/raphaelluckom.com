function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
with (obj) {
__p += '<!DOCTYPE html>\n<html lang="en-us">\n  <head>\n  <link rel="stylesheet" href="/assets/static/css/main.css">\n  <link rel="stylesheet" href="/assets/static/css/highlight.css">\n    <title>\n         ' +
((__t = ( item.title )) == null ? '' : __t) +
'\n    </title>\n  </head>\n  <body>\n<section id="nav">\n<h1>' +
((__t = ( siteDetails.title )) == null ? '' : __t) +
'</h1>\n<div class="nav-links">\n';
 _.forEach(_.get(siteDetails, 'formats.html.nav.links'), function({name, target}) { 
    ;
__p += '<div class="nav-link-ctr"><a class="nav-link" href="' +
__e( target ) +
'">' +
__e( name  ) +
'</a></div>';
 
}); ;
__p += '\n</div>\n</section>\n<section>\n<article id="content">\n  <h1>' +
((__t = ( item.title )) == null ? '' : __t) +
' </h1>\n    <p class="subtitle">\n      ' +
((__t = ( item.date )) == null ? '' : __t) +
'\n    </p>\n' +
((__t = ( item.content )) == null ? '' : __t) +
'\n</article>\n</section>\n<section id="trails">\n';
 _.forEach(meta.trails.neighbors, function({trailName, previousNeighbor, nextNeighbor}, trailUri) { 
;
__p += '<div class="trail-links">';

  if (previousNeighbor) {
   ;
__p += '<a href="' +
__e( _.get(identifyUri(previousNeighbor.memberUri), 'browserUrl') ) +
'">' +
__e( _.get(previousNeighbor, "memberMetadata.frontMatter.title") ) +
'</a>';
 
} 
;
__p += '<a href="' +
__e( _.get(identifyUri(trailUri), 'browserUrl') ) +
'">' +
__e( trailUri ) +
'</a>';
 
<% 
if (nextNeighbor) {
;
__p += '<a href="' +
__e( _.get(identifyUri(nextNeighbor.memberUri), 'browserUrl') ) +
'">' +
__e( _.get(nextNeighbor, "memberMetadata.frontMatter.title") ) +
'</a>';

}
;

 }) ;
__p += '\n</section>\n  </body>\n</html>\n';

}
return __p
}