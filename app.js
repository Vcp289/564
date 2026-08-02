const app = document.getElementById("app");

app.innerHTML = `
<div>
    <input maxlength="1" id="a">
    <input maxlength="1" id="b">
    <input maxlength="1" id="c">
    <input maxlength="1" id="d">
    <input maxlength="1" id="e">

    <button onclick="calc()">Calc</button>

    <table id="t"></table>
</div>
`;

const inputs = [...document.querySelectorAll("input[maxlength='1']")];

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

