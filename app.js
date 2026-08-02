const app = document.getElementById("app");

app.innerHTML = `

<div id="pageMain">

<div class="input-row">
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

<h2>🔍 ผลการค้นหาเลข L</h2>

<div id="lResult"
style="
display:grid;
grid-template-columns:repeat(3,1fr);
gap:10px;
margin:20px;">
</div>


<button onclick="backHome()">⬅ กลับ</button>

</div>


`;


// =====================
// ตัวแปร
// =====================

const inputs=[
    document.getElementById("a"),
    document.getElementById("b"),
    document.getElementById("c"),
    document.getElementById("d"),
    document.getElementById("e")
];


const t=document.getElementById("t");


// =====================
// บันทึกข้อมูล
// =====================

function save(){

    localStorage.setItem(
        "numbers",
        JSON.stringify(
            inputs.map(x=>x.value)
        )
    );

}


// =====================
// โหลดข้อมูล
// =====================

function load(){

    let data=
    JSON.parse(
        localStorage.getItem("numbers")
    );


    if(data){

        inputs.forEach(
            (x,i)=>{
                x.value=data[i] || "";
            }
        );

    }

}


// =====================
// สูตรเลข
// =====================

function plus(n){

    return (n+10)%10;

}



function calc(){


let n=inputs.map(
x=>Number(x.value)
);


if(n.some(isNaN)){

alert("กรอกเลขให้ครบ 5 ตัว");
return;

}



let result=[


[
n[0],
plus(n[0]-1),
plus(n[0]+1),
n[3],
plus(n[3]+1)
],


[
n[1],
plus(n[1]-1),
plus(n[1]+1),
n[4],
plus(n[4]-1)
],


[
n[2],
plus(n[2]-1),
plus(n[2]+1),
plus(n[3]-1),
plus(n[4]+1)
]


];



t.innerHTML=
result.map(row=>

`
<tr>
${row.map(x=>`<td>${x}</td>`).join("")}
</tr>
`

).join("");



save();


}



// =====================
// หาเลข L
// =====================

function findL(){


let nums=[

"710",
"594",
"167",
"859",
"206",
"295"

];



let html="";


nums.forEach(n=>{


html+=`

<div style="
background:#007AFF;
color:white;
padding:15px;
border-radius:12px;
font-size:26px;
font-weight:bold;
text-align:center;
">

${n}

</div>


`;


});



document.getElementById("lResult").innerHTML=html;


showLPage();


}



// =====================
// เปลี่ยนหน้า
// =====================

function showLPage(){

document.getElementById("pageMain")
.style.display="none";


document.getElementById("pageL")
.style.display="block";


}



function backHome(){

document.getElementById("pageMain")
.style.display="block";


document.getElementById("pageL")
.style.display="none";


}



// =====================
// Clear
// =====================

function clearData(){


inputs.forEach(
x=>x.value=""
);


t.innerHTML="";


localStorage.removeItem("numbers");


inputs[0].focus();


}


// =====================
// ปุ่ม
// =====================


document
.getElementById("btnCalc")
.onclick=calc;


document
.getElementById("btnClear")
.onclick=clearData;




// =====================
// เลื่อนช่องอัตโนมัติ
// =====================

inputs.forEach((input,index)=>{


input.addEventListener(
"input",
()=>{


input.value=
input.value.replace(/[^0-9]/g,"");


save();



if(input.value &&
index<inputs.length-1){

inputs[index+1].focus();

}



});



input.addEventListener(
"keydown",
e=>{


if(
e.key==="Backspace" &&
input.value==="" &&
index>0
){

inputs[index-1].focus();

}


});



});



// เริ่มโปรแกรม

load();
