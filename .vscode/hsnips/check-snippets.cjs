// Run with Node.js and HyperSnips installed: node .vscode/hsnips/check-snippets.cjs
// Uses the installed parser, completion matcher, and snippet-instance generator.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const Module = require("node:module");

class Position {
    constructor(line, character) { this.line = line; this.character = character; }
    translate(line = 0, character = 0) { return new Position(this.line + line, this.character + character); }
    with(line = this.line, character = this.character) { return new Position(line, character); }
    isEqual(other) { return this.line === other.line && this.character === other.character; }
    isBefore(other) { return this.line < other.line || this.line === other.line && this.character < other.character; }
    isAfterOrEqual(other) { return !this.isBefore(other); }
}
class Range {
    constructor(a, b, c, d) {
        this.start = a instanceof Position ? a : new Position(a, b);
        this.end = a instanceof Position ? b : new Position(c, d);
    }
    contains(other) { return !other.start.isBefore(this.start) && !this.end.isBefore(other.end); }
}
class Document {
    constructor(text) {
        this.text = text;
        this.version = 1;
        this.languageId = "latex";
        this.uri = {toString: () => "file:///snippet-check.tex"};
    }
    getText(range) { return range ? this.text.slice(this.offsetAt(range.start), this.offsetAt(range.end)) : this.text; }
    offsetAt(position) {
        const lines = this.text.split("\n");
        return lines.slice(0, position.line).reduce((length, line) => length + line.length + 1, 0) + position.character;
    }
    positionAt(offset) { const lines = this.text.slice(0, offset).split("\n"); return new Position(lines.length - 1, lines.at(-1).length); }
    lineAt(line) { const text = this.text.split("\n")[line]; return {text, firstNonWhitespaceCharacterIndex: text.search(/\S|$/)}; }
    getWordRangeAtPosition(position) {
        const text = this.lineAt(position.line).text.slice(0, position.character);
        const match = /[A-Za-z0-9_]+$/.exec(text);
        return match ? new Range(position.line, match.index, position.line, position.character) : undefined;
    }
}
const vscode = {
    Position, Range,
    SnippetString: class { constructor(value) { this.value = value; } },
    window: {activeTextEditor: undefined, showWarningMessage: message => { throw new Error(message); }},
    workspace: {workspaceFolders: [], getConfiguration: () => ({get: () => 20})},
    extensions: {getExtension: () => ({exports: {getScopeAt: () => ({scopes: []})}})}
};
const extensionRoot = process.env.HSNIPS_EXTENSION_DIR || path.join(os.homedir(), ".vscode", "extensions");
const extension = process.env.HSNIPS_EXTENSION_DIR ? extensionRoot : path.join(extensionRoot,
    fs.readdirSync(extensionRoot).filter(name => name.startsWith("draivin.hsnips-")).sort((a,b) => a.localeCompare(b, undefined, {numeric:true})).at(-1));
const originalLoad = Module._load;
Module._load = function(request, parent, isMain) {
    return request === "vscode" ? vscode : originalLoad.call(this, request, parent, isMain);
};
const {parse} = require(path.join(extension, "out", "parser.js"));
const {getCompletions} = require(path.join(extension, "out", "completion.js"));
const {HSnippetInstance} = require(path.join(extension, "out", "hsnippetInstance.js"));
const source = fs.readFileSync(path.join(__dirname, "latex.hsnips"), "utf8");
const snippets = parse(source).sort((a,b) => b.priority - a.priority);
assert.equal(snippets.length, (source.match(/^snippet /gm) || []).length, "Parser silently dropped a snippet");
assert.ok(snippets.length >= 190);
assert.ok(!/\$\{\d+:/.test(source), "Default-valued placeholders are not tracked by HyperSnips 0.2.9");
let checks = 0;
const mathPrefix = "\\begin{document}\n\\[\n";

function completion(input) {
    const document = new Document(input);
    const position = document.positionAt(input.length);
    const editor = {document, selection: {active: position}};
    vscode.window.activeTextEditor = editor;
    return {result: getCompletions(document, position, snippets), editor, document};
}
function expansion(input) {
    const {result, editor, document} = completion(input);
    assert.ok(!Array.isArray(result), "No automatic expansion for: " + input);
    const instance = new HSnippetInstance(result.snippet, editor, result.range.start, result.groups);
    const prefix = document.getText(new Range(new Position(0,0), result.range.start));
    // Decode precisely the escape forms accepted by VS Code's SnippetParser.
    const nativeText = instance.snippetString.value.replace(/\\([$}\\])/g, "$1");
    return {text: prefix + nativeText, instance, snippet: result.snippet};
}
function expect(trigger, body, prefix = mathPrefix) {
    const actual = expansion(prefix + trigger);
    assert.equal(actual.text, prefix + body, trigger);
    checks++;
    return actual;
}
function noAuto(input) {
    assert.ok(Array.isArray(completion(input).result), "Unexpected expansion in: " + input);
    checks++;
}

expect("mk", "\\($1\\)$0", "");
expect("dm", "\\[\n    $1\n\\]\n$0", "");
expect("xsr", "x^{2}$0");
expect("xcb", "x^{3}$0");
expect("xrd", "x^{$1}$0");
expect("sq", "\\sqrt{$1}$0");
expect("3rt", "\\sqrt[3]{$1}$0");
expect("//", "\\frac{$1}{$2}$0");
expect("x/", "\\frac{x}{$1}$0");
expect("(a+b(c+d))/", "\\frac{a+b(c+d)}{$1}$0");
expect("x_{2}/", "\\frac{x_{2}}{$1}$0");
expect("\\frac{a}{b}/", "\\frac{\\frac{a}{b}}{$1}$0");
expect("x2", "x_{2}$0");
expect("x_{2}3", "x_{23}$0");
expect("\\alpha3", "\\alpha_{3}$0");
expect("@a", "\\alpha $0");
expect("@t", "\\theta $0");
expect(":e", "\\varepsilon $0");
expect("pi", "\\pi $0");
expect("tau", "\\tau $0");
expect("sin", "\\sin $0");
expect("arcsin", "\\arcsin $0");
expect("\\sin h", "\\sinh $0");
expect("\\sin c", "\\operatorname{sinc} $0");
expect("xhat", "\\hat{x}$0");
expect("xddot", "\\ddot{x}$0");
expect("ddot", "\\ddot{$1}$0");
expect("cdot", "\\cdot $0");
expect("<->", "\\leftrightarrow $0");
expect("par3", "\\frac{\\partial^{3} $1}{\\partial $2^{3}}$0");
expect("iden2", "\\begin{pmatrix}\n1 & 0 \\\\\n0 & 1\n\\end{pmatrix}$0");
expect("lr(", "\\left( $1 \\right)$0");
expect("lr{", "\\left\\lbrace $1 \\right\\rbrace$0");
expect("set", "\\lbrace $1 \\rbrace$0");
expect("pmat", "\\begin{pmatrix}\n    $1\n\\end{pmatrix}$0");
expect("align", "\\begin{aligned}\n    $1\n\\end{aligned}$0");
expect("array", "\\begin{array}{$1}\n    $2\n\\end{array}$0");
expect("deg", "^{\\circ}$0");
for (const command of ["\\alpha", "\\sqrt", "\\frac", "\\sum", "\\iiint", "\\arcsin", "\\mathrm", "\\text", "\\operatorname"]) noAuto(mathPrefix + command);
for (const trigger of ["sq", "xsr", "@a", "sum", "pi"]) noAuto("Ordinary prose: " + trigger);
noAuto("bookmarkmk");
noAuto(mathPrefix + "% comment xsr");
noAuto(mathPrefix + "\\text{ordinary xsr");
noAuto(mathPrefix + "\\operatorname{sinc");
noAuto("\\begin{notecode}\nfloat xsr");
noAuto("\\begin{verbatim}\n@a");
noAuto("\\verb|@a");
noAuto("Cost \\$5 sq");
noAuto("\\keyequation{Title @a");
noAuto("\\keyequation{Title}{x}[Note @a");
noAuto("\\begin{notederivation}{Title @a");
noAuto("\\[");
expect("@t", "\\theta $0", "\\keyequation{Title}{");
expect("xsr", "x^{2}$0", "\\keyequation{A {nested} title}{\\frac{a}{b} + ");
expect("sq", "\\sqrt{$1}$0", "\\begin{notederivation}{A derivation}\n & ");
expect("sq", "\\sqrt{$1}$0", "\\begin{align*}\n");
expect("@a", "\\alpha $0", "$x + ");
expect("@a", "\\alpha $0", "$$x + ");
expect("@a", "\\alpha $0", "\\(x + ");
expect("@a", "\\alpha $0", mathPrefix + "\\text{nested math $ ");
expect("(", "($1)$0");
expect("{", "{$1}$0", mathPrefix + "\\sqrt");
expect("{", "{$1}$0", "\\keyequation");
expect('"', "\\text{$1}$0");
expect(";def", "\\notedefinition{$1}{$2}\n$0", "");
expect(";sum", "\\sum_{n=-\\infty}^{\\infty}$0", "");
expect(";sec", "\\notesection{$1}\n$0", "");
expect(";sub", "\\subnotesection{$1}\n$0", "");
for (let level = 1; level <= 5; level++) {
    const heading = expect(`;h${level}`, `\\noteheading{${level}}{$1}\n$0`, "");
    assert.deepEqual(heading.instance.placeholderIds, [1, 0]);
    expect(`;h${level}`, `\\noteheading{${level}}{$1}\n$0`, "    ");
    noAuto("Ordinary prose: " + `;h${level}`);
    const mathCompletion = completion(mathPrefix + `;h${level}`).result;
    const mathMatches = Array.isArray(mathCompletion) ? mathCompletion : [mathCompletion];
    assert.ok(mathMatches.every(match => match.snippet.trigger !== `;h${level}`), "Heading expanded inside math");
    checks++;
    noAuto("% " + `;h${level}`);
    noAuto("\\begin{notecode}\n" + `;h${level}`);
    let typed = "";
    for (const char of `;h${level}`) {
        typed += char;
        if (!Array.isArray(completion(typed).result)) typed = expansion(typed).text;
    }
    assert.equal(typed, `\\noteheading{${level}}{$1}\n$0`, "Sequential heading trigger");
    checks++;
}
noAuto(";h6");
expect(";nav", "\\notesetup{toc-depth=$1,bookmark-depth=$2}\n$0", "");
expect(";hbm", "\\noteheading[bookmark={$1}]{$2}{$3}\n$0", "");
const figureSnippet = expect(";fig", "\\par\\addvspace{7pt}\n\\noindent\\begin{minipage}{\\linewidth}\n    \\centering\n    \\captionsetup{hypcap=false,type=figure}\n    \\includegraphics[width=0.8\\linewidth,height=65mm,keepaspectratio]{figures/$1}\n    \\caption{$2}\n    \\label{fig:$3}\n\\end{minipage}\n\\par\\addvspace{7pt}\n$0", "");
assert.deepEqual(figureSnippet.instance.placeholderIds, [1, 2, 3, 0], "Figure fields must be path, caption, label, then exit");
assert.equal(figureSnippet.instance.selectedPlaceholder, 1, "Figure starts in the image path");
checks += 2;
expect(";drv", "\\begin{notederivation}[mode=steps]{$1}\n    \\derivestep{$2}{$3}\n\\end{notederivation}\n$0", "");
expect(";step", "\\derivestep{$1}{$2}\n$0", "\\begin{notederivation}[mode=steps]{Title}\n");
expect("sq", "\\sqrt{$1}$0", "\\begin{notederivation}[explanation=beside]{Title}\n & ");
expect("@a", "\\alpha $0", "\\begin{notederivation}[mode=steps]{Title}\n\\derivestep{");
noAuto("\\begin{notederivation}[mode=steps]{Title}\n\\derivestep{x}{Ordinary pi");
noAuto("\\begin{notederivation}[mode=steps]{Title @a");
noAuto("\\begin{notederivation}[explanation=beside @a");
noAuto("\\begin{notederivation}{Title}\n\\derivestep{x}{Ordinary pi");
expect(";cir", "\\begin{notecircuit}{$1}\n    $2\n\\end{notecircuit}\n$0", "");
expect(";cset", "\\notesetup{circuit-preset=$1}\n$0", "");
expect(";cur", "\\draw[note-current] ($1)--($2);\n$0", "");
expect(";mark", "\\draw[note-highlight] $1;\n$0", "");
for (const columns of [2, 3]) {
    const body = `\\begin{notepanels}[columns=${columns},gap=6mm]\n`
        + Array.from({length:columns}, (_, i) => `    \\begin{notepanel}{$${2*i+1}}\n        $${2*i+2}\n    \\end{notepanel}\n`).join("")
        + "\\end{notepanels}\n$0";
    const panel = expect(`;pan${columns}`, body, "");
    assert.deepEqual(panel.instance.placeholderIds, [...Array.from({length:columns*2}, (_,i)=>i+1),0]);
}
expect(";panel", "\\begin{notepanel}{$1}\n    $2\n\\end{notepanel}\n$0", "");
for (const trigger of [";pan2", ";pan3", ";drv", ";fig", ";nav", ";hbm", ";cset", ";cir", ";cur", ";mark"]) {
    noAuto("Ordinary prose: " + trigger);
    noAuto("% " + trigger);
    noAuto("\\begin{notecode}\n" + trigger);
    let typed = "";
    for (const char of trigger) {
        typed += char;
        if (!Array.isArray(completion(typed).result)) typed = expansion(typed).text;
    }
    assert.equal(typed, expansion(trigger).text, "Sequential feature trigger: " + trigger);
    checks++;
}
noAuto("\\begin{notecode}\n;def");
noAuto("% ;sum");
for (const [trigger, description] of [["par", "Partial derivative (Tab)"], ["\\sum", "sum limits (Tab)"], ["\\int", "Integral with differential (Tab)"]]) {
    const {result, editor} = completion(mathPrefix + trigger);
    assert.ok(Array.isArray(result));
    const match = result.find(item => item.snippet.description === description);
    assert.ok(match, "Missing manual completion: " + description);
    const instance = new HSnippetInstance(match.snippet, editor, match.range.start, match.groups);
    assert.equal(instance.placeholderIds.at(-1), 0);
    assert.ok(instance.placeholderIds.includes(1));
    checks++;
}
const fraction = expect("//", "\\frac{$1}{$2}$0");
assert.deepEqual(fraction.instance.placeholderIds, [1, 2, 0]);
// Exercise the dynamic mirror used for a generic environment's closing name.
const {result: environmentCompletions, editor: environmentEditor} = completion("beg");
const environmentMatch = environmentCompletions.find(item => item.snippet.description === "Environment (choose its name)");
const environment = new HSnippetInstance(environmentMatch.snippet, environmentEditor, environmentMatch.range.start, environmentMatch.groups);
const [parts, dynamic] = environment.runCodeBlocks(false, ["align*"]);
assert.ok(parts.map(part => typeof part === "string" ? part : dynamic[part.block]).join("").includes("\\end{align*}"));
checks++;

// Check sequential automatic expansions, with native bracket/quote pairing
// disabled by the workspace settings. Literal spaces preserve argument intent.
for (const [input, expected] of [["sinh", "\\sinh "], ["sinc", "\\operatorname{sinc} "], ["sin c", "\\sin  c"], ["x23", "x_{23}"], ["@a3", "\\alpha_{3}"], ["iiint", "\\iiint "]]) {
    let typed = "";
    for (const char of input) {
        typed += char;
        const {result} = completion(mathPrefix + typed);
        if (!Array.isArray(result)) typed = expansion(mathPrefix + typed).text.slice(mathPrefix.length).replace(/\$0/g, "");
    }
    assert.equal(typed, expected, "Sequential typing: " + input);
    checks++;
}
Module._load = originalLoad;
console.log(`PASS: ${snippets.length} snippets parsed by HyperSnips; ${checks} expansion, context, overlap, and placeholder checks.`);

if (process.argv.includes("--compile")) {
    const {spawnSync} = require("node:child_process");
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), "latex-suite-check-"));
    const style = process.env.LATEX_STYLE || path.resolve(__dirname, "../../ELE745/lecture-02/lecturenotes.sty");
    fs.copyFileSync(style, path.join(directory, "lecturenotes.sty"));
    fs.mkdirSync(path.join(directory, "figures"));
    const figureDir = path.resolve(__dirname, "../../ELE745/lecture-02/figures");
    const figure = fs.readdirSync(figureDir).find(name => name.endsWith(".png"));
    fs.copyFileSync(path.join(figureDir, figure), path.join(directory, "figures", "sample.png"));
    const fill = (trigger, values = {}, prefix = mathPrefix) => {
        const raw = expansion(prefix + trigger).text.slice(prefix.length);
        return raw.replace(/\$(\d+)/g, (_, index) => values[index] || "");
    };
    const samples = [
        fill("sq", {1:"x"}), fill("3rt", {1:"x"}), fill("//", {1:"a",2:"b"}),
        fill("(a+b(c+d))/", {1:"x"}), fill("x2"), fill("@a"), fill("pi"),
        fill("par3", {1:"f",2:"x"}), fill("iden2"),
        fill("pmat", {1:"1 & 2 \\\\ 3 & 4"}),
        fill("cases", {1:"x & x > 0 \\\\ 0 & \\text{otherwise}"}),
        fill("array", {1:"cc",2:"1 & 2 \\\\ 3 & 4"}),
        fill("align", {1:"x &= y \\\\ y &= z"}),
        fill("lr{", {1:"x"}), fill("set", {1:"1,2,3"}), fill("RR"), fill("deg"),
        fill("dint", {1:"0",2:"1",3:"x^2",4:"x"}), fill("bra", {1:"x"}),
        fill("iso", {1:"4",2:"2",3:"He"})
    ];
    const document = "\\documentclass{article}\n\\usepackage{lecturenotes}\n\\lectureheader{Snippets}{1}\n\\begin{document}\n\\tableofcontents\n\\clearpage\n"
        + [1, 2, 3, 4, 5].map(level => fill(`;h${level}`, {1:`Generated heading ${level}`}, "")).join("\n")
        + fill("mk", {1:"x+1"}, "") + "\n"
        + samples.map(sample => "\\["+sample+"\\]\n").join("")
        + fill(";keq", {1:"Generated equation",2:"x^2+y^2"}, "")
        + fill(";der", {1:"Generated derivation",2:"x=y",3:"Equality"}, "")
        + fill(";drv", {1:"Wrapping derivation",2:"x=y",3:"An explanation that wraps as normal text below the equation."}, "")
        + fill(";pan2", {1:"First",2:"First panel",3:"Second",4:"Second panel"}, "")
        + fill(";pan3", {1:"One",2:"First panel",3:"Two",4:"Second panel",5:"Three",6:"Third panel"}, "")
        + fill(";fig", {1:"sample.png",2:"Generated figure",3:"generated"}, "")
        + "Figure reference: \\ref{fig:generated}.\n"
        + fill(";cset", {1:"compact"}, "")
        + fill(";cir", {1:"Generated circuit",2:"\\draw (0,0) to[R] (2,0);"}, "")
        + fill(";tbl", {1:"ll",2:"Symbol & Meaning",3:"$x$ & Value"}, "")
        + "\\end{document}\n";
    fs.writeFileSync(path.join(directory,"lecture.tex"), document);
    for (let pass = 0; pass < 2; pass++) {
        const result = spawnSync("pdflatex", ["-interaction=nonstopmode", "-halt-on-error", "-file-line-error", "lecture.tex"], {cwd:directory, encoding:"utf8"});
        assert.equal(result.status, 0, result.error?.message || result.stdout?.slice(-6000) || result.stderr);
    }
    const result = spawnSync("pdftotext", ["-f", "1", "-l", "1", "lecture.pdf", "-"], {cwd:directory, encoding:"utf8"});
    assert.equal(result.status, 0, result.error?.message || result.stderr);
    for (let level = 1; level <= 5; level++) assert.ok(result.stdout.includes(`Generated heading ${level}`), "Missing heading in rendered contents");
    const fullText = spawnSync("pdftotext", ["lecture.pdf", "-"], {cwd:directory, encoding:"utf8"});
    assert.equal(fullText.status, 0, fullText.error?.message || fullText.stderr);
    const text = fullText.stdout.replace(/\s+/g, " ");
    assert.ok(text.includes("Figure 1: Generated figure"), "Figure must display the caption field");
    assert.ok(text.includes("Figure reference: 1."), "Figure label must resolve independently");
    assert.ok(!text.includes("sample.png"), "Image filename must not become the figure caption");
    console.log("PASS: generated LaTeX compiles, including all five headings and contents entries, matrices, cases, custom lecture blocks, and table row endings.");
    console.log("Compilation fixture: " + directory);
}
