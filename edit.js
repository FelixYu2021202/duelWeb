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

    class LengthContainer {
        /**
         * @type {number}
         */
        len;
        /**
         * @type {JQuery}
         */
        span;
        /**
         * @type {JQuery}
         */
        showcnt;
        /**
         * @type {[string, JQuery][]}
         */
        words = [];
        cnt = 0;
        n = 0;
        /**
         * @param {number} len
         */
        constructor(len, n, def = true) {
            this.n = n;
            this.len = len;
            this.span = $(`<span class="wordLine"><span>长度${len}</span></span>`);
            if (def) {
                this.span.appendTo($("#wordContainer"));
            }
            this.showcnt = $(`<span class="lack">（缺 ${n}）:</span>`).appendTo(this.span);
        }
        updn(n = this.n) {
            this.n = n;
            if (n <= this.cnt) {
                this.showcnt.text(`（多余 ${this.cnt - n}）:`);
                this.showcnt.removeClass("lack");
            }
            else {
                this.showcnt.text(`（缺 ${n - this.cnt}）:`);
                this.showcnt.addClass("lack");
            }
        }
        addword(str) {
            if (str.length != this.len) {
                return false;
            }
            if (this.words.find(v => v[0] == str)) {
                return false;
            }
            let container = $(`<span class="word">${str}</span>`).appendTo(this.span);
            let ccb = $(`<button>×</button>`).appendTo(container);
            this.words.push([str, container]);
            this.cnt++;
            this.updn();
            ccb.on("click", () => {
                this.words = this.words.filter(v => v[0] != str);
                container.remove();
                this.cnt--;
                this.updn();
            });
            return true;
        }
        del() {
            this.span.remove();
        }
        toArray() {
            let res = [];
            for (let i = 0; i < this.cnt; i++) {
                res.push(this.words[i][0]);
            }
            return res;
        }
    }

    class EditContainer {
        /**
         * @type {[JQuery, JQuery]}
         */
        start;
        /**
         * @type {[JQuery, JQuery]}
         */
        end;
        /**
         * @type {LengthContainer[]}
         */
        lcs = [];
        /**
         * @type {number}
         */
        st;
        /**
         * @type {number}
         */
        ed;
        constructor() {
            this.st = m.get();
            this.ed = m.get() + n.get() - 1;
            let sc = $("#startContainer"), ed = $("#endContainer");
            this.start = [
                $(`<button>+</button>`).appendTo(sc),
                $(`<button>-</button>`).appendTo(sc)
            ];
            for (let i = this.st; i <= this.ed; i++) {
                this.lcs[i] = new LengthContainer(i, n.get());
            }
            this.end = [
                $(`<button>+</button>`).appendTo(ed),
                $(`<button>-</button>`).appendTo(ed)
            ];
            this.start[0].on("click", () => {
                if (this.st > 1) {
                    this.st--;
                    n.set(n.get() + 1);
                    m.set(m.get() - 1);
                    this.lcs[this.st] = new LengthContainer(this.st, n.get(), false);
                    this.lcs[this.st].span.insertBefore(this.lcs[this.st + 1].span);
                    for (let i = this.st + 1; i <= this.ed; i++) {
                        this.lcs[i].updn(n.get());
                    }
                }
            });
            this.start[1].on("click", () => {
                if (this.st < this.ed) {
                    this.lcs[this.st].del();
                    this.st++;
                    n.set(n.get() - 1);
                    m.set(m.get() + 1);
                    for (let i = this.st; i <= this.ed; i++) {
                        this.lcs[i].updn(n.get());
                    }
                }
            });
            this.end[0].on("click", () => {
                this.ed++;
                n.set(n.get() + 1);
                this.lcs[this.ed] = new LengthContainer(this.ed, n.get(), false);
                this.lcs[this.ed].span.insertAfter(this.lcs[this.ed - 1].span);
                for (let i = this.st; i < this.ed; i++) {
                    this.lcs[i].updn(n.get());
                }
            });
            this.end[1].on("click", () => {
                if (this.st < this.ed) {
                    this.lcs[this.ed].del();
                    this.ed--;
                    n.set(n.get() - 1);
                    for (let i = this.st; i <= this.ed; i++) {
                        this.lcs[i].updn(n.get());
                    }
                }
            });
        }
        addword(str) {
            if (str.length < this.st || str.length > this.ed) {
                return false;
            }
            return this.lcs[str.length].addword(str);
        }
        toString() {
            for (let i = this.st; i <= this.ed; i++) {
                if (this.lcs[i].cnt < n.get()) {
                    return 0;
                }
            }
            let res = {
                n: n.get(),
                m: m.get(),
                p: [],
                w: [],
                g: "",
                b: [],
                f: 1
            };
            let w = [];
            for (let i = this.st; i <= this.ed; i++) {
                w[i] = this.lcs[i].toArray().reverse();
            }
            for (let i = 0; i < n.get(); i++) {
                res.p[i] = [];
                res.w[i] = [];
                res.b[i] = [];
                for (let j = 0; j < n.get(); j++) {
                    res.p[i][j] = this.st + (i + j) % n.get();
                    res.w[i][j] = w[this.st + (i + j) % n.get()].pop();
                    res.b[i][j] = 0;
                }
            }
            return JSON.stringify(res);
        }
    }

    let n = new AutoSaver(1, [
        [false, v => $("#n").text(v)]
    ]);
    let m = new AutoSaver(3, [
        [false, v => $("#m").text(v)]
    ]);
    let ec = new EditContainer();
    let addWordInput = $("#addWord");
    // addWordInput.on("keydown", (e) => {
    //     if (e.key == "enter") {
    //         let str = addWordInput.val();
    //         if (ec.addword(str)) {
    //             addWordInput.val("");
    //         }
    //     }
    // });
    $(document.body).on("keydown", (e) => {
        if (addWordInput.is(":focus") && e.key.toLowerCase() == "enter") {
            let str = addWordInput.val();
            if (ec.addword(str)) {
                addWordInput.val("");
            }
        }
    });
    $("#addButton").on("click", () => {
        let str = addWordInput.val();
        if (ec.addword(str)) {
            addWordInput.val("");
        }
    });
    $("#export").on("click", () => {
        let text = ec.toString();
        if (text == 0) {
            return;
        }
        let blob = new Blob([text], { type: "application/json" });
        let url = URL.createObjectURL(blob);
        let a = $(`<a style="display: none" href="${url}" download="duel.json"></a>`).appendTo(document.body);
        a[0].click();
        setTimeout(function () {
            a.remove();
        }, 0);
    });
});
