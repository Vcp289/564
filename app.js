const app = document.getElementById("app");

app.innerHTML = `
<div>
    <div class="input-row">
        <input id="a" maxlength="1" type="tel" inputmode="numeric" pattern="[0-9]*">
        <input id="b" maxlength="1" type="tel" inputmode="numeric" pattern="[0-9]*">
        <input id="c" maxlength="1" type="tel" inputmode="numeric" pattern="[0-9]*">
        <input id="d" maxlength="1" type="tel" inputmode="numeric" pattern="[0-9]*">
        <input id="e" maxlength="1" type="tel" inputmode="numeric" pattern="[0-9]*">
    </div>

    <button id="btnCalc">Calculator</button>
    <button id="btnClear">Clear</button>
    <button id="btnFindL">🔍 หาเลข L</button>

    <table id="t"></table>
</div>

<div id="lModal" class="modal" aria-hidden="true">
    <div class="modal-panel" role="dialog" aria-modal="true" aria-labelledby="lModalTitle">
        <div class="modal-header">
            <h2 id="lModalTitle">ผลลัพธ์เลข L</h2>
            <button id="btnCloseLTop" class="modal-x" type="button" aria-label="ปิด">×</button>
        </div>
        <div id="lResult" class="l-result-grid"></div>
        <button id="btnCloseL" class="modal-close" type="button">ปิด</button>
    </div>
</div>
`;

const a = document.getElementById("a");
const b = document.getElementById("b");
const c = document.getElementById("c");
const d = document.getElementById("d");
const e = document.getElementById("e");
const t = document.getElementById("t");
const lModal = document.getElementById("lModal");
const lResult = document.getElementById("lResult");
const inputs = [...document.querySelectorAll("input[maxlength='1']")];

function saveInputs() {
    const data = { a: a.value, b: b.value, c: c.value, d: d.value, e: e.value };
    localStorage.setItem("lastInput", JSON.stringify(data));
}

function loadInputs() {
    const data = JSON.parse(localStorage.getItem("lastInput"));
    if (!data) return;

    a.value = data.a || "";
    b.value = data.b || "";
    c.value = data.c || "";
    d.value = data.d || "";
    e.value = data.e || "";

    if (a.value && b.value && c.value && d.value && e.value) calc();
}

function w(n) {
    return (n + 10) % 10;
}

function calc() {
    if (inputs.some(input => input.value === "")) {
        alert("กรุณากรอกตัวเลขให้ครบ 5 ช่อง");
        return;
    }

    const A = Number(a.value);
    const B = Number(b.value);
    const C = Number(c.value);
    const D = Number(d.value);
    const E = Number(e.value);

    const g = [
        [A, w(A - 1), w(A + 1), D, w(D + 1)],
        [B, w(B - 1), w(B + 1), E, w(E - 1)],
        [C, w(C - 1), w(C + 1), w(D - 1), w(E + 1)]
    ];

    t.innerHTML = g.map(row =>
        "<tr>" + row.map(x => `<td>${x}</td>`).join("") + "</tr>"
    ).join("");

    saveInputs();
}

function clearData() {
    if (!confirm("ต้องการล้างข้อมูลทั้งหมดใช่หรือไม่?")) return;

    inputs.forEach(input => { input.value = ""; });
    t.innerHTML = "";
    localStorage.removeItem("lastInput");
    closeLModal();
    a.focus();
}

function openLModal(values) {
    lResult.innerHTML = values.length
        ? values.map(number => `<div class="l-number">${number}</div>`).join("")
        : `<div class="l-empty">ไม่พบเลข L</div>`;

    lModal.classList.add("show");
    lModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
}

function closeLModal() {
    lModal.classList.remove("show");
    lModal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
}

function findL() {
    const rows = [...document.querySelectorAll("#t tr")];
    if (rows.length === 0) {
        alert("กรุณากด Calculator ก่อน");
        return;
    }

    const g = rows.map(row => [...row.children].map(td => td.innerText.trim()));
    const W = 4; // ไม่ใช้คอลัมน์ที่ 5
    const H = 3;
    const result = new Set();
    const patterns = [
        [[0, 0], [1, 0], [1, 1]],
        [[0, 0], [1, 0], [1, -1]],
        [[0, 0], [-1, 0], [-1, 1]],
        [[0, 0], [-1, 0], [-1, -1]],
        [[0, 0], [0, 1], [1, 1]],
        [[0, 0], [0, 1], [-1, 1]],
        [[0, 0], [0, -1], [1, -1]],
        [[0, 0], [0, -1], [-1, -1]]
    ];

    for (const pattern of patterns) {
        for (let r = 0; r < H; r++) {
            for (let c = 0; c < W; c++) {
                let value = "";
                let valid = true;

                for (const [dr, dc] of pattern) {
                    const rr = r + dr;
                    const cc = c + dc;
                    if (rr < 0 || rr >= H || cc < 0 || cc >= W) {
                        valid = false;
                        break;
                    }
                    value += g[rr][cc];
                }

                if (valid) result.add(value);
            }
        }
    }

    openLModal([...result].sort());
}

document.getElementById("btnCalc").addEventListener("click", calc);
document.getElementById("btnClear").addEventListener("click", clearData);
document.getElementById("btnFindL").addEventListener("click", findL);
document.getElementById("btnCloseL").addEventListener("click", closeLModal);
document.getElementById("btnCloseLTop").addEventListener("click", closeLModal);

lModal.addEventListener("click", event => {
    if (event.target === lModal) closeLModal();
});

document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeLModal();
});

inputs.forEach((input, index) => {
    input.addEventListener("input", event => {
        event.target.value = event.target.value.replace(/[^0-9]/g, "");
        saveInputs();

        if (event.target.value.length === 1 && index < inputs.length - 1) {
            inputs[index + 1].focus();
            inputs[index + 1].select();
        }
    });

    input.addEventListener("keydown", event => {
        if (event.key === "Backspace" && input.value === "" && index > 0) {
            inputs[index - 1].focus();
        }
        if (event.key === "ArrowRight" && index < inputs.length - 1) {
            inputs[index + 1].focus();
        }
        if (event.key === "ArrowLeft" && index > 0) {
            inputs[index - 1].focus();
        }
    });
});

loadInputs();
