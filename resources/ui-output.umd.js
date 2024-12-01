(function(){"use strict";try{if(typeof document<"u"){var e=document.createElement("style");e.appendChild(document.createTextNode(".ui-output-container[data-v-ff44e7ca]{display:flex;flex-flow:column;height:100%;width:100%}.ui-output-header[data-v-ff44e7ca]{display:flex;justify-content:space-between;text-transform:uppercase;padding-left:3px;padding-right:3px;height:1.4em}.ui-output-label[data-v-ff44e7ca],.ui-output-display[data-v-ff44e7ca]{font-size:14px;font-weight:500;letter-spacing:.025em}.ui-output-wrapper[data-v-ff44e7ca]{border:1px solid rgb(var(--v-theme-primary));display:flex;flex-flow:column nowrap;justify-content:center;align-items:center;position:relative;font-size:14px;font-weight:425;letter-spacing:.025em;text-transform:uppercase;width:100%;flex:1 1 auto}.ui-output-slider-wrapper[data-v-ff44e7ca]{z-index:0}.ui-output-body[data-v-ff44e7ca]{display:inline-flex;justify-content:space-around;width:100%;height:100%}.ui-output-slider[data-v-ff44e7ca]{position:absolute;height:100%;top:50%;-ms-transform:translateY(-50%);transform:translateY(-50%);transition:all .4s ease;z-index:0;border:rgb(var(--v-theme-surface)) solid 2px}.ui-output-button[data-v-ff44e7ca]{text-align:center;z-index:1;outline:none;-webkit-user-select:none;user-select:none;cursor:pointer;line-height:1.1em;transition:color .5s ease;margin:auto}.ui-output-round[data-v-ff44e7ca]{border-radius:1.5em}.ui-output-slider[data-v-ff44e7ca]{width:var(--70f35c1f);left:var(--0be1c28e);background-color:var(--001e21c2)}.ui-output-button[data-v-ff44e7ca]{width:var(--70f35c1f)}.ui-output-active[data-v-ff44e7ca]{color:rgb(var(--v-theme-surface))}.ui-output-display[data-v-ff44e7ca]{color:var(--001e21c2)}")),document.head.appendChild(e)}}catch(t){console.error("vite-plugin-css-injected-by-js",t)}})();
(function(i,n){typeof exports=="object"&&typeof module<"u"?n(exports,require("vuex"),require("vue")):typeof define=="function"&&define.amd?define(["exports","vuex","vue"],n):(i=typeof globalThis<"u"?globalThis:i||self,n(i["ui-output"]={},i.vuex,i.Vue))})(this,function(i,n,e){"use strict";const h=(t,s)=>{const o=t.__vccOpts||t;for(const[u,r]of s)o[u]=r;return o},a={name:"UIOutput",inject:["$socket","$dataTracker"],props:{id:{type:String,required:!0},props:{type:Object,default:()=>({})},state:{type:Object,default:()=>({})}},data(){return{sliderWidth:`${100/this.props.options.length}%`,selection:null,options:this.props.options,display:""}},computed:{...n.mapState("data",["messages"]),sliderLeft(){var t;return`${100/this.props.options.length*((t=this.selection)==null?void 0:t.index)}%`},selectedColor:function(){var t;return this.props.useThemeColors?"rgb(var(--v-theme-primary))":(t=this.selection)==null?void 0:t.color},selectedIndex:function(){var t;return(t=this.selection)==null?void 0:t.index},toDisplay:function(){return this.display!==""?this.display:""}},created(){this.$dataTracker(this.id,this.onInput,this.onLoad),this.$socket.emit("widget-load",this.id)},mounted(){var t,s;this.selection=(t=this.messages[this.id])==null?void 0:t.payload,this.display=(s=this.messages[this.id])==null?void 0:s.display,this.$socket.on("msg-display:"+this.id,o=>{this.display=o})},unmounted(){this.$socket.off("msg-display")},methods:{onLoad(t){t&&(this.$store.commit("data/bind",{widgetId:this.id,msg:t}),this.selection=t.payload,this.display=t.display)},onChange(t){this.selection=t,this.display=t.value==="func"?t.label:t.value,this.$socket.emit("widget-change",this.id,{payload:t,display:this.display})}}},c=()=>{e.useCssVars(t=>({"70f35c1f":t.sliderWidth,"0be1c28e":t.sliderLeft,"001e21c2":t.selectedColor}))},p=a.setup;a.setup=p?(t,s)=>(c(),p(t,s)):c;const y={class:"ui-output-container"},f={class:"ui-output-header"},m={class:"ui-output-label"},_={class:"ui-output-wrapper ui-output-round"},g={class:"ui-output-body"},k=["value","onClick"];function b(t,s,o,u,r,l){return e.openBlock(),e.createElementBlock("div",y,[e.createElementVNode("div",f,[e.createElementVNode("div",m,e.toDisplayString(o.props.label),1),e.createElementVNode("div",{class:"ui-output-display",style:e.normalizeStyle([l.toDisplay=="ERR"?{color:"red"}:{}])},e.toDisplayString(l.toDisplay),5)]),e.createElementVNode("div",_,[s[0]||(s[0]=e.createElementVNode("div",{class:"ui-output-slider-wrapper"},[e.createElementVNode("div",{class:"ui-output-slider ui-output-round"})],-1)),e.createElementVNode("div",g,[(e.openBlock(!0),e.createElementBlock(e.Fragment,null,e.renderList(r.options,d=>(e.openBlock(),e.createElementBlock("div",{key:d.index,value:d.value,class:e.normalizeClass([d.index==l.selectedIndex?"ui-output-active":"","ui-output-button"]),onClick:E=>l.onChange(d)},e.toDisplayString(d.label),11,k))),128))])])])}const x=h(a,[["render",b],["__scopeId","data-v-ff44e7ca"]]);i.UIOutput=x,Object.defineProperty(i,Symbol.toStringTag,{value:"Module"})});
