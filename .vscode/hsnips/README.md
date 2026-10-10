# LaTeX Suite-style shortcuts

These workspace-local HyperSnips shortcuts follow the common defaults from
[Obsidian LaTeX Suite](https://github.com/artisticat1/obsidian-latex-suite/blob/main/src/default_snippets.js),
adapted for `.tex` files and the lecture-note commands in this repository.

For exact block calls, options, and rendered results, open the
[Block Reference](../../typesetting-block-reference.pdf). Its final page is a
quick lookup for the block shortcuts below.

Open `school-notes` as your VS Code workspace. Most shortcuts expand automatically
as you type. Press **Tab** to advance to the next field, **Shift+Tab** to go back,
and **Escape** to leave the current snippet. For the few manual completions,
accept the matching suggestion with Tab (Ctrl+Space shows suggestions).

After an external edit to the snippet file, run **HyperSnips: Reload Snippets**
from the Command Palette. Saving the `.hsnips` file inside VS Code also reloads it.

## Entering math

| Type in prose | Result |
| --- | --- |
| `mk` | `\(...\)` with the cursor inside |
| `dm` | A multiline `\[...\]` display |
| `beg`, then Tab | A generic `\begin{...}` / `\end{...}` environment with a linked name |

The math shortcuts below work inside `$...$`, `$$...$$`, `\(...\)`, `\[...\]`,
standard math environments, the second argument of `\keyequation`, and the body
of `notederivation`. They stay inactive in prose, comments, code/verbatim blocks,
equation titles, and text arguments such as `\text{...}` or `\operatorname{...}`.
Commands typed with a backslash, such as `\sqrt` and `\sum`, are protected.

## Common math shortcuts

| Type | Result |
| --- | --- |
| `xsr`, `xcb`, `xrd` | `x^{2}`, `x^{3}`, `x^{...}` |
| `_`, `^`, `sts` | Subscript, superscript, text subscript |
| `sq`, `3rt` | Square root, cube root |
| `//` or `frac` | Fraction with numerator and denominator fields |
| `x/`, `(a+b(c+d))/` | Fraction with the numerator filled; type the denominator, then Tab |
| `x2`, `x23`, `@a3` | `x_{2}`, `x_{23}`, `\alpha_{3}` |
| `ee`, `invs`, `conj` | Exponential, inverse, conjugate |
| `text` or `"` | `\text{...}` |
| `bf`, `rm` | `\mathbf{...}`, `\mathrm{...}` |
| `xhat`, `xbar`, `xdot`, `xddot`, `xvec` | Accent the preceding variable |
| `hat`, `bar`, `dot`, `ddot`, `tilde`, `und`, `vec` | Accent with a field |
| `sum`, `prod` | `\sum`, `\prod` |
| `\sum`, `\prod`, then Tab | Add lower and upper limits |
| `lim` | Limit with variable and target fields |
| `par`, then Tab | Partial derivative |
| `par3`, `parn`, `ddt` | Higher partial derivatives, time derivative |
| `int`, `oint`, `iint`, `iiint` | Integral operators |
| `\int`, then Tab | Integral with integrand and differential fields |
| `dint`, `oinf`, `infi` | Definite integral, integral from zero to infinity, integral on the real line |
| `sin`, `cos`, `tan`, `log`, `ln`, `exp` | Properly formatted operators |
| `sinh`, `cosh`, `tanh`, `sinc` | Hyperbolic and sinc functions |
| `ooo`, `xx`, `**`, `+-` | Infinity, multiplication, dot product, plus/minus |
| `!=`, `>=`, `<=`, `===` | Relations |
| `->`, `<->`, `=>`, `!>` | Arrows |
| `inn`, `notin`, `sub=`, `sup=`, `and`, `orr` | Set relations, intersection, union |
| `RR`, `CC`, `ZZ`, `NN`, `QQ` | Number spaces |
| `pmat`, `bmat`, `Bmat`, `vmat`, `Vmat`, `matrix` | Matrix environments |
| `iden3` | A filled 3-by-3 identity matrix; dimensions 1 through 9 are supported |
| `cases`, `array`, `align` | Cases, array with a column-specification field, `aligned` |
| `lr(`, `lr[`, `lr{`, `lr\|`, `lra` | Automatically sized delimiters |
| `avg`, `norm`, `Norm`, `ceil`, `floor`, `mod`, `set` | Paired mathematical delimiters |
| `deg`, `dag`, `bra`, `ket`, `brk`, `outer` | Degrees, dagger, bra/ket notation |

Auto-fractions recognize atoms, scripts, function calls, and parentheses/braces
nested up to four levels. Use `//` for other expressions.

Operator and Greek expansions add a separating space. When typing a function's
argument, type a space explicitly: `sin c` becomes `\sin c`; continuous `sinc`
becomes `\operatorname{sinc}`.

## Greek letters

| Type | Letter | Type | Letter |
| --- | --- | --- | --- |
| `@a` | alpha | `@b` | beta |
| `@g`, `@G` | gamma, Gamma | `@d`, `@D` | delta, Delta |
| `@e`, `:e` | epsilon, varepsilon | `@z` | zeta |
| `@t`, `@T`, `:t` | theta, Theta, vartheta | `@i` | iota |
| `@k` | kappa | `@l`, `@L` | lambda, Lambda |
| `@m`, `@n` | mu, nu | `@p`, `@P` | pi, Pi |
| `@r` | rho | `@s`, `@S` | sigma, Sigma |
| `@u`, `@U` | upsilon, Upsilon | `@f`, `@F`, `:f` | phi, Phi, varphi |
| `@c` | chi | `@y`, `@Y` | psi, Psi |
| `@o`, `@O` | omega, Omega | `@h` | eta |

Full Greek names such as `tau` and `pi` also add their backslash automatically.
Use `@o` or `ome` for omega, since `ome` already expands before the rest of
`omega` can be typed.

## Lecture blocks

Type these at the beginning of a line, optionally after indentation:

| Type | Block |
| --- | --- |
| `;sec`, `;sub` | Topic and subtopic headings |
| `;h1` through `;h5` | `\noteheading{1}{title}` through `\noteheading{5}{title}` |
| `;def` | `\notedefinition{title}{body}` |
| `;keq` | `\keyequation{title}{math}` |
| `;der` | `notederivation` with an optional explanation column |
| `;fig` | Inline `\includegraphics` with image-path completion, caption, label, and size limits |
| `;tbl` | Notes table with columns, header, and row fields |
| `;pan2`, `;pan3`, `;panel` | Two/three titled columns, or an additional panel |
| `;drv`, `;step` | Wrapping derivation, or an additional equation/explanation step |
| `;cset`, `;cir` | Circuit preset (`none`, `compact`, `standard`) and circuit block |
| `;cur`, `;mark` | Compact current marker and connection highlight |
| `;nav`, `;hbm` | Navigation depths and a heading with a plain bookmark title |

The heading shortcuts expand automatically at the beginning of a line. Type
the title, then press Tab to move to the following line. Level 1 is the main
topic, level 2 is a subtopic, and levels 3 through 5 nest further below it.
All five levels appear in the contents and PDF outline by default. `;nav`
sets their depths independently; all headings remain in the lecture body.
`;hbm` provides a plain sidebar title for a printed mathematical heading.
`;sec` and `;sub`
remain available. Use **HyperSnips: Reload Snippets** after updating this file.

The new blocks require `lecturenotes.sty` v0.2.0. `;drv` selects `mode=steps`
so math shortcuts expand inside each equation and explanations stay in prose.
`;der` retains its original expansion. Panel widths can be customized with
`widths={2,1}`; use `placement=float` on a standard figure for normal LaTeX
floating placement. Inline placement keeps the image with its caption.

`;sum` keeps its previous expansion `\sum_{n=-\infty}^{\infty}` in any editable
context. Use `sq` for the root shortcut. Bare `sqrt` is superseded by the earlier
`sq` expansion; an explicitly typed `\sqrt` continues to work normally.

## VS Code behavior

The LaTeX workspace settings disable native bracket/quote insertion and let the
snippets supply paired brackets and text quotes. This keeps each typed trigger
as a single-character edit, which HyperSnips needs for automatic expansion.
Ordinary brackets still get a paired closing character; Tab exits the pair.
Suggestion popups are suppressed inside snippet fields to keep Tab navigation
predictable; Ctrl+Space still requests suggestions.

This ports shortcuts, not Obsidian's editor extensions. Matrix cells and rows
use ordinary LaTeX `&` and `\\`; Tab advances snippet fields. Selection wrapping,
concealment, and Obsidian's matrix-specific Enter/Tab bindings are not included.
The LaTeX adaptations use `\lbrace`/`\rbrace` and `\tabularnewline` where needed
to preserve literal TeX through VS Code's snippet escaping.

## Verification

With Node.js and HyperSnips installed:

```powershell
node .vscode/hsnips/check-snippets.cjs
node .vscode/hsnips/check-snippets.cjs --compile
```

The checks use the installed HyperSnips parser, completion matching, and
snippet-instance generator. They cover expansions, trigger collisions,
protected commands, math/prose boundaries, custom lecture commands, and Tab
fields. `--compile` also builds generated LaTeX with pdfLaTeX and the existing
ELE745 lecture style. Set `LATEX_STYLE` to another `lecturenotes.sty` to use it
instead, or `HSNIPS_EXTENSION_DIR` to a specific installed extension directory.

The upstream shortcut definitions are MIT licensed; see
[the attribution and license](LICENSE.latex-suite.txt).
