/* The data files above are classic scripts declaring top-level consts. If one
   fails to load, the first reference to a missing name throws at global scope
   and halts the rest of this script — leaving a page that looks half-built and
   is entirely dead, with nothing but a console error to explain it. Fail loudly
   and legibly instead. */
(function(){
  const missing=["CHARTS","SEASONS","RESORTS","CASH_RATES","MARKET","ROFR"].filter(
    n=>typeof window[n]==="undefined"&&(()=>{try{eval(n);return false}catch(e){return true}})());
  if(!missing.length) return;
  const b=document.createElement("div");
  b.setAttribute("role","alert");
  b.style.cssText="margin:24px 22px;padding:18px 22px;border:1px solid var(--rust);border-radius:10px;"+
    "background:var(--rust-tint);color:var(--ink);font:16px/1.55 system-ui,sans-serif;max-width:1060px";
  b.innerHTML="<strong>The data files did not load.</strong> This page needs "+
    "<code>data/charts.js</code>, <code>data/resorts.js</code>, <code>data/market.js</code> and <code>data/rates.js</code> "+
    "alongside it. Missing: "+missing.join(", ")+".";
  document.body.prepend(b);
  throw new Error("data files failed to load: "+missing.join(", "));
})();

const NOW = new Date();



/* Current asking market on DVC Resale Market, sampled 3 September 2026.
   ask = median asking $/pt across listings not already pending or under offer.
   Index-aligned with RESORTS. */

function renderListing(){
  const ri=+el("resort").value, r=RESORTS[ri], m=MARKET[ri], i=inputs();
  const pts=Math.max(1,+el("lPts").value||1);
  const ppp=Math.max(1,+el("lPpp").value||1);
  const a26=Math.max(0,+el("l26").value||0);
  const a27=Math.max(0,+el("l27").value||0);
  const rate=bankedValue(ri);

  const cash=pts*ppp+i.cR;
  const delta=(a26-pts)+(a27-pts);          // points above or below a normal two-year allotment
  const credit=delta*rate;
  const eff=(pts*ppp-credit)/pts;           // effective price per point after valuing those points
  const yrs=yearsLeft(r.exp);
  const allin=costPerPointYear(eff,i.cR,pts,r.dues,yrs,i.g);

  const vsSold=r.resale===null?null:(eff/r.resale-1)*100;
  const vsAsk=m.ask===null?null:(ppp/m.ask-1)*100;

  const flags=[];
  if(delta>=pts*0.5) flags.push(["ok","Loaded. It arrives with "+delta+" points beyond a normal allotment &mdash; worth about "+money(credit)+" at what a banked point is worth here ("+money2(rate)+"), which is why the asking price can look high and still be the better buy."]);
  if(delta<=-pts*0.5) flags.push(["bad","Stripped. You are short "+Math.abs(delta)+" points against a normal allotment. The low asking price is buying you fewer points, not cheaper points."]);
  if(vsSold!==null&&vsSold<-10) flags.push(["bad","Effective price sits "+Math.abs(vsSold).toFixed(0)+"% under the August sold average. Disney's right of first refusal is most likely to trigger here &mdash; budget for the possibility of starting over."]);
  if(vsAsk!==null&&vsAsk>12) flags.push(["warn","Asking "+vsAsk.toFixed(0)+"% above the current median ask at this resort. Worth an offer rather than a full-price bid."]);
  if(pts<=50) flags.push(["warn","Small contracts carry a premium. Across the current board, contracts of 50 points or fewer ask a median $138/pt against $118/pt for contracts of 200 or more."]);
  if(a26===0&&a27<pts) flags.push(["warn","No 2026 points and an incomplete 2027 allotment. Your first usable full year is 2028."]);

  el("listOut").innerHTML=
    "<div class=\"stayhead\">"+
      "<div class=\"staypts\">"+
        "<span class=\"big\">"+money2(eff)+"</span>"+
        "<span class=\"big-unit\">effective price per point, after valuing the points that come with it at "+money(rate)+"</span>"+
      "</div>"+
      "<div class=\"staycost\">"+
        "<h4>Against the market</h4>"+
        "<div class=\"cline\"><span>Cash at closing</span><span>"+money(cash)+"</span></div>"+
        "<div class=\"cline\"><span>Points above a normal allotment</span><span>"+(delta>0?"+":"")+delta+" ("+money(credit)+")</span></div>"+
        "<div class=\"cline\"><span>Asking vs current median ask</span><span>"+(vsAsk===null?"&mdash;":(vsAsk>0?"+":"")+vsAsk.toFixed(0)+"%")+"</span></div>"+
        "<div class=\"cline\"><span>Effective vs August sold average</span><span>"+(vsSold===null?"&mdash;":(vsSold>0?"+":"")+vsSold.toFixed(0)+"%")+"</span></div>"+
        "<div class=\"cline\"><span>All-in cost per point-year</span><span>"+money2(allin.total)+"</span></div>"+
        "<div class=\"cline\"><span>A banked point is worth</span><span>"+money2(rate)+"</span></div>"+
      "</div>"+
    "</div>"+
    (flags.length
      ? flags.map(f=>"<div class=\"staywarn"+(f[0]==="bad"?" bad":f[0]==="ok"?" good":"")+"\">"+f[1]+"</div>").join("")
      : "<div class=\"staywarn good\">Nothing unusual. Points included are close to a normal allotment and the price sits in line with both the current asking board and recent sales.</div>")+
    "<div class=\"staywarn\">Median ask at "+plain(r.name)+" right now is "+(m.ask===null?"not established":money(m.ask)+"/pt across "+m.live+" buyable listings")+
      ". Of "+m.n+" listings shown, "+(m.n-m.live)+" were already pending or under offer &mdash; across the whole board 43% are spoken for, so move on anything that prices well.</div>";
}

let LISTINGS=[
];

/* 2026 year-to-date buyback rates, approximated from the monthly ROFR reports.
   Index-aligned with RESORTS. Used only to score relative risk. */
const SNAPSHOT=LISTINGS.slice();
const PREFIX={AK:0,BL:1,BC:2,BW:3,BR:4,CC:5,OK:6,PL:7,RR:8,SS:9,GF:10};
const MONTHS=["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];

/* Tolerant parser: finds listing IDs, then reads the fields between one ID and the next.
   Deliberately shape-agnostic so a markup change on the broker's side does not break it. */
function parseListings(text){
  const ids=[...text.matchAll(/\b[A-Z]{2}[A-Z0-9]\d{4}\b/g)];
  /* Listing IDs are unique, so a repeat means the paste overlapped — someone
     copied two pages, or grabbed the same block twice. Counting it once keeps
     the ranked table honest about how much inventory was really found. */
  const out=[], seen=new Set(); let skipped=0, pending=0, foreign=0, dupes=0;
  for(let k=0;k<ids.length;k++){
    const id=ids[k][0];
    const seg=text.slice(ids[k].index+id.length, k+1<ids.length?ids[k+1].index:text.length);
    const ri=PREFIX[id.slice(0,2)];
    if(ri===undefined){foreign++;continue;}
    if(seen.has(id)){dupes++;continue;}
    if(/pending|offer accepted|under contract/i.test(seg)){pending++;continue;}
    const mm=seg.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\b/i);
    if(!mm){skipped++;continue;}
    const before=seg.slice(0,mm.index).match(/\d[\d,]*/g)||[];
    const after=seg.slice(mm.index).match(/\d[\d,]*/g)||[];
    const num=x=>parseInt(String(x).replace(/,/g,""),10);
    if(before.length<3||after.length<1){skipped++;continue;}
    const pts=num(before[0]), a26=num(before[1]), a27=num(before[2]);
    const ppp=after.map(num).find(v=>v>=40&&v<=600);
    if(!(pts>0&&pts<=5000)||ppp===undefined||!isFinite(a26)||!isFinite(a27)){skipped++;continue;}
    const uy=mm[0].slice(0,3); 
    seen.add(id);
    out.push([ri,id,pts,a26,a27,uy.charAt(0).toUpperCase()+uy.slice(1).toLowerCase(),ppp]);
  }
  return {out,skipped,pending,foreign,dupes};
}

function applyParse(){
  const msg=el("parseMsg"), txt=el("pasteBox").value||"";
  if(txt.trim().length<20){msg.className="bad";msg.textContent="Nothing to parse yet.";return;}
  const {out,skipped,pending,foreign,dupes}=parseListings(txt);
  if(!out.length){msg.className="bad";msg.textContent="No listings recognised. Copy the table rows themselves, including the listing IDs.";return;}
  LISTINGS=out;
  const resorts=new Set(out.map(x=>x[0])).size;
  msg.className="good";
  msg.textContent=out.length+" buyable listings across "+resorts+" resorts"+
    (pending?", "+pending+" pending skipped":"")+
    (foreign?", "+foreign+" non-WDW skipped":"")+
    (dupes?", "+dupes+" duplicate"+(dupes===1?"":"s")+" merged":"")+
    (skipped?", "+skipped+" unreadable":"")+".";
  renderRank();
}


/* Colour intensity alone cannot carry meaning (WCAG 1.4.1). Every shaded cell
   also states its band in a title, the numeric value is always printed in the
   cell, and each matrix carries a visible key rather than a sentence buried in
   a footnote. */
const BANDS=["cheapest","below average","about average","above average","priciest"];
const shadeKey=()=>"<div class=\"skey\"><span class=\"skey-label\">Shading</span>"+
  BANDS.map((b,idx)=>"<span class=\"skey-cell\" style=\"background:rgba(var(--shade-rgb),"+
    (0.06+0.32*(idx/(BANDS.length-1))).toFixed(3)+")\">"+b+"</span>").join("")+"</div>";

function renderMatrix(){
  const ri=+el("resort").value, r=RESORTS[ri], i=inputs(), mode=el("mMode").value, pat=+el("mPat").value;
  const chart=chartFor(ri,2027), cols=CHARTS[ri].cols, y=yearsLeft(r.exp);
  const cR=r.resale===null?null:costPerPointYear(r.resale,i.cR,i.pts,r.dues,y,i.g).total;
  const cD=costPerPointYear(r.direct,i.cD,i.pts,r.dues,y,i.g).total;
  const rate=(s,c)=>pat===0?chart[s][0][c]:pat===2?chart[s][1][c]:(5*chart[s][0][c]+2*chart[s][1][c])/7;

  el("mtxHead").innerHTML="<tr><th>Room</th>"+SEASON_SHORT.map(x=>"<th>"+x+"</th>").join("")+"</tr>";

  const ordered=sortedCols(ri);
  const vals=[];
  ordered.forEach(({ci})=>SEASON_SHORT.forEach((_,si)=>{
    const n=rate(si,ci);
    vals.push(mode==="nights"?i.pts/n:mode==="pts"?n:n*(mode==="resale"?(cR||cD):mode==="direct"?cD:(cD-(cR||cD))));
  }));
  const lo=Math.min(...vals), hi=Math.max(...vals);
  /* One polarity across the whole page: darker always means costs you more.
     This matrix used to shade the opposite way from the one in the next
     section, so a reader who had just learned "dark = good" misread the
     second table at a glance. `nights` is inverted because more nights per
     year is better, not worse. */
  const badness=v=>hi===lo?0.35:(mode==="nights"?1-(v-lo)/(hi-lo):(v-lo)/(hi-lo));
  const shade=v=>"background:rgba(var(--shade-rgb),"+(0.06+0.32*badness(v)).toFixed(3)+")";
  const band=v=>BANDS[Math.min(BANDS.length-1,Math.floor(badness(v)*BANDS.length))];

  el("mtxBody").innerHTML=ordered.map(({c,ci})=>{
    const [room,view]=c.split("|");
    return "<tr><td>"+room+(view?"<span class=\"rv\"> &middot; "+view+"</span>":"")+"</td>"+
      SEASON_SHORT.map((_,si)=>{
        const n=rate(si,ci);
        let v,txt;
        if(mode==="nights"){ v=i.pts/n; txt=v<1?"&mdash;":v.toFixed(v<10?1:0); }
        else if(mode==="pts"){ v=n; txt=n.toFixed(n<10?1:0); }
        else { const u=mode==="resale"?(cR||cD):mode==="direct"?cD:(cD-(cR||cD)); v=n*u; txt=money(v); }
        return "<td style=\""+shade(v)+"\" title=\""+band(v)+"\">"+txt+"</td>";
      }).join("")+"</tr>";
  }).join("");

  const pn=pat===0?"Sun&ndash;Thu nights":pat===2?"Friday and Saturday nights":"a normal week, five weeknights to two weekend nights";
  const label={
    nights:"Nights per year that "+i.pts+" points buys, averaged over "+pn+". Values under one mean the contract cannot cover a single night in that room and season.",
    pts:"Points per night, averaged over "+pn+".",
    resale:"What one night costs you as an owner who bought resale &mdash; points per night multiplied by your all-in cost per point-year of "+(cR===null?"n/a":money2(cR))+".",
    direct:"What one night costs you as an owner who bought direct, at "+money2(cD)+" per point-year.",
    prem:"The extra you pay per night for having bought direct rather than resale. Multiply by the nights you would actually take each year to see the annual cost of that choice."
  }[mode];
  el("mtxNote").innerHTML=label+" 2027 chart."+shadeKey();
}

/* Rough 2026 rack rates, deluxe studio, standard view, weeknight. Starting points only. */
/* Cash rates move by season too, and not in step with points. Rough multipliers
   against a normal fall week, from Disney's own 2026 season structure. */

/* Discount is per trip, not global. Disney's resident and passholder rates are
   tiered by length of stay and largely disappear over Easter and Christmas, so
   one number applied to every trip mispriced exactly the trips people most
   often own points for. Default is 0 — most visitors are not Florida residents,
   and a pre-filled 35% quietly decided the own-vs-cash verdict for them. */
/* A trip names a date band, not just a season. Disney prices Easter week and
   Christmas week identically, so the chart lumps them into one season — but
   nobody thinks of them as the same trip, and the hero has to know which one
   to pin. `b` indexes into that season's date ranges; pricing ignores it. */
let trips=[
  {si:4, b:0, nights:3, wknd:2, disc:0},
  {si:3, b:1, nights:4, wknd:2, disc:0},
  {si:6, b:1, nights:5, wknd:2, disc:0}
];

// Seasons where Disney's resident/AP discounts effectively vanish.
const NO_DISCOUNT_SEASONS=[6];

const HOLIDAY_BANDS={"321-328":"Easter week","1124-1126":"Thanksgiving","1224-1231":"Christmas week"};
const MONTH_ABBR=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
function bandLabel(si,b){
  const r=SEASONS[2027][si].r, [a,z]=r[Math.min(Math.max(0,b|0),r.length-1)];
  const m1=Math.floor(a/100)-1, d1=a%100, m2=Math.floor(z/100)-1, d2=z%100;
  const dates=MONTH_ABBR[m1]+" "+d1+"–"+(m1===m2?"":MONTH_ABBR[m2]+" ")+d2;
  const h=HOLIDAY_BANDS[a+"-"+z];
  return h?dates+" · "+h:dates;
}
// Every date range of every season, in calendar order, for the trip picker.
const BAND_OPTIONS=SEASONS[2027].flatMap((s,si)=>s.r.map(([a],b)=>({si,b,a})))
  .sort((x,y)=>x.a-y.a);
const bandCount=si=>SEASONS[2027][si].r.length;

/* Nightly cash rate for a point-chart band, from the published tables: every
   day of the band is priced on the cash band it falls in, then averaged —
   weeknights and weekends separately, since Disney prices them apart. Nets
   out the tax the tables include. Memoised: the listing scorer calls this for
   every listing on the board. */
const dayOfYear=md=>Math.round((new Date(2027,Math.floor(md/100)-1,md%100)-new Date(2027,0,1))/864e5);
const CASH_DAYS=CASH_RATES.map(table=>table.map(([a,z,p])=>({
  a:dayOfYear(a), z:dayOfYear(z),
  week:p.length===3?(4*p[0]+p[1])/5:p[0],
  wknd:p[p.length-1]
})));
const bandRateMemo={};
function bandRates(ri,si,b){
  const key=ri+"."+si+"."+b;
  if(bandRateMemo[key]) return bandRateMemo[key];
  const [a,z]=SEASONS[2027][si].r[Math.min(Math.max(0,b|0),bandCount(si)-1)];
  const table=CASH_DAYS[ri];
  let wk=0, we=0, n=0;
  for(let d=dayOfYear(a);d<=dayOfYear(z);d++){
    // Days before the first published band (1-19 January) take the first band.
    const band=table.find(x=>d>=x.a&&d<=x.z)||table[0];
    wk+=band.week; we+=band.wknd; n++;
  }
  return bandRateMemo[key]={week:wk/n/(1+ROOM_TAX), wknd:we/n/(1+ROOM_TAX)};
}
/* Pre-tax, pre-discount nightly rates for a trip. A rate the reader typed on
   the trip wins and applies to every night; otherwise the published studio
   rate for the trip's dates. */
function cashForTrip(ri,t){
  if(t.rate>0) return {week:t.rate, wknd:t.rate, own:true};
  return {...bandRates(ri,t.si,t.b), own:false};
}
// Gross cash for a trip's nights before discount and tax.
const tripGross=(ri,t)=>{ const c=cashForTrip(ri,t); return t.week*c.week+t.wknd*c.wknd; };

/* A preset is "on" only while every trip still carries its discount. Editing
   one trip's discount by hand breaks the match and un-presses the chip, which
   is the honest state: the list no longer reflects that preset. */
function syncPresetChips(){
  const uniform=trips.length&&trips.every(t=>(t.disc||0)===(trips[0].disc||0))?(trips[0].disc||0):null;
  document.querySelectorAll(".presets .chip").forEach(c=>
    c.setAttribute("aria-pressed",uniform!==null&&+c.dataset.disc===uniform?"true":"false"));
}

function renderTripRows(){
  syncPresetChips();
  el("tripsBody").innerHTML=trips.map((tr,i)=>
    "<tr>"+
      "<td><select data-idx=\""+i+"\" data-f=\"si\">"+BAND_OPTIONS.map(o=>
        "<option value=\""+o.si+"."+o.b+"\""+(o.si===tr.si&&o.b===(tr.b||0)?" selected":"")+">"+bandLabel(o.si,o.b)+"</option>").join("")+"</select></td>"+
      "<td data-l=\"Nights\"><input type=\"number\" data-idx=\""+i+"\" data-f=\"nights\" value=\""+tr.nights+"\" min=\"1\" max=\"14\" step=\"1\"></td>"+
      "<td data-l=\"Weekend\"><input type=\"number\" data-idx=\""+i+"\" data-f=\"wknd\" value=\""+tr.wknd+"\" min=\"0\" max=\""+tr.nights+"\" step=\"1\"></td>"+
      "<td data-l=\"Discount %\"><input type=\"number\" data-idx=\""+i+"\" data-f=\"disc\" value=\""+(tr.disc||0)+"\" min=\"0\" max=\"60\" step=\"5\">"+
        (NO_DISCOUNT_SEASONS.includes(tr.si)&&(tr.disc||0)>0
          ? "<span class=\"disc-void\" title=\"Disney's resident and passholder discounts do not apply in this season\">not offered</span>" : "")+"</td>"+
      "<td data-l=\"Cash $/night\"><input type=\"number\" data-idx=\""+i+"\" data-f=\"rate\" value=\""+(tr.rate>0?tr.rate:"")+"\" min=\"0\" step=\"10\" title=\"Blank uses the published studio rate for these dates\"></td>"+
      "<td><button class=\"btn-remove\" data-idx=\""+i+"\" title=\"Remove trip\">&times;</button></td>"+
    "</tr>").join("");
  el("tripsBody").querySelectorAll("select,input").forEach(inp=>{
    inp.addEventListener("input",()=>{
      const idx=+inp.dataset.idx, f=inp.dataset.f, tr=trips[idx];
      if(f==="si"){
        // The option value is "season.band"; a bare season means its first band.
        const [si,b]=String(inp.value).split(".").map(x=>parseInt(x,10));
        tr.si=clamp(si||0,0,SEASONS[2027].length-1);
        tr.b=clamp(b||0,0,bandCount(tr.si)-1);
      } else {
        tr[f]=+inp.value;
      }
      /* Clamp both directions, not just when nights changes. Editing weekend
         nights directly could push wknd past nights: the maths clamped it on
         read, but the row kept displaying the impossible value and encodeTrips
         baked it into the shared link, so sender and recipient disagreed.
         Correct the offending field in place rather than calling
         renderTripRows(), which would rebuild the table and drop focus
         mid-keystroke. */
      if(f==="nights"){
        tr.nights=clamp(tr.nights||1,1,14);
        tr.wknd=Math.min(tr.wknd,tr.nights);
        const w=el("tripsBody").querySelector('input[data-idx="'+idx+'"][data-f="wknd"]');
        if(w){ w.max=String(tr.nights); if(+w.value>tr.nights) w.value=String(tr.wknd); }
      }
      if(f==="wknd"){
        tr.wknd=clamp(tr.wknd||0,0,tr.nights);
        if(+inp.value>tr.nights) inp.value=String(tr.wknd);
      }
      if(f==="disc") tr.disc=clamp(tr.disc||0,0,60);
      if(f==="rate") tr.rate=tr.rate>0?clamp(tr.rate,1,1e5):0;
      // The "not offered" marker depends on season and discount together.
      if(f==="si"||f==="disc") renderTripRows();
      renderAll();
    });
  });
  el("tripsBody").querySelectorAll(".btn-remove").forEach(btn=>{
    btn.addEventListener("click",()=>{
      if(trips.length<=1) return;
      trips.splice(+btn.dataset.idx,1);
      renderTripRows(); renderAll();
    });
  });
}

function tripShape(){
  return trips.map(tr=>{
    const nights=Math.max(1,tr.nights||1);
    const wknd=Math.min(nights,Math.max(0,tr.wknd||0));
    const si=tr.si||0, b=clamp(tr.b||0,0,bandCount(si)-1);
    const asked=Math.min(0.9,Math.max(0,(tr.disc||0)/100));
    // A discount the user entered for a peak week is not one Disney offers.
    const disc=NO_DISCOUNT_SEASONS.includes(si)?0:asked;
    const rate=tr.rate>0?clamp(tr.rate,1,1e5):0;
    return {nights, wknd, week:nights-wknd, si, b, disc, asked, rate, discBlocked:asked>0&&disc===0};
  });
}
function tripPoints(){
  const all=tripShape(), ri=+el("resort").value;
  const ci=Math.min(Math.max(0,+el("unit").value||0),CHARTS[ri].cols.length-1);
  const ch=chartFor(ri,2027);
  let year=0, nightsYear=0;
  const perTrip=all.map(t=>{
    const per=t.week*ch[t.si][0][ci]+t.wknd*ch[t.si][1][ci];
    year+=per; nightsYear+=t.nights;
    return {...t, ci, per};
  });
  return {trips:perTrip, ci, year, nightsYear, disc:all[0].disc,
          size:Math.max(25,Math.ceil(year/25)*25)};
}
function syncSize(){
  const auto=el("ptsAuto").checked;
  el("points").disabled=auto;
  el("points").style.opacity=auto?".6":"1";
  if(auto) el("points").value=tripPoints().size;
}
function renderTrips(){
  const t=tripPoints(), ri=+el("resort").value, r=RESORTS[ri];
  const [room,view]=CHARTS[ri].cols[t.ci].split("|");
  const isStudio=t.ci===studioCol(ri);
  let unpriced=0;
  const tripLines=t.trips.map((tr,i)=>{
    const sn=bandLabel(tr.si,tr.b);
    const c=cashForTrip(ri,tr);
    const night=tripGross(ri,tr)*(1-tr.disc)/tr.nights;
    if(!c.own&&!isStudio) unpriced++;
    return "<div class=\"cline\"><span>Trip "+(i+1)+" &mdash; "+tr.nights+"n, "+sn+
      "<small class=\"meta\" style=\"display:block\">cash "+money(Math.round(night))+"/night"+(tr.disc>0?" after "+Math.round(tr.disc*100)+"% off":"")+
      ", before tax"+(c.own?" &mdash; your rate":"")+"</small></span>"+
      "<span>"+tr.per+" pts</span></div>";
  }).join("");
  /* The blank rate field shows what it would use, so the reader can see the
     published figure before deciding to type over it. Refreshed here rather
     than in renderTripRows because it changes with the resort, not the trip. */
  el("tripsBody").querySelectorAll('input[data-f="rate"]').forEach(inp=>{
    const tr=t.trips[+inp.dataset.idx]; if(!tr) return;
    const r=bandRates(ri,tr.si,tr.b);
    inp.placeholder=Math.round((tr.week*r.week+tr.wknd*r.wknd)/tr.nights);
  });
  el("tripOut").innerHTML=
    "<div class=\"stayhead\">"+
      "<div class=\"staypts\">"+
        "<span class=\"big\">"+t.year+"</span>"+
        "<span class=\"big-unit\">points a year for "+t.trips.length+" trip"+(t.trips.length===1?"":"s")+" ("+t.nightsYear+" nights) in a "+room.toLowerCase()+(view?", "+view.toLowerCase()+" view":"")+"</span>"+
      "</div>"+
      "<div class=\"staycost\">"+
        "<h4>"+plain(r.name)+" &mdash; trip breakdown</h4>"+
        tripLines+
        "<div class=\"cline\" style=\"border-top:1px solid var(--line);margin-top:6px;padding-top:8px;font-weight:700\"><span>Total points per year</span><span>"+t.year+"</span></div>"+
        "<div class=\"cline\"><span>Contract size this needs</span><span>"+t.size+" points</span></div>"+
        "<div class=\"cline\"><span>A banked point is worth here</span><span>"+money2(bankedValue(ri))+"</span></div>"+
      "</div>"+
    "</div>"+
    (unpriced?"<div class=\"staywarn\">The published rates on hand are for the <strong>studio</strong> at this resort, and you chose a "+room.toLowerCase()+(view?", "+view.toLowerCase()+" view":"")+
      ". "+unpriced+" of your trips "+(unpriced===1?"is":"are")+" priced at the studio rate &mdash; look up this room for your dates and type the rate on each trip.</div>":"");
}

/* The representative studio, used as the cash-rate baseline and as the
   denominator for a banked point's worth. "Value" and "Club Level" are skipped:
   Value is a scarce cut-price category at Animal Kingdom that Disney does not
   even publish a cash rate for, and Club Level is an upcharge — taking either
   as the baseline misprices every banked point at that resort. */
function studioCol(ri){
  const c=CHARTS[ri].cols;
  const plain=x=>/^(Deluxe |Longhouse Deluxe )?Studio/.test(x)&&!/\|(Value|Club Level)/.test(x);
  let i=c.findIndex(plain);
  if(i<0) i=c.findIndex(x=>/^Deluxe Studio/.test(x));
  if(i<0) i=c.findIndex(x=>/Studio|Cabin/.test(x));
  return i<0?0:i;
}

/* What one banked point is worth at a given resort: the cash you avoid on a night,
   divided by the points that night costs. Derived from the trip shape and discount
   set in the cash comparison — never entered by hand, because it is not a preference. */
function bankedValue(ri){
  const all=tripShape();
  const ci=studioCol(ri), ch=chartFor(ri,2027);
  let totalPts=0, totalCash=0, totalNights=0;
  for(const t of all){
    const pts=t.week*ch[t.si][0][ci]+t.wknd*ch[t.si][1][ci];
    // What a point saves is the cash avoided, tax included — points are exempt.
    // Always the published studio rate: an override is for the room chosen in
    // step 1, and a banked point is denominated in studio nights.
    const r=bandRates(ri,t.si,t.b);
    const cash=(t.week*r.week+t.wknd*r.wknd)*(1-t.disc)*(1+ROOM_TAX);
    totalPts+=pts; totalCash+=cash; totalNights+=t.nights;
  }
  return totalPts>0?totalCash/totalPts:0;
}

function renderCash(){
  const ri=+el("resort").value, r=RESORTS[ri], i=inputs();
  const t=tripPoints();
  const disc=t.disc, ptsYear=t.year, nightsYear=t.nightsYear;
  const size=Math.max(25,+el("points").value||t.size);

  const y=yearsLeft(r.exp);
  const uR=r.resale===null?null:costPerPointYear(r.resale,i.cR,size,r.dues,y,i.g).total;
  const uD=costPerPointYear(r.direct,i.cD,size,r.dues,y,i.g).total;
  const duesOnly=avgDues(r.dues,y,i.g);

  /* Each trip carries its own discount, and peak-season trips carry none
     regardless of what was entered. Aggregate the actual per-trip cash rather
     than applying one blended rate across seasons that price differently. */
  let annCash=0; let annCashUndisc=0, blocked=0;
  for(const tr of t.trips){
    const gross=tripGross(ri,tr);
    /* Tax lands on the discounted rate, not the rack rate, and only a cash
       booking pays it — a stay on points, owned or rented, is exempt at these
       resorts. Omitting it flattered cash by 12.5% against both alternatives. */
    annCash+=gross*(1-tr.disc)*(1+ROOM_TAX);
    annCashUndisc+=gross*(1+ROOM_TAX);
    if(tr.discBlocked) blocked++;
  }
  // Effective discount across the whole year, for display only.
  const effDisc=annCashUndisc>0?1-annCash/annCashUndisc:0;

  /* Renting points from an existing owner is the third real option and the
     only one that needs no capital, carries no dues obligation and no resale
     risk. Leaving it out overstated the case for buying to anyone unsure they
     would use the points every year. */
  const rentPP=Math.max(1,+el("tRent").value||1);

  /* Today's dollars throughout. Cash and rental are flat at this year's rate;
     ownership carries the purchase plus dues at their real growth rate, so the
     four panels are directly comparable and none of them is a number nobody
     will ever pay. */
  const annCashToday=annCash;
  const annRent=ptsYear*rentPP;

  const rentNight=nightsYear>0?annRent/nightsYear:0;
  const cashNight=nightsYear>0?annCash/nightsYear:0;
  const ownNightR=uR===null?null:ptsYear*uR/nightsYear;
  const ownNightD=ptsYear*uD/nightsYear;
  /* What a night actually costs an existing owner THIS year, so it uses this
     year's dues rather than the deed average. */
  const marginal=ptsYear*r.dues/nightsYear;

  const annR=ownNightR===null?null:ownNightR*nightsYear;
  const annD=ownNightD*nightsYear;
  const ownAnnual=annR===null?annD:annR;
  const gap=annCash-ownAnnual;
  const ppp=r.resale===null?r.direct:r.resale, closing=r.resale===null?i.cD:i.cR;
  const upfront=ppp*size+closing;

  /* Break-even, both ways in: a cumulative ledger for a resale buyer and a
     direct buyer against the same cash bill. The two routes differ only in
     the purchase price, so they share dues and part ways only at year zero. */
  const beMax=Math.max(1,Math.ceil(y));
  const routes=[
    r.resale!==null?{k:"R",label:"resale",upfront:r.resale*size+i.cR}:null,
    {k:"D",label:"direct",upfront:r.direct*size+i.cD}
  ].filter(Boolean);
  const beAll=[], beYear={};
  let cCash=0; const cOwn={};
  routes.forEach(x=>{ cOwn[x.k]=x.upfront; });
  for(let bt=1;bt<=beMax;bt++){
    const dues=size*r.dues*Math.pow(1+i.g,bt-1);
    cCash+=annCashToday;
    const row={t:bt,cash:cCash};
    routes.forEach(x=>{
      cOwn[x.k]+=dues; row[x.k]=cOwn[x.k];
      if(beYear[x.k]===undefined&&cOwn[x.k]<=cCash) beYear[x.k]=bt;
    });
    beAll.push(row);
  }
  const bePicks=new Set([1,3,5,10,15,20,30].filter(x=>x<=beMax));
  bePicks.add(beMax);
  routes.forEach(x=>{ const yr=beYear[x.k]; if(yr!==undefined){ bePicks.add(yr); if(yr>1) bePicks.add(yr-1); } });
  const beMilestones=[...bePicks].sort((a,b)=>a-b).map(t=>beAll[t-1]);
  const beEnd=beAll[beAll.length-1];
  const first=routes[0], yrFirst=beYear[first.k];
  const beHead=routes.map(x=>"bought "+x.label+", "+(beYear[x.k]!==undefined?"year "+beYear[x.k]:"never")).join("; ");
  const edge=(m,k)=>{ const d=m.cash-m[k]; return "<td class=\""+(d>=0?"be-pos":"be-neg")+"\">"+(d>=0?"+":"−")+money(Math.round(Math.abs(d)))+"</td>"; };
  const beHTML=
    "<div class=\"breakeven\">"+
      "<div class=\"be-head\">"+
        "<span class=\"big\">"+(yrFirst!==undefined?"Year "+yrFirst:"Never")+"</span>"+
        "<span class=\"big-unit\">"+(yrFirst!==undefined?"when owning pulls ahead of booking cash":"owning never pulls ahead of booking cash within the deed")+
          (routes.length>1?" &mdash; "+beHead:"")+"</span>"+
      "</div>"+
      "<table class=\"be-tbl\">"+
        "<thead><tr><th>After</th><th>Booking cash</th>"+
          routes.map(x=>"<th>Owning, "+x.label+"</th><th>Edge, "+x.label+"</th>").join("")+"</tr></thead>"+
        "<tbody>"+beMilestones.map(m=>{
          const hits=routes.filter(x=>beYear[x.k]===m.t).map(x=>x.label);
          return "<tr"+(hits.length?" class=\"be-row\"":"")+">"+
            "<td>Year "+m.t+(m.t===beMax?" (deed end)":"")+(hits.length?" <small class=\"meta\">"+hits.join(" &amp; ")+" breaks even</small>":"")+"</td>"+
            "<td>"+money(Math.round(m.cash))+"</td>"+
            routes.map(x=>"<td>"+money(Math.round(m[x.k]))+"</td>"+edge(m,x.k)).join("")+
          "</tr>";}).join("")+
        "</tbody>"+
      "</table>"+
      "<div class=\"be-note\">Cumulative spending in today&rsquo;s dollars, "+size+" points"+
        (r.resale!==null?" at "+money2(r.resale)+"/pt resale or ":" at ")+money(r.direct)+"/pt direct"+
        ". Dues start at "+money2(r.dues)+"/pt"+
        (Math.abs(i.g)<0.0005?" and hold steady against room rates":
          " and "+(i.g>0?"outrun":"fall behind")+" room rates by "+(Math.abs(i.g)*100).toFixed(1)+"% a year")+
        "; cash is flat at this year&rsquo;s rate. Every year after a crossover is money you would otherwise have handed to the front desk. At deed end in "+r.exp+", cash would have cost "+money(Math.round(beEnd.cash))+"; "+
        routes.map(x=>{ const d=beEnd.cash-beEnd[x.k]; return "owning "+x.label+" "+money(Math.round(beEnd[x.k]))+" ("+(d>=0?money(Math.round(d))+" ahead":money(Math.round(-d))+" behind")+")"; }).join(", ")+"."+
      "</div>"+
    "</div>";

  /* Payback period, not "return on capital". The old wording divided annual
     savings by the purchase price and called the result a yearly return, which
     reads as an investment yield beating an index fund. It is not one: the
     money cannot be withdrawn or reinvested, it is not compounding, and the
     asset it bought amortizes to zero at deed expiry — a fact already priced
     into the very figure being compared. Payback years and lifetime savings
     say the same thing without borrowing the vocabulary of an investment. */
  const payback=gap>0?upfront/gap:null;
  const lifeSave=gap>0?gap*y:null;
  const verdict = gap>0
    ? ["good","Owning wins by <strong>"+money(gap)+"</strong> a year on these assumptions. The <strong>"+money(upfront)+"</strong> you put in takes "+(yrFirst!==undefined?"until <strong>year "+yrFirst+"</strong>":"about <strong>"+payback.toFixed(1)+" years</strong>")+" to pay back, and you only get it out again by selling the contract &mdash; which takes months and is not guaranteed to fetch today&rsquo;s price. Hold it to expiry in "+r.exp+" and the deed is worth nothing, which this figure already accounts for; on these assumptions you would be roughly "+money(lifeSave)+" ahead over that whole span."]
    : ["bad","Booking cash wins by <strong>"+money(-gap)+"</strong> a year here. At this usage the purchase price never earns itself back, and you would be locking up "+money(upfront)+" to spend more per night."];

  const cells=[
    {k:"Own it &mdash; bought resale", v:ownNightR, s:annR===null?"no resale market here":money(annR)+" a year"},
    {k:"Own it &mdash; bought direct", v:ownNightD, s:money(annD)+" a year"},
    {k:"Rent points from an owner", v:rentNight, s:money(annRent)+" a year"},
    {k:"Book it &mdash; cash"+(effDisc>0.0005?" at "+(effDisc*100).toFixed(0)+"% off":", no discount")+", plus tax", v:cashNight, s:money(annCash)+" a year"}
  ];
  const low=Math.min(...cells.filter(c=>c.v!==null).map(c=>c.v));
  // Ownership spreads the purchase over the deed; the others are simply this year's price.
  const ownNote=Math.abs(i.g)<0.0005?"purchase spread over "+y.toFixed(0)+" years, plus dues":
    "purchase spread over "+y.toFixed(0)+" years, plus dues "+(i.g>0?"outrunning":"trailing")+" room rates by "+(Math.abs(i.g)*100).toFixed(1)+"%/yr";
  el("cashOut").innerHTML=
    "<div class=\"duel\">"+cells.map((c,idx)=>
      "<div class=\"side"+(c.v!==null&&Math.abs(c.v-low)<0.01?" win":"")+"\">"+
        "<h3>"+c.k+"</h3>"+
        "<span class=\"big\">"+(c.v===null?"&mdash;":money(Math.round(c.v)))+"</span>"+
        "<span class=\"sub2\">per night, in today&rsquo;s dollars<br>"+c.s+
          (idx<2&&c.v!==null?"<br><span class=\"yr1\">"+ownNote+"</span>":"")+"</span>"+
        (c.v!==null&&Math.abs(c.v-low)<0.01?"<span class=\"tagwin\">CHEAPEST</span>":"")+
      "</div>").join("")+"</div>"+
    "<div class=\"staywarn "+verdict[0]+"\">"+verdict[1]+" Dues only this year, once you already own: <strong>"+money(marginal)+"</strong> a night.</div>"+
    beHTML+(blocked?"<div class=\"staywarn\"><strong>"+blocked+" of your "+t.trips.length+" trips fall in a peak week</strong> &mdash; Easter and the Christmas fortnight. Disney&rsquo;s resident and passholder discounts effectively vanish then, so those trips are priced here at the full rate no matter what discount you entered. Points cost the same premium whenever you go, which is exactly when ownership is worth most.</div>":"")+
    "<div class=\"staywarn\">If your family would be happy at a moderate resort, that is roughly "+money(Math.round(annCashUndisc/nightsYear*0.55*(1-effDisc)))+" a night after the same discount &mdash; no villa contract beats it.</div>";
}

/* The same trip shape run against every resort at once. Each resort is priced
   in its own representative studio with its own rack rate, so the row-to-row
   differences come from the point chart, dues and purchase price — the things
   that actually distinguish one home resort from another. */
let compKey="beYear", compDir=1;
function renderComparison(){
  const i=inputs(), all=tripShape();
  let nightsYear=0;
  for(const t of all) nightsYear+=t.nights;

  const rows=RESORTS.map((r,ri)=>{
    const ci=studioCol(ri), ch=chartFor(ri,2027), y=yearsLeft(r.exp);
    let ptsYear=0;
    for(const t of all) ptsYear+=t.week*ch[t.si][0][ci]+t.wknd*ch[t.si][1][ci];
    const size=Math.max(25,Math.ceil(ptsYear/25)*25);
    const ppp=r.resale!==null?r.resale:r.direct;
    const closing=r.resale!==null?i.cR:i.cD;
    const upfront=ppp*size+closing;

    // A typed rate belongs to the resort it was looked up for; elsewhere the table.
    const sel=ri===+el("resort").value;
    let annCashToday=0;
    for(const t of all){
      const c=sel?cashForTrip(ri,t):bandRates(ri,t.si,t.b);
      annCashToday+=(t.week*c.week+t.wknd*c.wknd)*(1-t.disc)*(1+ROOM_TAX);
    }
    const annCash=annCashToday;
    const ownAnnual=ptsYear*costPerPointYear(ppp,closing,size,r.dues,y,i.g).total;
    const cashNight=nightsYear>0?annCash/nightsYear:0;
    const ownNight=nightsYear>0?ownAnnual/nightsYear:0;
    const gap=annCash-ownAnnual;

    const beMax=Math.max(1,Math.ceil(y));
    let cOwn=upfront, cCash=0, beYear=null;
    for(let bt=1;bt<=beMax;bt++){
      cOwn+=size*r.dues*Math.pow(1+i.g,bt-1);
      cCash+=annCashToday;
      if(beYear===null&&cOwn<=cCash) beYear=bt;
    }
    return {ri,name:plain(r.name),modeLabel:r.modeLabel,yrs:y,ptsYear,size,upfront,
      ownNight,cashNight,gap,beYear,lifetime:cCash-cOwn,restricted:r.restricted,resale:r.resale};
  });

  rows.sort((a,b)=>{
    const av=a[compKey], bv=b[compKey];
    if(av===null&&bv===null) return 0;
    if(av===null) return 1; if(bv===null) return -1;
    return typeof av==="string"?av.localeCompare(bv)*compDir:(av-bv)*compDir;
  });

  el("compareBody").innerHTML=rows.map(r=>{
    const wins=r.gap>0;
    return "<tr>"+
      "<td>"+r.name+"<span class=\"meta\" style=\"display:block;white-space:normal\">"+r.modeLabel+
        (r.restricted?" &middot; resale books here only":"")+"</span></td>"+
      "<td>"+r.yrs.toFixed(0)+"</td>"+
      "<td>"+r.ptsYear+"</td>"+
      "<td>"+money(r.upfront)+"</td>"+
      "<td class=\""+(wins?"save":"")+"\">"+money(Math.round(r.ownNight))+"</td>"+
      "<td>"+money(Math.round(r.cashNight))+"</td>"+
      "<td class=\""+(wins?"save":"na")+"\">"+(wins?"+":"−")+money(Math.round(Math.abs(r.gap)))+"</td>"+
      "<td"+(r.beYear===null?" class=\"na\"":"")+">"+(r.beYear!==null?"Year "+r.beYear:"Never")+"</td>"+
      "<td class=\""+(r.lifetime>=0?"save":"na")+"\">"+(r.lifetime>=0?"+":"−")+money(Math.round(Math.abs(r.lifetime)))+"</td>"+
    "</tr>";
  }).join("");

  el("compareFoot").innerHTML="Today&rsquo;s dollars, each resort&rsquo;s studio at Disney&rsquo;s published rates for your dates. Resale pricing where a market exists, direct otherwise; contract size rounds up to the next 25 points. A rate you typed on a trip applies only to your selected resort.";

  document.querySelectorAll("#compare thead th").forEach(th=>{
    const a=th.querySelector(".arrow"); if(!a) return;
    a.innerHTML=th.dataset.c===compKey?(compDir===1?"&#9652;":"&#9662;"):"&#9662;";
    a.style.opacity=th.dataset.c===compKey?"1":".4";
  });
}

const MONTH_SHORT=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

/* The year on Disney's chart. Each segment is a real date band from the
   2027 point chart, sized by its day count and shaded by what one weeknight
   costs in the chosen room; the reader's trips are pinned to the longest band
   of their season. It is the page's thesis drawn rather than stated: the same
   room is a different price depending on where in the year you stand. */
function renderHero(){
  const ri=+el("resort").value, r=RESORTS[ri], yr=2027;
  const ci=Math.min(Math.max(0,+el("unit").value||0),CHARTS[ri].cols.length-1);
  const ch=chartFor(ri,yr);
  const day=md=>Math.round((new Date(yr,Math.floor(md/100)-1,md%100)-new Date(yr,0,1))/864e5);
  const segs=[];
  SEASONS[yr].forEach((s,si)=>s.r.forEach(([a,z],b)=>segs.push({si,b,a:day(a),b2:day(z)+1})));
  segs.sort((x,y)=>x.a-y.a);
  const total=segs[segs.length-1].b2;
  const pts=si=>ch[si][0][ci];
  const lo=Math.min(...segs.map(s=>pts(s.si))), hi=Math.max(...segs.map(s=>pts(s.si)));
  const t=si=>hi===lo?0.4:(pts(si)-lo)/(hi-lo);

  // Trips pin to the exact date band they name, keyed "season.band".
  const byBand={};
  tripShape().forEach(tr=>{ const k=tr.si+"."+tr.b; (byBand[k]=byBand[k]||[]).push(tr); });

  const strip=segs.map(s=>
    "<div class=\"ys-seg\" style=\"width:"+((s.b2-s.a)/total*100).toFixed(3)+"%;background:rgba(var(--shade-rgb),"+
      (0.08+0.54*t(s.si)).toFixed(3)+")\" title=\""+bandLabel(s.si,s.b)+": "+pts(s.si)+" points a weeknight\"></div>").join("");

  const W=el("hero").clientWidth||1000;

  /* Pins sit in a layer over the strip rather than inside their band: a
     Christmas-week band is eight days wide and a pill is wider than that,
     so a pin clipped to its band lost its label. Clamped to the strip. */
  const narrow=W<720;
  const pinList=segs.flatMap(s=>{
    const list=byBand[s.si+"."+s.b]||[];
    return list.map((tr,j)=>{
      const text=narrow?tr.nights+"n":tr.nights+" night"+(tr.nights===1?"":"s");
      const w=text.length*6.6+22;
      const x=(s.a+(s.b2-s.a)*(j+1)/(list.length+1))/total*W;
      return {text,w,left:Math.max(0,Math.min(W-w,x-w/2))};
    });
  });
  // Neighbouring pins push each other apart; the last one yields to the edge.
  for(let k=1;k<pinList.length;k++){
    const p=pinList[k-1], q=pinList[k];
    if(q.left<p.left+p.w+4) q.left=p.left+p.w+4;
  }
  for(let k=pinList.length-1;k>0;k--){
    const p=pinList[k-1], q=pinList[k];
    if(q.left+q.w>W) q.left=W-q.w;
    if(p.left+p.w+4>q.left) p.left=Math.max(0,q.left-p.w-4);
  }
  const pins=pinList.map(p=>"<span class=\"ys-trip\" style=\"left:"+p.left.toFixed(0)+"px\">"+p.text+"</span>").join("");

  /* A month ruler makes the strip read as a calendar; the bands themselves
     are listed beneath it in order, each with its swatch. Labels pinned to
     bands were tried and read as scatter: Thanksgiving is three days wide. */
  const months=MONTH_SHORT.map((m,i)=>
    "<span style=\"width:"+(new Date(yr,i+1,0).getDate()/total*100).toFixed(3)+"%\">"+m+"</span>").join("");
  const [room,view]=CHARTS[ri].cols[ci].split("|");
  const n=trips.length;
  el("hero").innerHTML=
    "<div class=\"ys-wrap\"><div class=\"yearstrip\">"+strip+"</div><div class=\"ys-pins\">"+pins+"</div></div>"+
    "<div class=\"ys-months\">"+months+"</div>"+
    "<p class=\"ys-cap\">Your "+n+" trip"+(n===1?"":"s")+" on the 2027 point chart for a "+room.toLowerCase()+(view?", "+view.toLowerCase()+" view":"")+
      " at "+plain(r.name)+". Darker bands cost more points a night, "+lo+" to "+hi+" <span class=\"ys-key\"><i></i></span>; hover a band for its dates.</p>";
}

/* Render a season's real date bands from the chart data, so headers can never
   drift out of step with the pricing. */
function bandDates(si,yr){
  return SEASONS[yr][si].r.map(([a,b])=>{
    const m1=Math.floor(a/100)-1, d1=a%100, m2=Math.floor(b/100)-1, d2=b%100;
    return MONTH_SHORT[m1]+" "+d1+"&ndash;"+(m1===m2?d2:MONTH_SHORT[m2]+" "+d2);
  }).join(", ");
}

/* Points for an N-night stay beginning on a given date, or null if any night
   falls outside the published charts. */
function stayPoints(ri,ci,start,n){
  let tot=0;
  for(let k=0;k<n;k++){
    const d=new Date(start.getFullYear(),start.getMonth(),start.getDate()+k);
    const si=seasonIndex(d);
    if(si<0) return null;
    const wknd=(d.getDay()===5||d.getDay()===6);
    tot+=chartFor(ri,d.getFullYear())[si][wknd?1:0][ci];
  }
  return tot;
}

function renderWhen(){
  const ri=+el("resort").value, r=RESORTS[ri], i=inputs();
  const ci=Math.min(Math.max(0,+el("unit").value||0),CHARTS[ri].cols.length-1);
  const mode=el("wMode").value, byMonth=el("wCols").value==="m";
  const start=parseDate(el("checkin").value);
  const nSel=Math.min(14,Math.max(1,+el("nights").value||1));
  let day=+el("wStart").value;
  if(day===-2) day=start?start.getDay():-1;
  const maxN=Math.min(14,Math.max(2,+el("wMax").value||7,nSel));
  const hotCol=start?(byMonth?start.getMonth():seasonIndex(start)):-1;
  const y=yearsLeft(r.exp);
  const unit=r.resale===null
    ? costPerPointYear(r.direct,i.cD,+el("points").value||150,r.dues,y,i.g).total
    : costPerPointYear(r.resale,i.cR,+el("points").value||150,r.dues,y,i.g).total;

  // one cell = every eligible check-in date in that column, priced as an n-night stay
  const cell=(colIdx,n)=>{
    const vals=[];
    for(let m=0;m<12;m++){
      const dim=new Date(2027,m+1,0).getDate();
      for(let d=1;d<=dim;d++){
        const start=new Date(2027,m,d);
        if(byMonth ? m!==colIdx : seasonIndex(start)!==colIdx) continue;
        if(day>=0 && start.getDay()!==day) continue;
        const p=stayPoints(ri,ci,start,n);
        if(p!==null) vals.push(p);
      }
    }
    if(!vals.length) return null;
    return {lo:Math.min(...vals), hi:Math.max(...vals),
            avg:vals.reduce((a,b)=>a+b,0)/vals.length, n:vals.length};
  };

  const heads=byMonth?MONTH_SHORT:SEASON_SHORT;
  const grid=[];
  for(let n=1;n<=maxN;n++) grid.push(heads.map((_,c)=>cell(c,n)));
  const pick=v=>mode==="cheap"?v.lo:v.avg;
  const flat=grid.flat().filter(v=>v!==null).map(pick);
  const lo=Math.min(...flat), hi=Math.max(...flat);

  el("whenHead").innerHTML="<tr><th>Nights</th>"+heads.map((x,c)=>
    "<th"+(c===hotCol?" style=\"background:var(--lagoon)\"":"")+">"+x+
    (byMonth?"":"<span style=\"display:block;font-weight:400;opacity:.75;font-size:.66rem;margin-top:3px\">"+bandDates(c,2027)+"</span>")+
    "</th>").join("")+"</tr>";
  el("whenBody").innerHTML=grid.map((row,idx)=>{
    const n=idx+1;
    return "<tr><td>"+n+" night"+(n>1?"s":"")+"</td>"+row.map((v,c)=>{
      const hot=(c===hotCol&&n===nSel);
      if(v===null) return "<td class=\"na\""+(hot?" style=\"outline:2px solid var(--lagoon);outline-offset:-2px\"":"")+">&mdash;</td>";
      const t=hi===lo?0.3:(pick(v)-lo)/(hi-lo);
      const wide=v.hi/v.lo>1.12;
      const txt = mode==="cost" ? money(v.avg*unit)
                : mode==="range" ? (v.lo===v.hi?Math.round(v.lo):Math.round(v.lo)+"&ndash;"+Math.round(v.hi))
                : mode==="cheap" ? Math.round(v.lo)
                : Math.round(v.avg)+(wide?"<span style=\"color:var(--rust);font-weight:700\">*</span>":"");
      return "<td title=\""+BANDS[Math.min(BANDS.length-1,Math.floor(t*BANDS.length))]+"\" style=\"background:rgba(var(--shade-rgb),"+(0.05+0.30*t).toFixed(3)+")"+
        (hot?";outline:3px solid var(--lagoon);outline-offset:-3px;font-weight:700":"")+"\">"+txt+"</td>";
    }).join("")+"</tr>";
  }).join("");

  const [room,view]=CHARTS[ri].cols[ci].split("|");
  const dn=day<0?"averaged across every check-in day":"checking in on a "+["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][day];
  const hl=hotCol>=0?" Your "+nSel+"-night stay from "+el("checkin").value+" is outlined.":"";
  el("whenNote").innerHTML=
    (mode==="cost"?"What the stay costs you as an owner, at "+money2(unit)+" per point-year":
     mode==="cheap"?"Points for the stay, taking the cheapest start date available":
     mode==="range"?"Points for the stay, cheapest to priciest start date":
     "Points for the stay, averaged over every eligible start date")+
    " &mdash; "+room.toLowerCase()+(view?", "+view.toLowerCase()+" view":"")+" at "+plain(r.name)+", "+dn+
    ". 2027 chart. Blank cells run past the published chart. "+
    (byMonth
      ? "<strong>Months are not pricing periods.</strong> Disney&rsquo;s seasons cut mid-month &mdash; season 6 ends 20 March and season 7 runs only 21&ndash;28 March &mdash; so a monthly figure can average two very different prices. An asterisk marks a column where the cheapest and priciest start differ by more than 12%; switch the columns to point-chart seasons, or to the cheapest-to-priciest view, to see it."
      : "These are Disney&rsquo+shadeKey();s actual pricing bands, so every start date inside a column carries the same nightly rate. Variation left within a column comes only from which weekdays the stay covers.")+hl;
}

let rankKey="score", rankDir=-1;

function scoreListings(){
  const i=inputs();
  const rows=LISTINGS.map(L=>{
    const [ri,id,pts,a26,a27,uy,ppp]=L;
    const r=RESORTS[ri], y=yearsLeft(r.exp);
    const delta=(a26-pts)+(a27-pts);
    const eff=(pts*ppp-delta*bankedValue(ri))/pts;
    const allin=costPerPointYear(eff,i.cR,pts,r.dues,y,i.g).total;
    return {ri,id,pts,a26,a27,uy,ppp,delta,eff,allin,
      resort:plain(r.name), cash:pts*ppp+i.cR, rofr:ROFR[ri],
      vs:r.resale===null?0:(eff/r.resale-1)*100};
  });
  const rng=(k,inv)=>{const a=rows.map(x=>x[k]),lo=Math.min(...a),hi=Math.max(...a);
    return x=>hi===lo?50:100*(inv?(hi-x[k])/(hi-lo):(x[k]-lo)/(hi-lo));};
  const fC=rng("allin",true), fD=rng("vs",true);
  const b=+el("wBal").value/100;
  rows.forEach(x=>{ x.sCost=fC(x); x.sDeal=fD(x); x.score=(1-b)*x.sCost+b*x.sDeal; });
  return rows;
}

function renderRank(){
  el("wBalV").textContent=el("wBal").value+"% bargain";
  const only=+el("fResort").value, min=+el("fMin").value||0, max=+el("fMax").value||1e9;
  let rows=scoreListings().filter(x=>(only<0||x.ri===only)&&x.pts>=min&&x.cash<=max);
  rows.sort((a,b)=>{
    const x=a[rankKey],y=b[rankKey];
    return (typeof x==="string"?x.localeCompare(y):x-y)*rankDir;
  });
  const top=Math.max(...rows.map(x=>x.score),1);
  el("rankBody").innerHTML=rows.slice(0,60).map(x=>
    "<tr>"+
      "<td class=\"sc\" style=\"background-image:linear-gradient(90deg,var(--lagoon-tint) 0 "+(x.score/top*100).toFixed(0)+"%,transparent "+(x.score/top*100).toFixed(0)+"% 100%)\">"+x.score.toFixed(0)+"</td>"+
      "<td><a href=\"https://www.dvcresalemarket.com/listings/"+SLUG[x.ri]+"/"+x.id.toLowerCase()+"/\" target=\"_blank\" rel=\"noopener\">"+x.resort+"</a><span class=\"meta\">"+x.id+"</span></td>"+
      "<td>"+x.pts+"</td><td>"+x.uy+"</td><td>"+money(x.ppp)+"</td>"+
      "<td>"+money(x.eff)+"</td>"+
      "<td class=\""+(x.vs<0?"pos":"neg")+"\">"+(x.vs>0?"+":"")+x.vs.toFixed(0)+"%</td>"+
      "<td>"+money2(x.allin)+"</td><td>"+money(x.cash)+"</td>"+
      "<td class=\""+(x.rofr>=10?"neg":x.rofr>=4?"":"pos")+"\">"+x.rofr+"%</td>"+
    "</tr>").join("");
  el("rankFoot").innerHTML=rows.length+" listing"+(rows.length===1?"":"s")+" match"+(rows.length===1?"es":"")+
    (rows.length>60?", showing the top 60":"")+
    ". Effective price credits banked points and debits missing ones at each resort&rsquo;s own value &mdash; the cash a point saves you there, derived from the trip shape and discount set above, so a BoardWalk point and a Saratoga point are not treated as equal; &ldquo;vs sold&rdquo; compares it to the August 2026 average for that resort. Resort names link out to the listing &mdash; 43% of the board was already pending when this was captured, so expect some to be gone.";
  document.querySelectorAll("#rank thead th").forEach(th=>{
    const a=th.querySelector(".arrow"); if(!a) return;
    a.innerHTML=th.dataset.r===rankKey?(rankDir===1?"&#9652;":"&#9662;"):"&#9662;";
    a.style.opacity=th.dataset.r===rankKey?"1":".4";
  });
}

/* ---- 2026 and 2027 point charts, Walt Disney World resorts ----
   Season bands are shared across every WDW resort within a year.
   Ranges are MMDD integers. Values are [Sun-Thu, Fri-Sat] per column. */

/* index-aligned with RESORTS. y27 omitted means the 2027 values match 2026. */

const el = id => document.getElementById(id);
const money = n => "$" + n.toLocaleString("en-US",{maximumFractionDigits:0});
const money2 = n => "$" + n.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});
const plain = s => s.replace(/&amp;/g,"&");

function yearsLeft(exp){ return Math.max(0.5,(new Date(exp,0,31)-NOW)/(365.2425*24*3600*1000)); }

/* Dues are billed annually, so every per-year figure counts whole years. Using
   the raw fractional yearsLeft() for the purchase and a rounded count for the
   dues meant levelized(d=0) never quite equalled costPerPointYear, contradicting
   the invariant documented below. Both now use the same whole-year count. */
const dueYears=yrs=>Math.max(1,Math.round(yrs));

function avgDues(dues,yrs,g){
  const n = dueYears(yrs);
  if(g===0) return dues;
  let sum=0; for(let t=0;t<n;t++) sum += dues*Math.pow(1+g,t);
  return sum/n;
}
function costPerPointYear(ppp,closing,pts,dues,yrs,g){
  const n=dueYears(yrs);
  const acq=(ppp*pts+closing)/pts/n, d=avgDues(dues,yrs,g);
  return {acq,dues:d,total:acq+d};
}
/* Levelized cost per point-year: present value of purchase plus all future dues,
   divided by the present-value annuity factor. At a 0% discount rate this reduces
   exactly to the simple amortized figure. */
function levelized(ppp,closing,pts,dues,yrs,g,d){
  const n=dueYears(yrs);
  let pvDues=0, af=0;
  for(let t=0;t<n;t++){ const df=Math.pow(1+d,-t); pvDues+=dues*Math.pow(1+g,t)*df; af+=df; }
  return (ppp + closing/pts + pvDues)/af;
}

/* Clamp to the same bounds the markup advertises. The HTML max attribute is not
   enforced for pasted or scripted values, and both rates are compounded over the
   life of the deed — an unbounded one overflows to Infinity, and the direct-minus-
   resale gap then renders as NaN. Clamp where the untrusted value enters. */
const clamp=(v,lo,hi)=>Math.min(hi,Math.max(lo,v));
/* Everything on the page is in today's dollars. Cash rates and rental rates
   are therefore flat, and the only escalation that survives is the REAL growth
   of dues — how much faster (or slower) they rise than room rates. That is `g`.
   The two nominal inputs stay on screen because people think in nominal terms,
   but only their gap reaches the model: 4.5%/4.5% and 7%/7% are the same
   scenario. A nominal average over four decades was the one number readers
   consistently mistook for a price. */
function inputs(){
  const gNom=clamp((+el("esc").value||0)/100,0,0.12);
  const gRoom=clamp((+el("escRoom").value||0)/100,0,0.12);
  return {
    pts:clamp(+el("points").value||150,1,1000),
    cD:clamp(+el("closeD").value||0,0,1e6),
    cR:clamp(+el("closeR").value||0,0,1e6),
    gNom, gRoom,
    g:(1+gNom)/(1+gRoom)-1,
    d:clamp((+el("disc").value||0)/100,0,0.12)
  };
}

function renderCalc(){
  const r=RESORTS[+el("resort").value], i=inputs(), yrs=yearsLeft(r.exp);
  /* The discount rate now reaches the headline figures. It used to move only
     one column of the comparison table nine sections below, so anyone who set
     it and looked at the big number directly beneath the control saw no change
     and reasonably concluded it had been accounted for. levelized() reduces
     exactly to costPerPointYear at d=0, so the default is unaffected. */
  const D=costPerPointYear(r.direct,i.cD,i.pts,r.dues,yrs,i.g);
  if(i.d>0) D.total=levelized(r.direct,i.cD,i.pts,r.dues,yrs,i.g,i.d);
  el("subD").textContent = plain(r.name)+" \u00B7 "+yrs.toFixed(1)+" years left";
  el("bigD").textContent = money2(D.total);
  el("ppD").textContent = money(r.direct);
  el("upD").textContent = money(r.direct*i.pts+i.cD);
  el("amD").textContent = money2(D.acq)+"/pt";
  el("duD").textContent = money2(D.dues)+"/pt";
  el("yrD").textContent = money(D.total*i.pts);

  const vd=el("verdict");
  if(r.resale===null){
    ["bigR","ppR","upR","amR","duR","yrR"].forEach(id=>el(id).textContent="\u2014");
    el("subR").textContent="No reliable resale market yet";
    vd.className="verdict warn";
    vd.innerHTML="<strong>"+plain(r.name)+"</strong> has too few resale sales to average, and resale contracts here can only ever book these cabins. Direct is effectively the only route, at "+money(D.total*i.pts)+" per year all-in.";
    return;
  }
  const R=costPerPointYear(r.resale,i.cR,i.pts,r.dues,yrs,i.g);
  if(i.d>0) R.total=levelized(r.resale,i.cR,i.pts,r.dues,yrs,i.g,i.d);
  el("subR").textContent="August 2026 average \u00B7 "+yrs.toFixed(1)+" years left";
  el("bigR").textContent=money2(R.total);
  el("ppR").textContent=money2(r.resale);
  el("upR").textContent=money(r.resale*i.pts+i.cR);
  el("amR").textContent=money2(R.acq)+"/pt";
  el("duR").textContent=money2(R.dues)+"/pt";
  el("yrR").textContent=money(R.total*i.pts);

  const gapYear=(D.total-R.total)*i.pts, gapLife=gapYear*yrs;
  const cashGap=(r.direct*i.pts+i.cD)-(r.resale*i.pts+i.cR);
  vd.className="verdict";
  vd.innerHTML =
    "Resale saves <strong>"+money(cashGap)+"</strong> at closing and <strong>"+money(gapYear)+"</strong> a year, about <strong>"+money(gapLife)+"</strong> over the remaining "+yrs.toFixed(0)+" years. "+
    (r.restricted
      ? "But a resale contract here books <strong>"+plain(r.name)+" only</strong> &mdash; no trading at seven months, ever. Price that restriction before you price the savings."
      : "Resale points here still book all fourteen original resorts at seven months; you lose Riviera, Disneyland Hotel, the Fort Wilderness cabins, Lakeshore Lodge, and the blue card discounts.")+
    "<br><br>Put the other way: paying direct costs you an extra <strong>"+money(gapYear)+" every year</strong> for the life of the deed. "+
    (r.restricted
      ? "Here that buys the ability to trade out at seven months, plus the blue card. Everything else is identical."
      : "The rooms, the booking windows and the dues are identical either way, so that premium buys exactly three things: the blue card discounts, the ability to book Riviera and Lakeshore Lodge at seven months, and the option to buy in smaller increments. The discounts alone would have to be worth more than "+money(gapYear)+" a year before direct wins on the numbers.");
}

/* ---------- stay points calculator ---------- */
const DAYNAME=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const MONTH=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function parseDate(v){
  const p=(v||"").split("-").map(Number);
  if(p.length!==3||!p[0]) return null;
  return new Date(p[0],p[1]-1,p[2]);
}
function seasonIndex(d){
  const bands=SEASONS[d.getFullYear()];
  if(!bands) return -1;
  const md=(d.getMonth()+1)*100+d.getDate();
  for(let i=0;i<bands.length;i++)
    for(const [a,b] of bands[i].r) if(md>=a&&md<=b) return i;
  return -1;
}
function chartFor(resortIdx,year){
  const c=CHARTS[resortIdx];
  return (year>=2027 && c.y27) ? c.y27 : c.y26;
}
/* Disney's charts group by room size then view, which is not cost order.
   Sort by average nightly points so the list reads cheapest to priciest,
   keeping the original column index as the option value. */
function sortedCols(ri){
  const ch=chartFor(ri,2027), cols=CHARTS[ri].cols;
  return cols.map((c,ci)=>{
    let sum=0, lo=Infinity, hi=0;
    for(let k=0;k<7;k++){
      sum+=(5*ch[k][0][ci]+2*ch[k][1][ci])/7;
      lo=Math.min(lo,ch[k][0][ci]); hi=Math.max(hi,ch[k][1][ci]);
    }
    return {c,ci,avg:sum/7,lo,hi};
  }).sort((a,b)=>a.avg-b.avg);
}

function fillUnits(){
  const i=+el("resort").value;
  const cur=el("unit").value;
  el("unit").innerHTML=sortedCols(i).map(x=>{
    const [room,view]=x.c.split("|");
    return "<option value=\""+x.ci+"\">"+room+(view?" &mdash; "+view+" view":"")+
      " &middot; "+x.lo+"&ndash;"+x.hi+" pts/night</option>";
  }).join("");
  const n=CHARTS[i].cols.length;
  el("unit").value=String(Math.min(Math.max(0,+cur||0),n-1));
}

function renderStay(){
  const ri=+el("resort").value, r=RESORTS[ri];
  const start=parseDate(el("checkin").value);
  const n=Math.min(30,Math.max(1,+el("nights").value||1));
  const col=Math.min(Math.max(0,+el("unit").value||0),CHARTS[ri].cols.length-1);
  const out=el("stayOut");
  if(!start){ out.innerHTML="<div class=\"staywarn\">Pick a check-in date to price a stay.</div>"; return; }

  const rows=[]; let total=0, unknown=false;
  for(let k=0;k<n;k++){
    const d=new Date(start.getFullYear(),start.getMonth(),start.getDate()+k);
    const s=seasonIndex(d);
    if(s<0){ unknown=true; rows.push({d,season:null,pts:0,wknd:false}); continue; }
    const dow=d.getDay(), wknd=(dow===5||dow===6);
    const pts=chartFor(ri,d.getFullYear())[s][wknd?1:0][col];
    total+=pts;
    rows.push({d,season:SEASONS[d.getFullYear()][s].n,pts,wknd});
  }

  const [room,view]=CHARTS[ri].cols[col].split("|");
  const i=inputs(), yrs=yearsLeft(r.exp);
  const D=costPerPointYear(r.direct,i.cD,i.pts,r.dues,yrs,i.g);
  const R=r.resale===null?null:costPerPointYear(r.resale,i.cR,i.pts,r.dues,yrs,i.g);
  const duesOnly=avgDues(r.dues,yrs,i.g);
  const last=new Date(start.getFullYear(),start.getMonth(),start.getDate()+n);
  const fmt=d=>DAYNAME[d.getDay()]+" "+MONTH[d.getMonth()]+" "+d.getDate();

  let costs =
    "<h4>What those points cost you</h4>"+
    "<div class=\"cline\"><span>Annual dues alone</span><span>"+money(total*duesOnly)+"</span></div>"+
    (R? "<div class=\"cline\"><span>All-in, bought resale</span><span>"+money(total*R.total)+"</span></div>":"")+
    "<div class=\"cline\"><span>All-in, bought direct</span><span>"+money(total*D.total)+"</span></div>"+
    "";

  out.innerHTML =
    "<div class=\"stayhead\">"+
      "<div class=\"staypts\">"+
        "<span class=\"big\">"+(unknown?"&mdash;":total)+"</span>"+
        "<span class=\"big-unit\">points for "+n+" night"+(n>1?"s":"")+", "+room.toLowerCase()+
        (view?", "+view.toLowerCase()+" view":"")+"</span>"+
      "</div>"+
      "<div class=\"staycost\">"+costs+"</div>"+
    "</div>"+
    "<table class=\"nights\"><caption>"+fmt(start)+" to "+fmt(last)+" &middot; check-out is not charged</caption>"+
      "<thead><tr><th>Night</th><th>Season</th><th>Points</th></tr></thead><tbody>"+
      rows.map(x=>"<tr class=\""+(x.wknd?"wknd":"")+"\"><td>"+fmt(x.d)+"</td>"+
        "<td>"+(x.season||"<em>no published chart for "+x.d.getFullYear()+"</em>")+"</td>"+
        "<td>"+(x.season?x.pts:"&mdash;")+"</td></tr>").join("")+
      "</tbody><tfoot><tr><td colspan=\"2\">Total</td><td>"+(unknown?"&mdash;":total)+"</td></tr></tfoot></table>"+
    warnings(start,n,unknown,total,i.pts);
}

function warnings(start,n,unknown,total,owned){
  let w="";
  if(unknown) w+="<div class=\"staywarn bad\">Part of this stay falls outside the published 2026 and 2027 charts. Disney releases the next year&rsquo;s chart each December.</div>";
  const window11=new Date(NOW.getFullYear(),NOW.getMonth()+11,NOW.getDate());
  if(start>window11) w+="<div class=\"staywarn\">This check-in is beyond the 11-month home resort booking window, which currently reaches "+MONTH[window11.getMonth()]+" "+window11.getDate()+", "+window11.getFullYear()+". You could not book it yet.</div>";
  if(!unknown && total>owned) w+="<div class=\"staywarn\">This stay needs "+total+" points and the contract above is "+owned+". You would have to bank the prior year or borrow from the next &mdash; both allowed, but you cannot do it two years running.</div>";
  return w;
}

let sortKey="cR", sortDir=1;
function renderGrid(){
  const i=inputs();
  const rows=RESORTS.map(r=>{
    const yrs=yearsLeft(r.exp);
    return {name:plain(r.name),exp:r.exp,yrs,direct:r.direct,resale:r.resale,dues:r.dues,
      cD:costPerPointYear(r.direct,i.cD,i.pts,r.dues,yrs,i.g).total,
      cR:r.resale===null?null:costPerPointYear(r.resale,i.cR,i.pts,r.dues,yrs,i.g).total,
      lR:r.resale===null?null:levelized(r.resale,i.cR,i.pts,r.dues,yrs,i.g,i.d)};
  });
  rows.sort((a,b)=>{
    let x=a[sortKey],y=b[sortKey];
    if(x===null) return 1; if(y===null) return -1;
    return typeof x==="string" ? x.localeCompare(y)*sortDir : (x-y)*sortDir;
  });
  el("gridBody").innerHTML=rows.map(r=>
    "<tr><td>"+r.name+"</td><td>"+r.exp+"</td><td>"+r.yrs.toFixed(1)+"</td><td>"+money(r.direct)+"</td>"+
    "<td class=\""+(r.resale===null?"na":"")+"\">"+(r.resale===null?"&mdash;":money2(r.resale))+"</td>"+
    "<td>"+money2(r.dues)+"</td><td>"+money2(r.cD)+"</td>"+
    "<td class=\""+(r.cR===null?"na":"save")+"\">"+(r.cR===null?"&mdash;":money2(r.cR))+"</td>"+
    "<td class=\""+(r.lR===null?"na":"")+"\">"+(r.lR===null?"&mdash;":money2(r.lR))+"</td></tr>").join("");
  document.querySelectorAll("#grid thead th").forEach(th=>{
    const a=th.querySelector(".arrow"); if(!a) return;
    a.innerHTML = th.dataset.k===sortKey ? (sortDir===1?"&#9652;":"&#9662;") : "&#9662;";
    a.style.opacity = th.dataset.k===sortKey ? "1" : ".4";
  });
}

const roomTable = rooms =>
  "<table class=\"rooms\"><thead><tr><th>Room</th><th>Sleeps</th><th>Notes</th></tr></thead><tbody>"+
  rooms.map(x=>"<tr><td>"+x[0]+"</td><td>"+x[1]+"</td><td>"+x[2]+"</td></tr>").join("")+"</tbody></table>";

const list = items => "<ul>"+items.map(x=>"<li>"+x+"</li>").join("")+"</ul>";
const diningBlock = groups => groups.map(g=>"<p class=\"cat\">"+g[0]+"</p><ul><li>"+g[1]+"</li></ul>").join("");

function blocks(r){
  return "<div class=\"blocks\">"+
    "<div class=\"block\"><h4>Getting around</h4>"+list(r.transport)+"</div>"+
    "<div class=\"block\"><h4>Food &amp; drink</h4>"+diningBlock(r.dining)+"</div>"+
    "<div class=\"block\"><h4>Amenities</h4>"+list(r.amenities)+"</div>"+
  "</div>";
}

function renderRooms(){
  const main=RESORTS.map((r,i)=>
    "<details class=\"resort\" data-modes=\""+r.modes.join(" ")+"\" data-i=\""+i+"\">"+
      "<summary>"+
        "<span class=\"rname\">"+r.name+"</span>"+
        "<span class=\"modes\">"+r.modeLabel+"</span>"+
        "<span class=\"meta\">Deed ends "+r.exp+" &middot; dues "+money2(r.dues)+"/pt</span>"+
        (r.restricted
          ? "<span class=\"tag\">Resale books this resort only</span>"
          : "<span class=\"tag ok\">Resale trades across the original 14</span>")+
      "</summary>"+
      "<div class=\"rbody\">"+
        "<p class=\"rnote\">"+r.note+"</p>"+
        (r.alert ? "<p class=\"alert\">"+r.alert+"</p>" : "")+
        roomTable(r.rooms)+
        blocks(r)+
      "</div>"+
    "</details>").join("");

  const soon =
    "<details class=\"resort\" data-modes=\"boat bus\">"+
      "<summary>"+
        "<span class=\"rname\">"+UPCOMING.name+"</span>"+
        "<span class=\"modes\">Boat &middot; Bus</span>"+
        "<span class=\"meta\">Opens "+UPCOMING.opens+"</span>"+
        "<span class=\"tag soon\">Not yet on sale</span>"+
      "</summary>"+
      "<div class=\"rbody\">"+
        "<p class=\"rnote\">"+UPCOMING.note+"</p>"+
        roomTable(UPCOMING.rooms)+
        blocks(UPCOMING)+
      "</div>"+
    "</details>";

  el("rooms").innerHTML = main + soon;
}

function applyFilter(mode){
  document.querySelectorAll("#rooms .resort").forEach(d=>{
    const m=(d.dataset.modes||"").split(" ");
    let show;
    if(mode==="all") show=true;
    else if(mode==="busonly") show = m.length===1 && m[0]==="bus";
    else show = m.includes(mode);
    d.hidden=!show;
    if(!show) d.open=false;
  });
}

const RSEL=["resort","resortStay","resortList"];
const ROPTS=RESORTS.map((r,i)=>"<option value=\""+i+"\">"+plain(r.name)+"</option>").join("");
RSEL.forEach(id=>{el(id).innerHTML=ROPTS;el(id).value="9";});
function syncResort(v){
  RSEL.forEach(id=>{if(el(id).value!==v) el(id).value=v;});
  fillUnits(); renderAll();
}

function renderAll(){
  syncSize(); renderHero(); renderTrips(); renderCash(); renderComparison(); renderCalc(); renderGrid();
  renderStay(); renderListing(); renderRank(); renderMatrix(); renderWhen();
  writeURL();
}

/* Every dataset declares its own provenance next to the data itself, in
   data/*.js, so the two cannot drift apart. Rendering it means a reader can
   tell at a glance which figures are transcribed from Disney and which are
   the author's estimates — the distinction that matters most here, because
   the estimated ones sit on screen next to the sourced ones looking equally
   authoritative. */
const DATASETS=[CHARTS_META,RESORTS_META,MARKET_META,ROFR_META,CASH_RATES_META,ROOM_TAX_META];

function renderProvenance(){
  el("provBody").innerHTML=DATASETS.map(m=>
    "<tr>"+
      "<td>"+m.label+"</td>"+
      "<td><span class=\"prov-tag"+(m.estimated?" est":"")+"\">"+(m.estimated?"ESTIMATED":"SOURCED")+"</span>"+
        (m.note?"<span class=\"prov-note\">"+m.note+"</span>":"")+"</td>"+
      "<td>"+m.captured+"</td>"+
      "<td>"+m.source+"</td>"+
    "</tr>").join("");
}

/* ---- shareable URL state ------------------------------------------------
   Scenario inputs serialise to the query string so a configuration can be
   linked. Display-only state (sort order, matrix mode, rank filters) is
   deliberately excluded: that is how you are looking at a scenario rather
   than the scenario itself, and folding it in would mean an incidental
   sort click silently changes the link you are about to share.

   Only values that differ from the page defaults are written, so an
   untouched page keeps a clean URL. Everything read back in is clamped —
   a hand-edited or truncated link degrades to defaults instead of
   rendering garbage. */

const URL_FIELDS=[
  ["u","unit"], ["rn","tRent"], ["er","escRoom"],
  ["p","points"], ["pa","ptsAuto"], ["cd","closeD"], ["cr","closeR"],
  ["es","esc"], ["di","disc"], ["ci","checkin"], ["n","nights"]
];
const URL_DEFAULTS={};
let urlReady=false;

const readField=n=>n.type==="checkbox"?(n.checked?"1":"0"):n.value;

function snapshotDefaults(){
  URL_FIELDS.forEach(([,id])=>{ URL_DEFAULTS[id]=readField(el(id)); });
  URL_DEFAULTS.resort=el("resort").value;
  URL_DEFAULTS.trips=encodeTrips();
}

const encodeTrips=()=>trips.map(t=>[t.si,t.nights,t.wknd,t.disc||0,t.b||0,t.rate>0?Math.round(t.rate):0].join(".")).join("_");

function decodeTrips(s){
  const out=[];
  for(const part of String(s).split("_")){
    const [si,nights,wknd,disc,b,rate]=part.split(".").map(x=>parseInt(x,10));
    if(![si,nights,wknd].every(Number.isFinite)) continue;
    const n=clamp(nights,1,14), s2=clamp(si,0,SEASON_SHORT.length-1);
    out.push({
      si:s2, nights:n, wknd:clamp(wknd,0,n),
      // Older links omit the discount (4th), band (5th) and rate (6th) fields.
      disc:Number.isFinite(disc)?clamp(disc,0,60):0,
      b:Number.isFinite(b)?clamp(b,0,bandCount(s2)-1):0,
      rate:Number.isFinite(rate)&&rate>0?clamp(rate,1,1e5):0
    });
  }
  return out.length?out:null;
}

function writeURL(){
  if(!urlReady) return;
  const p=new URLSearchParams();
  if(el("resort").value!==URL_DEFAULTS.resort) p.set("r",el("resort").value);
  URL_FIELDS.forEach(([key,id])=>{
    // While auto-sizing is on, #points is derived from the trips rather than
    // chosen — pinning it in the link would freeze a number the recipient's
    // own trip list should recompute.
    if(id==="points"&&el("ptsAuto").checked) return;
    const v=readField(el(id));
    if(v!==URL_DEFAULTS[id]) p.set(key,v);
  });
  const t=encodeTrips();
  if(t!==URL_DEFAULTS.trips) p.set("t",t);
  const qs=p.toString();
  /* Opaque origins — file:// most of all — reject replaceState outright.
     Link sharing is an enhancement, so a page opened straight off disk should
     lose the shareable URL and nothing else. */
  try{
    // The hash names the view (or a section inside one); keep it.
    history.replaceState(null,"",(qs?"?"+qs:location.pathname)+location.hash);
  }catch(e){ /* no addressable URL to update; carry on */ }
}

function readURL(){
  const p=new URLSearchParams(location.search);
  if(!Array.from(p.keys()).length) return;

  // Resort first: it rebuilds the room list, so the room index must land after it.
  if(p.has("r")){
    const ri=clamp(parseInt(p.get("r"),10)||0,0,RESORTS.length-1);
    RSEL.forEach(id=>{ el(id).value=String(ri); });
    fillUnits();
  }
  if(p.has("t")){
    const t=decodeTrips(p.get("t"));
    if(t){ trips=t; renderTripRows(); }
  }
  for(const [key,id] of URL_FIELDS){
    if(!p.has(key)) continue;
    const node=el(id), raw=p.get(key);
    if(node.type==="checkbox"){ node.checked=raw==="1"; continue; }
    if(node.type==="number"){
      const v=parseFloat(raw);
      if(!Number.isFinite(v)) continue;
      const lo=node.min===""?-Infinity:parseFloat(node.min);
      const hi=node.max===""?Infinity:parseFloat(node.max);
      node.value=String(clamp(v,lo,hi));
      continue;
    }
    if(node.tagName==="SELECT"){
      // Ignore an index the current resort does not actually have.
      if(Array.from(node.options).some(o=>o.value===raw)) node.value=raw;
      continue;
    }
    node.value=raw;
  }
}

function copyLink(){
  const msg=el("copyMsg");
  const done=t=>{ msg.textContent=t; setTimeout(()=>{msg.textContent="";},2500); };
  const url=location.href;
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(url).then(()=>done("Link copied"),()=>done(url));
  } else {
    done(url);
  }
}
RSEL.forEach(id=>el(id).addEventListener("change",e=>syncResort(e.target.value)));

// default check-in about six months out, clamped into the published charts
(function(){
  let d=new Date(NOW.getFullYear(),NOW.getMonth(),NOW.getDate()+180);
  if(d>new Date(2027,11,27)) d=new Date(2027,11,27);
  const pad=x=>String(x).padStart(2,"0");
  const iso=x=>x.getFullYear()+"-"+pad(x.getMonth()+1)+"-"+pad(x.getDate());
  el("checkin").value=iso(d);
  el("checkin").min=iso(NOW);
  el("checkin").max="2027-12-31";
})();
renderTripRows();
el("addTrip").addEventListener("click",()=>{
  // Inherit the discount already in use so adding a trip does not silently
  // reset the assumption the rest of the list is built on.
  const inherit=trips.length?trips[trips.length-1].disc||0:0;
  trips.push({si:4, b:0, nights:3, wknd:1, disc:inherit});
  renderTripRows(); renderAll();
});
document.querySelectorAll(".presets .chip").forEach(c=>{
  c.addEventListener("click",()=>{
    const d=+c.dataset.disc;
    trips.forEach(t=>{ t.disc=d; });
    renderTripRows(); renderAll();
  });
});
fillUnits();
el("fResort").innerHTML='<option value="-1">All resorts</option>'+
  RESORTS.map((r,i)=>ROFR[i]===undefined?"":'<option value="'+i+'">'+plain(r.name)+'</option>').join("");
["wBal","fResort","fMin","fMax"].forEach(id=>
  el(id).addEventListener("input",renderRank));
el("btnParse").addEventListener("click",applyParse);
el("btnReset").addEventListener("click",()=>{
  LISTINGS=SNAPSHOT.slice(); el("pasteBox").value="";
  el("parseMsg").className=""; el("parseMsg").textContent="Listings cleared.";
  renderRank();
});
document.querySelectorAll("#rank thead th").forEach(th=>{
  const go=()=>{const k=th.dataset.r; if(k===rankKey) rankDir*=-1; else {rankKey=k;rankDir=(k==="resort"||k==="uy")?1:-1;} renderRank();};
  th.addEventListener("click",go);
  th.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();go();}});
});

["points","ptsAuto","closeD","closeR","esc","escRoom","disc"].forEach(id=>
  el(id).addEventListener("input",renderAll));
["mMode","mPat"].forEach(id=>el(id).addEventListener("input",renderMatrix));
["wStart","wMode","wMax","wCols"].forEach(id=>el(id).addEventListener("input",renderWhen));
["tRent","unit"].forEach(id=>
  el(id).addEventListener("input",renderAll));
["lPts","lPpp","l26","l27"].forEach(id=>
  el(id).addEventListener("input",renderListing));
["checkin","nights"].forEach(id=>
  el(id).addEventListener("input",()=>{renderStay();renderWhen();}));

document.querySelectorAll("#grid thead th").forEach(th=>{
  const go=()=>{const k=th.dataset.k; if(k===sortKey) sortDir*=-1; else {sortKey=k;sortDir=1;} renderGrid();};
  th.addEventListener("click",go);
  th.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();go();}});
});

document.querySelectorAll("#compare thead th").forEach(th=>{
  // Savings columns default to biggest-first; everything else to smallest-first.
  const go=()=>{const k=th.dataset.c; if(k===compKey) compDir*=-1; else {compKey=k;compDir=(k==="gap"||k==="lifetime")?-1:1;} renderComparison();};
  th.addEventListener("click",go);
  th.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();go();}});
});

document.querySelectorAll("#chips .chip").forEach(c=>{
  c.addEventListener("click",()=>{
    document.querySelectorAll("#chips .chip").forEach(o=>o.setAttribute("aria-pressed","false"));
    c.setAttribute("aria-pressed","true");
    applyFilter(c.dataset.mode);
  });
});

el("copyLink").addEventListener("click",copyLink);

/* Views. One is shown at a time; the hash names it, or names a section
   inside it, so a shared link opens where the sharer was looking. */
const VIEWS=["decide","explore","shop","read"];
const VIEW_OF={};
document.querySelectorAll(".view").forEach(v=>
  v.querySelectorAll("section[id]").forEach(sec=>{ VIEW_OF[sec.id]=v.id.slice(5); }));
function showView(name){
  if(!VIEWS.includes(name)) name="decide";
  VIEWS.forEach(v=>{ el("view-"+v).hidden=v!==name; });
  document.querySelectorAll(".tab").forEach(t=>t.setAttribute("aria-selected",t.dataset.view===name?"true":"false"));
  // The year strip measures its own width, which is zero while hidden.
  if(name==="decide") renderHero();
  return name;
}
function applyHash(){
  const h=decodeURIComponent(location.hash.slice(1));
  if(VIEWS.includes(h)){ showView(h); return; }
  const sec=h&&VIEW_OF[h]?el(h):null;
  showView(sec?VIEW_OF[h]:"decide");
  if(sec){
    const fold=sec.querySelector("details.fold"); if(fold) fold.open=true;
    if(sec.scrollIntoView) sec.scrollIntoView();
  }
}
document.querySelectorAll(".tab").forEach(t=>t.addEventListener("click",()=>{
  const v=showView(t.dataset.view);
  try{ history.replaceState(null,"",location.pathname+location.search+(v==="decide"?"":"#"+v)); }catch(e){}
  window.scrollTo({top:Math.max(0,document.querySelector(".tabs").offsetTop-8)});
}));
window.addEventListener("hashchange",applyHash);
// The hero's label rows depend on the strip's pixel width.
let heroResize=null;
window.addEventListener("resize",()=>{ clearTimeout(heroResize); heroResize=setTimeout(renderHero,120); });

/* Theme: an explicit choice persists and wins; absent one, the system decides
   and we keep following it if it changes mid-session. */
const prefersDark=()=>window.matchMedia&&window.matchMedia("(prefers-color-scheme:dark)").matches;
const currentTheme=()=>document.documentElement.getAttribute("data-theme")||(prefersDark()?"dark":"light");
function syncThemeButton(){
  const dark=currentTheme()==="dark", b=el("themeToggle");
  b.textContent=dark?"Light mode":"Dark mode";
  b.setAttribute("aria-pressed",dark?"true":"false");
}
function applyTheme(t){
  document.documentElement.setAttribute("data-theme",t);
  try{localStorage.setItem("dvc-theme",t);}catch(e){}
  syncThemeButton();
}
el("themeToggle").addEventListener("click",()=>applyTheme(currentTheme()==="dark"?"light":"dark"));
if(window.matchMedia){
  const mq=window.matchMedia("(prefers-color-scheme:dark)");
  const onChange=()=>{ if(!document.documentElement.getAttribute("data-theme")) syncThemeButton(); };
  if(mq.addEventListener) mq.addEventListener("change",onChange);
}
syncThemeButton();

/* Order matters: capture the pristine defaults, then overlay whatever the
   link carries, and only then let renders start writing the URL back. */
snapshotDefaults();
readURL();
urlReady=true;

renderProvenance();
renderRooms(); renderAll();
applyHash();
