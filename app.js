  

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


    });
    }); //


// โหลดข้อมูลเดิมตอนเปิดแอป
loadInputs();
// ========================
// หาเลข L
// ========================
function findL(){

    if(t.innerHTML===""){
        alert("กรุณากด Calc ก่อน");
        return;
    }

    document.querySelectorAll("#t td").forEach(td=>{
        td.style.background="";
    });

    const cells = document.querySelectorAll("#t td");
    const result = [];

    cells.forEach(td=>{

        const value = td.innerText.trim();

        if(value==="L"){

            td.style.background="#ffe066";
            result.push(value);

        }

    });

    if(result.length===0){

        alert("ไม่พบเลข L");

    }else{

        alert("พบเลข L\n\n"+result.join("\n"));

    }

}
function showLPage(){

    document.getElementById("pageMain").style.display="none";
    document.getElementById("pageL").style.display="block";

}

function backHome(){

    document.getElementById("pageMain").style.display="block";
    document.getElementById("pageL").style.display="none";

}
