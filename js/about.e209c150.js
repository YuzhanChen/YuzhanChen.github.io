(window["webpackJsonp"]=window["webpackJsonp"]||[]).push([["about"],{"45cf":function(t,e,a){"use strict";var i=a("bd76"),r=a.n(i);r.a},"78c0":function(t,e,a){"use strict";a.r(e);var i=function(){var t=this,e=t.$createElement,a=t._self._c||e;return a("div",{staticClass:"blog"},[a("article-list",t._l(t.articleListData,(function(t,e){return a("article-item",{key:e,attrs:{title:t.title,abstract:t.abstract,"title-href":t.titleHref,date:t.date}})})),1)],1)},r=[],l=function(){var t=this,e=t.$createElement,a=t._self._c||e;return a("ul",{staticClass:"article-list"},[t._t("default")],2)},n=[],s={name:"article-list"},c=s,u=(a("e843"),a("2877")),o=Object(u["a"])(c,l,n,!1,null,null,null),f=o.exports,b=function(){var t=this,e=t.$createElement,a=t._self._c||e;return a("li",{staticClass:"article-item"},[a("a",{attrs:{href:t.titleHref}},[a("h4",{staticClass:"article-title"},[t._v(t._s(t.title))])]),a("p",{staticClass:"article-abstract"},[t._v(t._s(t.abstract))]),a("span",{staticClass:"article-date"},[t._v(t._s(t.date))])])},d=[],p={props:{title:{type:String,required:!0},abstract:{type:String,required:!0},titleHref:{type:String,required:!0},date:{type:String,required:!0}}},_=p,v=(a("95e8"),Object(u["a"])(_,b,d,!1,null,null,null)),h=v.exports,m=a("bc3a"),g=a.n(m),w=a("83d6"),C=g.a.create({baseURL:w["a"].articleListJsonUrl}),L={name:"blog",components:{articleList:f,articleItem:h},data:function(){return{articleListData:null}},created:function(){var t=this;C.get().then((function(e){t.articleListData=e.data,console.log(e.data)}))}},y=L,q=(a("45cf"),Object(u["a"])(y,i,r,!1,null,"44b0e61e",null));e["default"]=q.exports},"95e8":function(t,e,a){"use strict";var i=a("e144"),r=a.n(i);r.a},b96b:function(t,e,a){},bd76:function(t,e,a){},e144:function(t,e,a){},e843:function(t,e,a){"use strict";var i=a("b96b"),r=a.n(i);r.a}}]);
//# sourceMappingURL=about.e209c150.js.map