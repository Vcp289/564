const app = document.getElementById("app");

app.innerHTML = `
<div>
    <input id="a" maxlength="1" type="tel" inputmode="numeric" pattern="[0-9]*">
    <input id="b" maxlength="1" type="tel" inputmode="numeric" pattern="[0-9]*">
    <input id="c" maxlength="1" type="tel" inputmode="numeric" pattern="[0-9]*">
    <input id="d" maxlength="1" type="tel" inputmode="numeric" pattern="[0-9]*">
    <input id="e" maxlength="1" type="tel" inputmode="numeric" pattern="[0-9]*">

    <button id="btnCalc">Calc</button>

    <table id="t"></table>
</div>
`;

const a = document.getElementById("a");
const b = document.getElementById("b");
const c = document.getElementById("c");
const d = document.getElementById("d");
const e = document.getElementById("e");
const t = document.getElementById("t");

const inputs = [...document.querySelectorAll("input[maxlength='1']")];

function w(n){
    return (n + 10) % 10;
}

function calc(){

    const A = Number(a.value);
    const B = Number(b.value);
    const C = Number(c.value);
    const D = Number(d.value);
    const E = Number(e.value);

    const g = [
        [A,w(A-1),w(A+1),D,w(D+1)],
        [B,w(B-1),w(B+1),E,w(E-1)],
        [C,w(C-1),w(C+1),w(D-1),w(E+1)]
    ];

    t.innerHTML = g.map(r =>
        "<tr>" +
        r.map(x => `<td>${x}</td>`).join("") +
        "</tr>"
    ).join("");
}

document.getElementById("btnCalc").addEventListener("click", calc);

inputs.forEach((input,index)=>{

    input.addEventListener("input",(e)=>{

        e.target.value = e.target.value.replace(/[^0-9]/g,"");

        if(e.target.value.length===1 && index<inputs.length-1){
            inputs[index+1].focus();
            inputs[index+1].select();
        }

    });

    input.addEventListener("keydown",(e)=>{

        if(e.key==="Backspace" && input.value==="" && index>0){
            inputs[index-1].focus();
        }

        if(e.key==="ArrowRight" && index<inputs.length-1){
            inputs[index+1].focus();
        }

        if(e.key==="ArrowLeft" && index>0){
            inputs[index-1].focus();
        }

    });

});

