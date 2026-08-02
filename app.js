const app = document.getElementById("app");

<div id="pageMain">

    <div>
        <input id="a" maxlength="1" type="tel" inputmode="numeric">
        <input id="b" maxlength="1" type="tel" inputmode="numeric">
        <input id="c" maxlength="1" type="tel" inputmode="numeric">
        <input id="d" maxlength="1" type="tel" inputmode="numeric">
        <input id="e" maxlength="1" type="tel" inputmode="numeric">
    </div>

    <button id="btnCalc">Calc</button>
    <button id="btnClear">Clear</button>
    <button onclick="findL()">🔍 หาเลข L</button>

    <table id="t"></table>

</div>

<div id="pageL" style="display:none">

    <h2>ผลลัพธ์เลข L</h2>

    <div id="lResult"></div>

    <br>

    <button onclick="backHome()">← กลับ</button>

</div>

`;

const a = document.getElementById("a");
const b = document.getElementById("b");
const c = document.getElementById("c");
const d = document.getElementById("d");
const e = document.getElementById("e");
const t = document.getElementById("t");

const inputs = [...document.querySelectorAll("input[maxlength='1']")];


// ========================
// บันทึกค่าล่าสุด
// ========================
function saveInputs(){

    const data = {
        a:a.value,
        b:b.value,
        c:c.value,
        d:d.value,
        e:e.value
    };

    localStorage.setItem("lastInput", JSON.stringify(data));
}


// ========================
// โหลดค่าล่าสุด
// ========================
function loadInputs(){

    const data = JSON.parse(localStorage.getItem("lastInput"));

    if(!data) return;

    a.value = data.a || "";
    b.value = data.b || "";
    c.value = data.c || "";
    d.value = data.d || "";
    e.value = data.e || "";

    if(a.value && b.value && c.value && d.value && e.value){
        calc();
    }

}


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


    saveInputs();

}


// ========================
// ล้างข้อมูล
// ========================
function clearData(){

    if(!confirm("Clear Now !")){
        return;
    }


    inputs.forEach(input=>{
        input.value="";
    });


    t.innerHTML="";


    localStorage.removeItem("lastInput");


    a.focus();

}


// ปุ่ม
document.getElementById("btnCalc")
.addEventListener("click", calc);


document.getElementById("btnClear")
.addEventListener("click", clearData);



// ระบบเลื่อนช่อง
inputs.forEach((input,index)=>{


    input.addEventListener("input",(e)=>{


        e.target.value =
        e.target.value.replace(/[^0-9]/g,"");


        // จำค่าทันที
        saveInputs();


        if(e.target.value.length===1 &&
           index<inputs.length-1){

            inputs[index+1].focus();
            inputs[index+1].select();

        }


    }); //


    input.addEventListener("keydown",(e)=>{


        if(e.key==="Backspace" &&
           input.value==="" &&
           index>0){

            inputs[index-1].focus();

        }


        if(e.key==="ArrowRight" &&
           index<inputs.length-1){

            inputs[index+1].focus();

        }


        if(e.key==="ArrowLeft" &&
           index>0){

            inputs[index-1].focus();

        }

