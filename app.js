const app=document.getElementById('app');
app.innerHTML=`<div>
<input maxlength=1 id=a>
<input maxlength=1 id=b>
<input maxlength=1 id=c>
<input maxlength=1 id=d>
<input maxlength=1 id=e>
<button onclick='calc()'>Calc</button>
<table id=t></table>
</div>`;

function w(n){
    return (n+10)%10;
}

function calc(){
    let A=+a.value,
        B=+b.value,
        C=+c.value,
        D=+d.value,
        E=+e.value;

    let g=[
        [A,w(A-1),w(A+1),D,w(D+1)],
        [B,w(B-1),w(B+1),E,w(E-1)],
        [C,w(C-1),w(C+1),w(D-1),w(E+1)]
    ];

    t.innerHTML=g.map(r=>'<tr>'+r.map(x=>'<td>'+x+'</td>').join('')+'</tr>').join('');
}

const inputs [...document.querySelectorAll("input[maxlength='1']")];

inputs.forEach((input,index)=>{

    input.addEventListener("input",(e)=>{
        e.target.value=e.target.value.replace(/[^0-9]/g,"");

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

