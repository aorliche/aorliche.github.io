import * as d3 from "https://cdn.skypack.dev/d3@7";
import * as Plot from "https://cdn.skypack.dev/@observablehq/plot@0.6";

var $ = q => document.querySelector(q);
function point(x,y) {return {x:x,y:y}};
function add(p, q) {
    return {x: p.x+q.x, y: p.y+q.y};
}
function rotate(p, theta) {
    const x = p.x*Math.cos(theta)-p.y*Math.sin(theta);
    const y = p.x*Math.sin(theta)+p.y*Math.cos(theta);
    return point(x,y);
}
function makeEllipse(a,b,theta,x0,y0) {
    const points = [];
    const r0 = point(x0,y0);
    for (let t=0; t<2*Math.PI+0.1; t+=0.1) {
        const x = a*Math.cos(t);
        const y = b*Math.sin(t);
        points.push(add(rotate(point(x,y),theta), r0));
    }
    return points;
}
function makeEntropyTable() {
    const points = [];
    for (let w=0; w<1; w+=0.001) {
        const h = w == 0 || w == 1 ? 0 : -w*Math.log(w);
        points.push(point(w,h));
    }
    return points;
}
function binSearch(y, table, lo, hi) {
    let iter = 0;
    let prev = -1;
    while (lo != hi) {
        if (iter++ > 100) throw 'bad';
        const mid = Math.floor((hi+lo)/2);
        if (mid == prev) {
            return mid;
        } else if (table[mid].y < y) {
            lo = mid;
            prev = mid;
        } else {
            hi = mid;
            prev = mid;
        }
    }
}
function makeEntropyGraph(table) {
    const points = [];
    for (let w0=0; w0<1; w0+=0.001) {
        const h = (w0 == 0 || w0 == 1) ? .39 : .39+w0*Math.log(w0);
        const w1h = table[binSearch(h, table, 0, 370)];
        points.push(point(w0,w1h.x));
    }
    return points;
}
const dataL1 = [point(0,1),point(1,0),point(0,-1),point(-1,0),point(0,1)];
const dataL2 = makeEllipse(1,1,0,0,0);
const dataObj = makeEllipse(1,0.5,-Math.PI/6,0.5,1.5);
const entropyTable = makeEntropyTable();
const dataEntropy = makeEntropyGraph(entropyTable);
$('#l1-graph').appendChild(Plot.plot({
  title: 'L1',
  inset: 10,
  width: 300,
  height: 300,
  x: {label: 'w0', domain: [-2,2]},
  y: {label: 'w1', domain: [-2,2]},
  grid: true,
  marks: [
    Plot.text([[0, -1.5]], {
      text: ["L1"], 
      fontSize: 20,
      textAnchor: "middle"
    }),
    Plot.line(dataL1, {x: 'x', y: 'y', marker: 'none'}),
    Plot.line(dataObj, {x: 'x', y: 'y', stroke: 'red', curve: 'catmull-rom', marker: 'none'}),
  ]
}));
$('#l2-graph').appendChild(Plot.plot({
  inset: 10,
  width: 300,
  height: 300,
  x: {label: 'w0', domain: [-2,2]},
  y: {label: 'w1', domain: [-2,2]},
  grid: true,
  marks: [
    Plot.text([[0, -1.5]], {
      text: ["L2"], 
      fontSize: 20,
      textAnchor: "middle"
    }),
    Plot.line(dataL2, {x: 'x', y: 'y', marker: 'none'}),
    Plot.line(dataObj, {x: 'x', y: 'y', stroke: 'red', curve: 'catmull-rom', marker: 'none'}),
  ]
}));
console.log(entropyTable);
console.log(dataEntropy);
$('#entropy-graph').appendChild(Plot.plot({
    inset: 10,
    width: 200,
    height: 200,
    x: {label: 'w'},
    y: {label: 'H'},
    grid: true,
    marks: [
        Plot.line(entropyTable, {x: 'x', y: 'y', marker: 'none'})
    ]
}));
const subdata= dataEntropy.slice(0,370).map(p => point(2.7*p.x,2.7*p.y));
$('#entropy-contour').appendChild(Plot.plot({
    inset: 10,
    width: 300,
    height: 300,
    grid: true,
    x: {label: 'w0', domain: [-2,2]},
    y: {label: 'w1', domain: [-2,2]},
    marks: [
        Plot.line(subdata, {x: 'x', y: 'y', marker: 'none'}),
        Plot.line(subdata.map(p => point(p.x,-p.y)), {x: 'x', y: 'y', marker: 'none'}),
        Plot.line(subdata.map(p => point(-p.x,p.y)), {x: 'x', y: 'y', marker: 'none'}),
        Plot.line(subdata.map(p => point(-p.x,-p.y)), {x: 'x', y: 'y', marker: 'none'}),
        Plot.line(dataObj, {x: 'x', y: 'y', stroke: 'red', curve: 'catmull-rom', marker: 'none'}),
        Plot.text([[0, -1.5]], {
          text: ["Entropy Regularization"], 
          fontSize: 20,
          textAnchor: "middle"
        }),
    ]
}));