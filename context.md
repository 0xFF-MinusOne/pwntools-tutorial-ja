目次
=====

  * [コンテキスト (Context)](#context)
    * [コンテキストの設定](#context-settings)
      * [arch](#arch)
      * [bits](#bits)
      * [binary](#binary)
      * [endian](#endian)
      * [log_file](#log_file)
      * [log_level](#log_level)
      * [sign](#sign)
      * [terminal](#terminal)
      * [timeout](#timeout)
      * [update](#update)

<a id="context"></a>
# コンテキスト (Context)

`context` オブジェクトは、スレッドを考慮したグローバルなオブジェクトで、`pwntools` が使うさまざまな設定を保持しています。

たいていのエクスプロイトの冒頭には、次のようなコードがあります。

```py
from pwn import *
context.arch = 'amd64'
```

これは、生成するシェルコードが `amd64` 向けであること、既定のワードサイズが 64 ビットであることを pwntools に伝えます。

<a id="context-settings"></a>
## コンテキストの設定

### arch

対象のアーキテクチャです。有効な値は `"aarch64"`、`"arm"`、`"i386"`、`"amd64"` などです。既定値は `"i386"` です。

最初にこれを設定したとき、`context.bits` と `context.endian` の既定値が、もっともありそうな値に自動で設定されます。

### bits

対象のバイナリで 1 ワードが何ビットかを表します。たとえば 32 や 64 です。

### binary

ELF ファイルから設定を取り込みます。たとえば `context.binary='/bin/sh'` のように使います。

### endian

必要に応じて `"big"` か `"little"` (既定値) を設定します。

### log_file

すべてのログ出力の送り先ファイルです。

### log_level

ログの詳細度です。有効な値は整数 (小さいほど詳細) と、`"debug"`、`"info"`、`"error"` のような文字列です。

### sign

整数のパック / アンパックにおける符号の有無の既定値を設定します。既定値は `"unsigned"` です。

### terminal

新しいウィンドウを開くときに使う端末プログラムです。既定では `x-terminal-emulator` か `tmux` を使います。

### timeout

tube の操作に対する既定のタイムアウトです。

### update

複数の値を一度に設定します。たとえば `context.update(arch='mips', bits=64, endian='big')` です。
