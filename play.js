if (!jQuery) {
    const jQuery = require("jquery");
}

/**
 * @template T
 */
class AutoSaver {
    /**
     * @type {T}
     */
    v;
    /**
     * @type {({ 0: true;  1: (v: T, rv: T) => void } | { 0: false; 1: (v: T) => void})[]}
     */
    cb = [];
    /**
     * 
     * @param {T} v
     * @param {({ 0: true;  1: (v: T, rv: T) => void } | { 0: false; 1: (v: T) => void})[]} cb 
     */
    constructor(v, cb = []) {
        this.cb = cb;
        this.v = v;
    }
    /**
     * @param {{ 0: true;  1: (v: T, rv: T) => void } | { 0: false; 1: (v: T) => void}} fun
     */
    add(fun) {
        this.cb.push(fun);
        return this;
    }
    /**
     * @returns {T}
     */
    get() {
        return this.v;
    }
    /**
     * @param {T} v
     */
    run(v = this.v) {
        this.cb.forEach(fun => {
            if (fun[0]) fun[1](v, this.v);
            else fun[1](v);
        });
        return this;
    }
    /**
     * @param {T} v
     */
    set(v) {
        this.run(v);
        this.v = v;
        return this;
    }
}

jQuery(function main($) {
    globalThis.$ = $;

    function getid(x, y) {
        let ch = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        return `${ch[x]}${ch[y]}`;
    }

    class GameBoard {
        n = 3;
        m = 3;
        p = [
            [3, 5, 4],
            [4, 3, 5],
            [5, 4, 3]
        ];
        w = [
            ["age", "abort", "goal"],
            ["echo", "era", "chase"],
            ["plane", "isle", "ape"]
        ];
        g = "a";
        b = [
            [2, 0, 0],
            [0, 1, 0],
            [0, 0, 0]
        ];
        f = new AutoSaver(1, []);
        /**
         * @type {JQuery<HTMLTableElement>}
         */
        gb;
        /**
         * @type {GridView[][]}
         */
        gvs = [];
        /**
         * @type {JQuery<HTMLDivElement>}
         */
        gl;
        /**
         * @type {JQuery<HTMLElement>}
         */
        wc;
        /**
         * @type {WordView[][]}
         */
        wvs;
        /**
         * @type {JQuery<HTMLElement>}
         */
        gc;
        /**
         * @type {boolean}
         */
        ov = false;
        def = false;
        read(v) {
            if (typeof v != "object" || v == null) {
                return;
            }
            if (
                typeof v.n != "number" || typeof v.m != "number" || typeof v.p != "object" ||
                typeof v.w != "object" || typeof v.g != "string" || typeof v.b != "object" ||
                typeof v.f != "number"
            ) {
                return;
            }
            if (v.n < 1 || v.m < 1 || v.f < 1 || v.f > 2) {
                return;
            }
            if (v.p.length != v.n || v.w.length != v.n || v.b.length != v.n) {
                return;
            }
            let cnt = [];
            for (let i = v.m; i < v.n + v.m; i++) {
                cnt[i] = 0;
            }
            for (let i = 0; i < v.n; i++) {
                if (typeof v.p[i] != "object" || typeof v.w[i] != "object" || typeof v.b[i] != "object") {
                    return;
                }
                if (v.p[i].length != v.n || v.w[i].length != v.n || v.b[i].length != v.n) {
                    return;
                }
                for (let j = 0; j < v.n; j++) {
                    if (typeof v.p[i][j] != "number" || typeof v.w[i][j] != "string" || typeof v.b[i][j] != "number") {
                        return;
                    }
                    if (v.w[i][j].length != v.p[i][j]) {
                        return;
                    }
                    if (v.b[i][j] < 0 || v.b[i][j] > 2) {
                        return;
                    }
                    cnt[v.w[i][j].length]++;
                }
            }
            for (let i = v.m; i < v.n + v.m; i++) {
                if (cnt[i] != v.n) {
                    return;
                }
            }
            cnt = [];
            for (let i of v.g) {
                if (cnt[i]) {
                    return;
                }
                cnt[i] = true;
            }
            // success
            this.def = true;
            this.n = v.n;
            this.m = v.m;
            this.p = v.p;
            this.w = v.w;
            this.g = v.g;
            this.b = v.b;
            this.f.set(v.f);
            this.draw();
        }
        draw() {
            this.gb.children().remove();
            this.wc.children().remove();
            this.gvs = [];
            for (let i = 0; i < this.n; i++) {
                let row = [];
                let tr = $(`<tr></tr>`);
                for (let j = 0; j < this.n; j++) {
                    row.push(new GridView(tr, getid(i, j), this.p[i][j], this.b[i][j]));
                }
                tr.appendTo(this.gb);
                this.gvs.push(row);
            }
            this.gl.children().remove();
            for (let i of this.g) {
                $(`<span class="guessedLetter">${i}</span>`).appendTo(this.gl);
            }
            this.wc.children().remove();
            this.wvs = [];
            for (let i = 0; i < this.n; i++) {
                this.wvs[i] = [];
                for (let j = 0; j < this.n; j++) {
                    this.wvs[i][j] = new WordView(this.w[i][j], this.wc, [i, j], this, this.g, this.b[i][j]);
                }
            }
        }
        constructor(gb, gl, wc, gc) {
            this.gb = gb;
            this.gl = gl;
            this.wc = wc;
            this.gc = gc;
        }
        toString() {
            return JSON.stringify({
                n: this.n,
                m: this.m,
                p: this.p,
                w: this.w,
                b: this.b,
                g: this.g,
                f: this.f.get()
            });
        }
        guess(t, p, v) {
            if (this.ov) {
                return;
            }
            console.log(t, p, v);
            if (t == 1) {
                this.g += v;
                $(`<span class="guessedLetter">${v}</span>`).appendTo(this.gl);
                for (let i = 0; i < this.n; i++) {
                    for (let j = 0; j < this.n; j++) {
                        this.wvs[i][j].update(this.g, 3 - this.f.get());
                    }
                }
                this.f.set(3 - this.f.get());
            }
            else {
                let x = p[0], y = p[1];
                if (this.w[x][y] == v) {
                    this.report(x, y, this.f.get());
                }
                else {
                    this.f.set(3 - this.f.get());
                }
            }
            let res = this.checkwin();
            if (res != 0) {
                end(res);
                this.ov = true;
                for (let i = 0; i < this.n; i++) {
                    for (let j = 0; j < this.n; j++) {
                        this.wvs[i][j].ov = true;
                        this.wvs[i][j].update("", 0);
                    }
                }
            }
        }
        report(x, y, p) {
            console.log(`${p} guessed ${getid(x, y)}. ${this.w[x][y]}!`);
            this.b[x][y] = p;
            this.wvs[x][y].seton(p);
            this.gvs[x][y].set(p);
        }
        checkwin() {
            let s = [0, 0, 0];
            for (let i = 0; i < this.n; i++) {
                let rc = [0, 0, 0];
                for (let j = 0; j < this.n; j++) {
                    s[this.b[i][j]]++;
                    rc[this.b[i][j]]++;
                }
                if (rc[1] == this.n) {
                    return 1;
                }
                if (rc[2] == this.n) {
                    return 2;
                }
            }
            if (s[1] > this.n * this.n / 2) {
                return 1;
            }
            if (s[2] > this.n * this.n / 2) {
                return 1;
            }
            for (let j = 0; j < this.n; j++) {
                let cc = [0, 0, 0];
                for (let i = 0; i < this.n; i++) {
                    cc[this.b[i][j]]++;
                }
                if (cc[1] == this.n) {
                    return 1;
                }
                if (cc[2] == this.n) {
                    return 2;
                }
            }
            return 0;
        }
    }

    class GridView {
        /**
         * @type {JQuery<HTMLTableCellElement>}
         */
        td;
        /**
         * @type {JQuery<HTMLSpanElement>}
         */
        ts;
        constructor(tr, id, l, p) {
            this.td = $(`<td class="wordGrid">
    <span class="gridPos">${id}</span>
    <span class="gridLen">${l}</span>
</td>`).appendTo(tr);
            this.ts = $(`<span></span>`).appendTo(this.td);
            this.set(p);
        }
        set(p) {
            if (p == 0) {
                this.td.css("background-color", "inherit");
            }
            else {
                this.td.css("background-color", `var(--p${p}Color)`);
            }
        }
    }

    class WordView {
        /**
         * @type {string}
         */
        str;
        /**
         * @type {JQuery<HTMLSpanElement>}
         */
        span;
        /**
         * @type {JQuery<HTMLSpanElement>}
         */
        idspan;
        /**
         * @type {JQuery<HTMLSpanElement>[]}
         */
        letters = [];
        /**
         * @type {string}
         */
        id;
        /**
         * @type {GameBoard}
         */
        gb;
        /**
         * @type {boolean}
         */
        ov = false;
        /**
         * @param {string} str
         * @param {JQuery<HTMLElement>} wc
         * @param {[number, number]} id
         * @param {GameBoard} gb
         * @param {string} g
         * @param {number} on
         */
        constructor(str, wc, id, gb, g, on) {
            this.str = str;
            this.id = id;
            this.gb = gb;
            this.span = $(`<span class="singleWord"></span>`).appendTo(wc);
            this.idspan = $(`<span class="wordId">${getid(id[0], id[1])}.</span>`).appendTo(this.span);
            for (let i = 0; i < this.str.length; i++) {
                this.letters.push($(`<span class="underline2"></span>`).appendTo(this.span));
            }
            $(`<span class="wordId">(${this.str.length})</span>`).appendTo(this.span);
            this.span.on("click", () => {
                if (this.ov) {
                    return;
                }
                let showstring = `猜测 ${getid(this.id[0], this.id[1])}:
输入任何不匹配内容以取消。
`;
                for (let i = 0; i < this.str.length; i++) {
                    if (this.letters[i].text()) {
                        showstring += this.str[i] + " ";
                    }
                    else {
                        showstring += "_ ";
                    }
                }
                let ans = prompt(showstring).toLocaleLowerCase();
                if (ans.length != this.str.length) {
                    return;
                }
                for (let i = 0; i < this.str.length; i++) {
                    if (this.letters[i].text() && ans[i] != this.str[i]) {
                        return;
                    }
                }
                return this.gb.guess(2, this.id, ans);
            });
            this.seton(on);
            this.update(g, 0);
        }
        /**
         * @param {number} on
         */
        seton(on) {
            if (on) {
                this.ov = true;
                this.idspan.css("background-color", `var(--p${on}Color)`);
                this.update("", 0);
            }
        }
        /**
         * @param {string} g
         */
        update(g, op) {
            if (this.ov) {
                for (let i = 0; i < this.str.length; i++) {
                    this.letters[i].text(this.str[i]);
                }
                return;
            }
            let cnt = 0;
            for (let i = 0; i < this.str.length; i++) {
                if (g.indexOf(this.str[i]) == -1) {
                    this.letters[i].text("");
                }
                else {
                    this.letters[i].text(this.str[i]);
                    cnt++;
                }
            }
            if (cnt == this.str.length && !this.ov) {
                this.ov = true;
                this.gb.report(this.id[0], this.id[1], op);
            }
        }
    }

    let body = $(document.body);

    // let p1Container = $("#p1Container");
    // let p2Container = $("#p2Container");
    let p1ColorInput = $("#p1Color");
    let p2ColorInput = $("#p2Color");

    let p1Color = new AutoSaver(localStorage.getItem("p1Color") ?? "#FE0B0B", [
        [false, v => body.css("--p1Color", v)],
        [false, v => localStorage.setItem("p1Color", v)]
    ]);
    let p2Color = new AutoSaver(localStorage.getItem("p2Color") ?? "#2A31FE", [
        [false, v => body.css("--p2Color", v)],
        [false, v => localStorage.setItem("p2Color", v)]
    ]);
    p1Color.run();
    p2Color.run();

    p1ColorInput.on("input", function () {
        p1Color.set(p1ColorInput.val());
    });
    p1ColorInput.val(p1Color.get());
    p2ColorInput.on("input", function () {
        p2Color.set(p2ColorInput.val());
    });
    p2ColorInput.val(p2Color.get());

    let playerNames = [,
        new AutoSaver(localStorage.getItem("p1Name") ?? "", [[false, v => localStorage.setItem("p1Name", v)]]),
        new AutoSaver(localStorage.getItem("p2Name") ?? "", [[false, v => localStorage.setItem("p2Name", v)]])
    ];

    let gb = new GameBoard($("#gameBoard"), $("#guessedFlex"), $("#wordContainer"), $("#guessContainer"));
    gb.f.add([false, v => {
        $("#currentTurn").css("color", `var(--p${v}Color)`);
        $("#currentTurnId").text(v);
        $("#currentTurnName").text(playerNames[v].get());
    }]).run();
    gb.read(JSON.parse(localStorage.getItem("gbAutoSave")));

    let p1NameInput = $("#p1Name");
    let p2NameInput = $("#p2Name");
    p1NameInput.on("input", function () {
        playerNames[1].set(p1NameInput.val());
        if (gb.f.get() == 1) {
            gb.f.run();
        }
    });
    p1NameInput.val(playerNames[1].get());
    p2NameInput.on("input", function () {
        playerNames[2].set(p2NameInput.val());
        if (gb.f.get() == 2) {
            gb.f.run();
        }
    });
    p2NameInput.val(playerNames[2].get());

    let importFileInput = $("#importFile");
    importFileInput.on("input", function (e) {
        let file = e.target.files[0];
        if (file && file.type == "application/json") {
            let reader = new FileReader();
            reader.onload = function (e) {
                gb.read(JSON.parse(e.target.result));
            }
            reader.readAsText(file);
        }
    });

    $("#exportFile").on("click", function () {
        let text = gb.toString();
        let blob = new Blob([text], { type: "application/json" });
        let url = URL.createObjectURL(blob);
        let a = $(`<a style="display: none" href="${url}" download="duel.json"></a>`).appendTo(document.body);
        a[0].click();
        setTimeout(function () {
            a.remove();
        }, 0);
    });
    gb.draw();

    function gbAutoSave() {
        if (gb.def) {
            localStorage.setItem("gbAutoSave", gb.toString());
        }
        setTimeout(gbAutoSave, 10000);
    }
    gbAutoSave();

    let guessLetter = $("#guessLetter");
    let guessLetterContainer = $("#guessLetterContainer");
    guessLetterContainer.attr("tabindex", 0);
    $(document).on("keydown", function (e) {
        if (guessLetterContainer.is(":focus")) {
            if (/^[a-zA-Z]$/.test(e.key)) {
                guessLetter.text(e.key.toLocaleLowerCase());
            }
        }
    });

    $("#guessLetterButton").on("click", () => {
        let key = guessLetter.text();
        if (/^[a-zA-Z]$/.test(key)) {
            if (gb.g.indexOf(key) != -1) {
                return;
            }
            gb.guess(1, null, key);
        }
    });

    function end(p) {
        alert(`玩家 ${playerNames[p].get()}（玩家 ${p}）获胜！`);
    }
});
