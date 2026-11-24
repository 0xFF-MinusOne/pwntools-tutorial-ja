# 高度なシェルコード

**注意**: まず[基本](../shellcode-basic/README.md)と[中級](../shellcode-intermediate/README.md)のチュートリアルを確認してください。

新しいモジュールを作って `shellcraft` から使えるようにするには、いくつかの手順を踏むだけです。

まず、`shellcraft` のテンプレートはすべて、実は [Mako][mako] テンプレートです。通常、Mako は Python の Web サーバーでサーバーサイドのスクリプトに使われますが、任意のシェルコード断片をつなぎ合わせる用途にもよく合います。

テンプレートはすべて `pwnlib/shellcraft/templates/ARCH/OS` ディレクトリにあります。たとえば `$ shellcraft i386.linux.sh` は、実際には [`pwnlib/shellcraft/templates/i386/linux/sh.asm`][sh] で定義されたテンプレートを呼び出しています。

## シンタックスハイライト

シンタックスハイライトがあると、テンプレートが読みやすくなります。Pwntools には、Sublime Text / TextMate 向けの[シンタックスハイライト](https://github.com/Gallopsled/pwntools/blob/master/extra/textmate/README.md)プラグインがあります。

## 単純なテンプレートの構造

Pwntools のテンプレートの一般的な形式は、以下のとおりです。
特に、構文について注意すべき点がいくつかあります。

- `<%` と `%>` は Python のコードブロックを囲みます
- `<%tag>` と `</%tag>` は、Pwntools または Mako が定義する特別なタグを囲みます
    + これらは関数ラッパーを生成するために使われます
- `${...}` は Python の式です
    - `${var}` は Python の変数に置き換えられます(`str()` または `%s` を通した値になります)
    - `${function(...)}` も同様で、戻り値がその場所に挿入されます
        + Mako テンプレートは単に文字列を出力するので、入れ子にするのがとても簡単です。
- `##` で始まる行は Mako に無視されます
- それ以外はすべてそのまま出力されます。

以下のテンプレートを `pwnlib/shellcraft/templates/i386/linux/demo.asm` にコピーすると、Python からでもコマンドラインツールからでも呼び出せます。

```sh
$ shellcraft i386.linux.demo 1 hello 1
6a6f6868656c6c6a015f89fb89e16a055a6a0458cd80ebfe
$ shellcraft i386.linux.demo 1 hello 1 -f asm | head -n3
    /* Push the message onto the stack */
    /* push 'hello\x00' */
    push 0x6f
...
```

### テンプレートのサンプル

```
<%
# constants モジュールを使うと、ユーザーが文字列 'SYS_execve' を渡しても、
# それを整数値に解決できます。
#
# たとえば i386 では、constants.eval('SYS_execve') == 11 です。
from pwnlib import constants

# Pushstr を使うと、出力されるアセンブリに NULL や改行を含めずに、
# 文字列をスタックに積めます。
from pwnlib.shellcraft.i386 import pushstr

# Mov を使うと、どちらの動作になるかを気にせずに、
# レジスタへ値を、またはレジスタ間で値を mov できます。
# これも一般に NULL と改行を含みません。
#
# i386 ではどれも同じ命令なので大きな問題ではありませんが、
# RISC アーキテクチャでは事実上必須です。
from pwnlib.shellcraft.i386 import mov

# Linux のシステムコールにはすべて、小さなラッパーテンプレートがあります。
# これらは今度は "syscall" テンプレートのラッパーです。
# syscall テンプレートはさらに "mov" テンプレートのラッパーで、
# 値を適切なレジスタに移します。
#
# 一部のコードが重複したとしても、"write" システムコールのラッパーを使うほうが、
# すべてを手で書き出すよりずっと便利です。
from pwnlib.shellcraft.i386.linux import write

# label テンプレートを使うと、すべてのラベルが一意になることを保証できます。
# 同じシェルコードが複数回インクルードされる場合に重要で、
# 単純なループではよくあることです。
from pwnlib.shellcraft.common import label
%>

## arguments セクションでは、テンプレートの引数を指定できます。
## これらは Python の関数ラッパーの引数になります。
<%page args="sock, message, spin=False"/>

## docstring は利用者に役立つ情報になりますが、必須ではありません。
## これは "shellcraft ... -?" で表示されます。
<%docstring>
Sends a message to a file descriptor, and then loops forever!

Arguments:
    sock(int,reg): Socket to send the message over
    message(str): Message to send
    spin(bool): Infinite loop after sending the message

</%docstring>

## テンプレートには Python のロジックを直接埋め込めます。
## ブロック内で作った変数や関数は、
## テンプレート内ですぐに使えます。
<%
    target = label('target')

    # 'mov' テンプレートに渡すだけなので、これは必要ありません
    # (mov テンプレートがすでにこれを行っています)。
    # デモのためだけに書いています。
    sock = constants.eval(sock)
%>

## 他のテンプレートは Python の関数呼び出しとして挿入します。
    /* Push the message onto the stack */
    ${pushstr(message)}

    /* Set the socket into edi for fun */
    ${mov('edi', sock)}

    /* Invoke the write syscall */
    ${write('edi', 'esp', len(message))}

## テンプレートには条件分岐を含めて、
## 特定のセクションを含めたり除いたりできます。
%if spin:
    /* Loop forever */
${target}:
    jmp ${target}
%endif
```

## ヒントとベストプラクティス

テンプレートの一般的な「良いスタイル」について、いくつか注意点があります。

- 定数のラベルの代わりに `common.label` を使うことが推奨されます。シェルコードテンプレートが複数回使われても、`common.label` がラベル名を一意にしてくれるからです。
- 車輪の再発明をせず、ヘルパー関数の `mov`、`pushstr`、`syscall`、および `syscall` のラッパー(下で使っている `write` など)を使ってください
    + アーキテクチャによっては、これらは NULL や改行を含まないシェルコードを出力します
    + これら自体も、ロジックを持つ別のシェルコードテンプレートにすぎません
- 整数のフィールドはすべて `constants.eval` を通すと、よく知られた定数値を代わりに使えます。
    + `constants.eval("SYS_execve") ==> int`
    + `int(constants.SYS_execve) ==> int`
    + `mov` など別のテンプレートに渡すだけの場合は、すでに処理されています。

# FAQ とよくある問題

## "Reserved words declared in template"

`loop` という名前の変数などは使えません。これは Mako の制限です。

## テンプレートのキャッシュ

Mako のテンプレートキャッシュが問題になることがあります。Pwntools をできるだけ高速にするため、コンパイル済みのテンプレートはキャッシュされます。これは新しいシェルコードの開発では負担になることもありますが、一般には有用です。

おかしな問題が起きたら、`~/.pwntools-cache/mako`(または `~/.pwntools-cache/mako`)のキャッシュを消してみてください。

[mako]: http://makotemplates.org
[sh]: https://github.com/Gallopsled/pwntools/blob/master/pwnlib/shellcraft/templates/i386/linux/sh.asm
