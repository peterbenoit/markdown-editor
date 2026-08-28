import{p as rt}from"./chunk-JWPE2WC7-B1jY1CGG.js";import{Y as D,b_ as G,j as nt,an as it,bK as st,ao as ot,bL as lt,as as ct,bN as ut,d,bf as B,ar as gt,N as dt,bJ as pt,bs as ht,X as ft,O as mt,ab as vt}from"./mermaid.core-DC2xNL6s.js";import{p as xt}from"./cynefin-OW5HDTMX-lEXbDjnE.js";import{d as Y}from"./arc-Bh35d0bv.js";import{o as St}from"./ordinal-Cboi1Yqb.js";import"./index-D4LrZv3i.js";import"./init-Gi6I4Gst.js";function yt(t,n){return n<t?-1:n>t?1:n>=t?0:NaN}function wt(t){return t}function At(){var t=wt,n=yt,y=null,T=D(0),l=D(G),p=D(0);function i(e){var r,o=(e=nt(e)).length,h,w,$=0,f=new Array(o),s=new Array(o),b=+T.apply(this,arguments),E=Math.min(G,Math.max(-G,l.apply(this,arguments)-b)),k,N=Math.min(Math.abs(E)/o,p.apply(this,arguments)),u=N*(E<0?-1:1),A;for(r=0;r<o;++r)(A=s[f[r]=r]=+t(e[r],r,e))>0&&($+=A);for(n!=null?f.sort(function(M,m){return n(s[M],s[m])}):y!=null&&f.sort(function(M,m){return y(e[M],e[m])}),r=0,w=$?(E-o*u)/$:0;r<o;++r,b=k)h=f[r],A=s[h],k=b+(A>0?A*w:0)+u,s[h]={data:e[h],index:r,value:A,startAngle:b,endAngle:k,padAngle:N};return s}return i.value=function(e){return arguments.length?(t=typeof e=="function"?e:D(+e),i):t},i.sortValues=function(e){return arguments.length?(n=e,y=null,i):n},i.sort=function(e){return arguments.length?(y=e,n=null,i):y},i.startAngle=function(e){return arguments.length?(T=typeof e=="function"?e:D(+e),i):T},i.endAngle=function(e){return arguments.length?(l=typeof e=="function"?e:D(+e),i):l},i.padAngle=function(e){return arguments.length?(p=typeof e=="function"?e:D(+e),i):p},i}var Ct=vt.pie,I={sections:new Map,showData:!1},W=I.sections,V=I.showData,$t=structuredClone(Ct),bt=d(()=>structuredClone($t),"getConfig"),Dt=d(()=>{W=new Map,V=I.showData,mt()},"clear"),Tt=d(({label:t,value:n})=>{if(n<0)throw new Error(`"${t}" has invalid value: ${n}. Negative values are not allowed in pie charts. All slice values must be >= 0.`);W.has(t)||(W.set(t,n),B.debug(`added new section: ${t}, with value: ${n}`))},"addSection"),kt=d(()=>W,"getSections"),zt=d(t=>{V=t},"setShowData"),Et=d(()=>V,"getShowData"),Z={getConfig:bt,clear:Dt,setDiagramTitle:ut,getDiagramTitle:ct,setAccTitle:lt,getAccTitle:ot,setAccDescription:st,getAccDescription:it,addSection:Tt,getSections:kt,setShowData:zt,getShowData:Et},Mt=d((t,n)=>{rt(t,n),n.setShowData(t.showData),t.sections.map(n.addSection)},"populateDb"),Lt={parse:d(async t=>{const n=await xt("pie",t);B.debug(n),Mt(n,Z)},"parse")},Nt=d(t=>`
  .pieCircle{
    stroke: ${t.pieStrokeColor};
    stroke-width : ${t.pieStrokeWidth};
    opacity : ${t.pieOpacity};
  }
  .pieCircle.highlighted{
    scale: 1.05;
    opacity: 1;
  }
  .pieCircle.highlightedOnHover:hover{
    transition-duration: 250ms;
    scale: 1.05;
    opacity: 1;
  }
  .pieOuterCircle{
    stroke: ${t.pieOuterStrokeColor};
    stroke-width: ${t.pieOuterStrokeWidth};
    fill: none;
  }
  .pieTitleText {
    text-anchor: middle;
    font-size: ${t.pieTitleTextSize};
    fill: ${t.pieTitleTextColor};
    font-family: ${t.fontFamily};
  }
  .slice {
    font-family: ${t.fontFamily};
    fill: ${t.pieSectionTextColor};
    font-size:${t.pieSectionTextSize};
    // fill: white;
  }
  .legend text {
    fill: ${t.pieLegendTextColor};
    font-family: ${t.fontFamily};
    font-size: ${t.pieLegendTextSize};
  }
`,"getStyles"),Rt=Nt,Ot=d(t=>{const n=[...t.values()].reduce((l,p)=>l+p,0),y=[...t.entries()].map(([l,p])=>({label:l,value:p})).filter(l=>l.value/n*100>=1);return At().value(l=>l.value).sort(null)(y)},"createPieArcs"),Wt=d((t,n,y,T)=>{var K;B.debug(`rendering pie chart
`+t);const l=T.db,p=gt(),i=dt(l.getConfig(),p.pie),e=40,r=18,o=4,h=450,w=h,$=pt(n),f=$.append("g");f.attr("transform","translate("+w/2+","+h/2+")");const{themeVariables:s}=p;let[b]=ht(s.pieOuterStrokeWidth);b??(b=2);const E=i.legendPosition,k=i.textPosition,N=i.donutHole>0&&i.donutHole<=.9?i.donutHole:0,u=Math.min(w,h)/2-e,A=Y().innerRadius(N*u).outerRadius(u),M=Y().innerRadius(u*k).outerRadius(u*k),m=f.append("g");m.append("circle").attr("cx",0).attr("cy",0).attr("r",u+b/2).attr("class","pieOuterCircle");const R=l.getSections(),q=Ot(R),Q=[s.pie1,s.pie2,s.pie3,s.pie4,s.pie5,s.pie6,s.pie7,s.pie8,s.pie9,s.pie10,s.pie11,s.pie12];let _=0;R.forEach(a=>{_+=a});const j=q.filter(a=>(a.data.value/_*100).toFixed(0)!=="0"),F=St(Q).domain([...R.keys()]);m.selectAll("mySlices").data(j).enter().append("path").attr("d",A).attr("fill",a=>F(a.data.label)).attr("class",a=>{let c="pieCircle";return i.highlightSlice==="hover"?c+=" highlightedOnHover":i.highlightSlice===a.data.label&&(c+=" highlighted"),c}),m.selectAll("mySlices").data(j).enter().append("text").text(a=>(a.data.value/_*100).toFixed(0)+"%").attr("transform",a=>"translate("+M.centroid(a)+")").style("text-anchor","middle").attr("class","slice");const tt=f.append("text").text(l.getDiagramTitle()).attr("x",0).attr("y",-400/2).attr("class","pieTitleText"),L=[...R.entries()].map(([a,c])=>({label:a,value:c})),C=f.selectAll(".legend").data(L).enter().append("g").attr("class","legend");C.append("rect").attr("width",r).attr("height",r).style("fill",a=>F(a.label)).style("stroke",a=>F(a.label)),C.append("text").attr("x",r+o).attr("y",r-o).text(a=>l.getShowData()?`${a.label} [${a.value}]`:a.label);const z=Math.max(...C.selectAll("text").nodes().map(a=>(a==null?void 0:a.getBoundingClientRect().width)??0));let O=h,H=w+e;const g=r+o,P=L.length*g;switch(E){case"center":C.attr("transform",(a,c)=>{const v=g*L.length/2,x=-z/2-(r+o),S=c*g-v;return"translate("+x+","+S+")"});break;case"top":O+=P,C.attr("transform",(a,c)=>{const v=u,x=-z/2-(r+o),S=c*g-v;return`translate(${x}, ${S})`}),m.attr("transform",()=>`translate(0, ${P+g})`);break;case"bottom":O+=P,C.attr("transform",(a,c)=>{const v=-u-g,x=-z/2-(r+o),S=c*g-v;return"translate("+x+","+S+")"});break;case"left":H+=r+o+z,C.attr("transform",(a,c)=>{const v=g*L.length/2,x=-u-(r+o),S=c*g-v;return"translate("+x+","+S+")"}),m.attr("transform",()=>`translate(${z+r+o}, 0)`);break;case"right":default:H+=r+o+z,C.attr("transform",(a,c)=>{const v=g*L.length/2,x=12*r,S=c*g-v;return"translate("+x+","+S+")"});break}const U=((K=tt.node())==null?void 0:K.getBoundingClientRect().width)??0,et=w/2-U/2,at=w/2+U/2,X=Math.min(0,et),J=Math.max(H,at)-X;$.attr("viewBox",`${X} 0 ${J} ${O}`),ft($,O,J,i.useMaxWidth)},"draw"),_t={draw:Wt},Ut={parser:Lt,db:Z,renderer:_t,styles:Rt};export{Ut as diagram};
