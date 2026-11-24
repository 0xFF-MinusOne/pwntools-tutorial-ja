目次
=====

  * [ログ出力](#logging)
  	* [関数](#functions)
    * [コマンドライン](#command-line)
    * [コンテキスト](#context)
    * [Tubes](#tubes)
    * [スコープ指定](#scoped)

<a id="logging"></a>
# ログ出力 (Logging)

Pwntools には、豊富な内部デバッグの仕組みがあります。自分のデバッグにも、
Pwntools の裏側で何が起きているかを調べるのにも使えます。

<a id="functions"></a>
## 関数

`from pwn import *` でインポートすると、ログ出力の機能が使えるようになります。
次のルーチンが公開されます。

* `error`
* `warn`
* `info`
* `debug`

For example:

```py
>>> warn('Warning!')
[!] Warning!
>>> info('Info!')
[*] Info!
>>> debug('Debug!')
```

既定のログレベルが "info" のため、最後の行は既定では表示されないことに注意してください。

エクスプロイトのスクリプトでは、`print` の代わりにこれらを使えます。そうすると、
表示するデバッグ情報の量を細かく調整できます。

どのログメッセージを表示するかは、さまざまな方法で制御できます。
すべて以下で説明します。

<a id="command-line"></a>
## コマンドライン

ログを最も詳細にするいちばん簡単な方法は、
`DEBUG` という特別な引数を付けてスクリプトを実行することです。たとえば次のようにします。

```
$ python exploit.py DEBUG
```

これは、送受信される正確なバイト列や、エクスプロイトを動かすために
pwntools の内部で起きていることを見るのに便利です。

<a id="context"></a>
## コンテキスト

ログの詳細度は `context.log_level` でも設定できます。これは、対象のアーキテクチャなどを
設定するのと同じ方法です。
コマンドラインの場合と同じように、すべてのログ出力文を制御します。

```py
>>> context.log_level = 'debug'
```

### `log_console`

既定では、すべてのログは STDOUT に出力されます。これを別のファイル、
たとえば STDERR に変更したい場合は、`log_console` の設定で変更できます。

```py
>>> context.log_console = sys.stderr
```

### `log_file`

あとで見返すために、ログを `log.txt` のような特定のファイルに出力したいことがあります。
`context.log_file` を設定すると、ログファイルを追加できます。

```py
>>> context.log_file = './log.txt'
```

<a id="tubes"></a>
## Tubes

各 tube は、作成時にログの詳細度を個別に制御できます。
オブジェクトを作るときに `level='...'` を渡すだけです。

```py
>>> io = process('sh', level='debug')
[x] Starting local process '/usr/bin/sh' argv=[b'sh']
[+] Starting local process '/usr/bin/sh' argv=[b'sh'] : pid 34475
>>> io.sendline('echo hello')
[DEBUG] Sent 0xb bytes:
    b'echo hello\n'
>>> io.recvline()
[DEBUG] Received 0x6 bytes:
    b'hello\n'
b'hello\n'
```

これはすべての tube (`process`、`remote` など) で使えます。tube に似たもの
(`gdb.attach` や `gdb.debug` など) や、そのほか多くのルーチンでも使えます。

たとえば、あるシェルコードが*具体的に*どうアセンブルされるかを見たい場合は、次のようにします。

```py
>>> asm('nop', log_level='debug')
[DEBUG] cpp -C -nostdinc -undef -P -I/home/user/pwntools/pwnlib/data/includes /dev/stdin
[DEBUG] Assembling
    .section .shellcode,"awx"
    .global _start
    .global __start
    _start:
    __start:
    .intel_syntax noprefix
    nop
[DEBUG] /usr/bin/x86_64-linux-gnu-as -32 -o /tmp/user/pwn-asm-0yy12n6i/step2 /tmp/user/pwn-asm-0yy12n6i/step1
[DEBUG] /usr/bin/x86_64-linux-gnu-objcopy -j .shellcode -Obinary /tmp/user/pwn-asm-0yy12n6i/step3 /tmp/user/pwn-asm-0yy12n6i/step4
b'\x90'
```

<a id="scoped"></a>
## スコープ指定

すべてのログを有効にしたいけれど、エクスプロイトのスクリプトの一部だけに限りたい、ということがあります。
`context.log_level` を手動で切り替えることもできますし、スコープ付きのヘルパーを使うこともできます。

```py
io = process(...)
with context.local(log_level='debug'):
	# 'with' ブロックの中の処理は詳細にログ出力される
	io.recvall()
```