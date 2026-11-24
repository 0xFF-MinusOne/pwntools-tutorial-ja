目次
=====

  * [前提条件](#prerequisites)
  * [GDB でプロセスを起動する](#launching-a-process-under-gdb)
  * [実行中のプロセスにアタッチする](#attaching-to-a-running-process)
	  * [ローカルプロセス](#local-processes)
	  * [フォークするサーバー](#forking-servers)
  * [他のアーキテクチャのデバッグ](#debugging-foreign-architectures)
  * [トラブルシューティング](#troubleshooting)
	  * [裏側で何が起きているか](#behind-the-scenes)
	  * [端末ウィンドウの指定](#specifying-a-terminal-window)
	  * [環境変数](#environment-variables)
	  * [プロセスにアタッチできない場合](#unable-to-attach-to-processes)
	  * [argv0 and argc==0](#argv0-and-argc0)

Pwntools は、エクスプロイトの作業の流れの中でデバッガを使うことを手厚くサポートしています。
エクスプロイトの開発中に問題が起きたとき、デバッガはとても役に立ちます。

ここにあるデバッグ用の資料に加えて、次のプロジェクトのいずれかで
GDB をより使いやすくするとよいかもしれません。

* [Pwndbg](https://pwndbg.re)
* [GDB Enhanced Features (GEF)](https://github.com/hugsy/gef)

<a id="prerequisites"></a>
# 前提条件

手元のマシンに `gdb` と `gdbserver` の両方をインストールしておく必要があります。
`which gdb` や `which gdbserver` で簡単に確認できます。

インストールされていない場合は、たいていのパッケージマネージャーから
簡単にインストールできます。

```sh
$ sudo apt-get install gdb gdbserver
```

<a id="launching-a-process-under-gdb"></a>
# GDB でプロセスを起動する

プロセスを GDB の下で起動しつつ、pwntools からもそのプロセスとやり取りできるようにするのは
厄介な作業ですが、幸い、すべて整理されていて、
ほとんど違和感なく使えます。

プロセスを最初の命令から GDB の下で起動するには、
[gdb.debug](https://docs.pwntools.com/en/stable/gdb.html#pwnlib.gdb.debug).

```py
>>> io = gdb.debug("/bin/bash", gdbscript='continue')
>>> io.sendline('echo hello')
>>> io.recvline()
# b'hello\n'
>>> io.interactive()
```

これで、デバッガが新しいウィンドウで自動的に起動し、操作できるようになるはずです。
そうならない場合や、`context.terminal` に関するエラーが出る場合は、
[端末ウィンドウの指定](#specifying-a-terminal-window)の節を見てください。

この例では、デバッガが実行を再開するように `gdbscript='continue'` を渡しました。
ただし、有効な GDB スクリプトのコマンドなら何でも渡せます。
それらは、デバッグ対象のプロセスが起動したときに実行されます。

<a id="attaching-to-a-running-process"></a>
# 実行中のプロセスにアタッチする

対象をデバッガの下で起動したくないけれど、エクスプロイトの途中のある段階で
アタッチしたい、ということがあります。  
これも Pwntools が違和感なく処理してくれます。

<a id="local-processes"></a>
## ローカルプロセス

通常は、対象の実行ファイルとやり取りするために `process()` の tube を作っているはずです。
それを `gdb.attach()` に渡すだけで、対象のバイナリがデバッガの下にある状態で
新しい端末ウィンドウが魔法のように開きます。

```py
>>> io = process('/bin/sh')
>>> gdb.attach(io, gdbscript='continue')
```

新しいウィンドウが現れます。プロセスとは、これまでどおり Pwntools からやり取りを続けられます。

<a id="forking-servers"></a>
## フォークするサーバー

デバッグしたいバイナリが、フォークするサーバーであることがあります。そのとき、
(サーバー自体ではなく) 接続先のプロセスをデバッグしたい場合があります。
これも、サーバーが同じマシン上で動いている限り、違和感なく行えます。

socat で擬似的なサーバーを作ってみましょう。

```py
>>> socat = process(['socat', 'TCP-LISTEN:4141,reuseaddr,fork', 'EXEC:/bin/bash -i'])
```

次に、いつもどおり `remote` の tube でリモートのプロセスに接続します。


```py
>>> io = remote('localhost', 4141)
[x] Opening connection to localhost on port 4141
[x] Opening connection to localhost on port 4141: Trying 127.0.0.1
[+] Opening connection to localhost on port 4141: Done
>>> io.sendline('echo hello')
>>> io.recvline()
b'hello\n'
>>> io.lport, io.rport
```

うまくいきました。`remote` オブジェクトの接続先である特定の `bash` プロセスをデバッグするには、
それを `gdb.attach()` に渡すだけです。Pwntools は接続の相手側の PID を調べ、
自動的にそこへ接続しようとします。

```py
>>> gdb.attach(io)
```

デバッガが自動的に現れ、プロセスを操作できます。

<!-- TODO: This is currently broken, see https://github.com/Gallopsled/pwntools/issues/1589 -->

<a id="debugging-foreign-architectures"></a>
# 他のアーキテクチャのデバッグ

Intel ベースのシステム上から、他のアーキテクチャ (ARM や PowerPC など) をデバッグするのは、
pwntools の下でそれらを実行するのと同じくらい簡単です。

```py
>>> context.arch = 'arm'
>>> elf = ELF.from_assembly(shellcraft.echo("Hello, world!\n") + shellcraft.exit())
>>> process(elf.path).recvall()
b'Hello, world!\n'
```

`process(...)` を呼ぶ代わりに、`gdb.debug(...)` を使うだけです。

```py
>>> gdb.debug(elf.path).recvall()
b'Hello, world!\n'
```

<a id="tips-and-limitations"></a>
## ヒントと制限事項

他のアーキテクチャで動くプロセスをデバッグするには、必ず `gdb.debug` で起動する必要があります。
QEMU の仕組み上、実行中のプロセスにアタッチすることはできません。

QEMU の GDB スタブは機能がとても限られていることに注意してください。
このスタブは、各種ライブラリがどこにあるかを GDB に伝えるために使われます。
そのため、デバッグが難しくなることがあり、使えないコマンドもあります。

この状況には Pwndbg を使うことを Pwntools は勧めています。QEMU スタブの下での
デバッグを扱うための専用のコードがあるからです。

<!-- TODO: There is no tutorial for interacting with cross-arch binaries -->

<a id="troubleshooting"></a>
# トラブルシューティング

<a id="behind-the-scenes"></a>
## 裏側で何が起きているか

うまく動かないとき、デバッガの設定で Pwntools の内部で何が起きているかを
見る必要があることがあります。

ログの設定は、グローバルに (たとえば `context.log_level='debug'` で) 指定することも、
同じ引数を渡して GDB のセッションだけに指定することもできます。

裏側であなたの代わりに処理されていることがすべて見えるはずです。
例を示します。

```py
>>> io = gdb.debug('/bin/sh', log_level='debug')
[x] Starting local process '/home/user/bin/gdbserver' argv=[b'/home/user/bin/gdbserver', b'--multi', b'--no-disable-randomization', b'localhost:0', b'/bin/sh']
[+] Starting local process '/home/user/bin/gdbserver' argv=[b'/home/user/bin/gdbserver', b'--multi', b'--no-disable-randomization', b'localhost:0', b'/bin/sh'] : pid 34282
[DEBUG] Received 0x25 bytes:
    b'Process /bin/sh created; pid = 34286\n'
[DEBUG] Received 0x18 bytes:
    b'Listening on port 45145\n'
[DEBUG] Wrote gdb script to '/tmp/user/pwnxcd1zbyx.gdb'
    target remote 127.0.0.1:45145
[*] running in new terminal: /usr/bin/gdb -q  "/bin/sh" -x /tmp/user/pwnxcd1zbyx.gdb
[DEBUG] Launching a new terminal: ['/usr/local/bin/tmux', 'splitw', '/usr/bin/gdb -q  "/bin/sh" -x /tmp/user/pwnxcd1zbyx.gdb']
[DEBUG] Received 0x25 bytes:
    b'Remote debugging from host 127.0.0.1\n'
```


<a id="specifying-a-terminal-window"></a>
## 端末ウィンドウの指定

Pwntools は、現在使っているウィンドウシステムに合わせて、デバッガを入れるための
[新しいウィンドウを起動しようとします][run_in_new_terminal]。  

既定では、次のものを自動検出します。

* tmux または screen
* GNOME Terminal のような X11 ベースの端末

サポートされている端末環境を使っていない場合や、思いどおりに動かない場合
(たとえば水平分割と垂直分割の違いなど) は、
`context.terminal` 環境変数を設定することで対応を追加できます。

たとえば、次の設定では、既定の分割の代わりに TMUX で水平に分割します。

```py
>>> context.terminal = ['tmux', 'splitw', '-h']
```

GNOME Terminal を使っていて、既定の設定がうまく動かない場合はどうでしょう。

```py
>>> context.terminal = ['gnome-terminal', '-x', 'sh', '-c']
```

好きな端末を指定できます。その設定を `~/.pwn.conf` に書いておけば、
すべてのスクリプトで使われます。

```
[context]
terminal=['x-terminal-emulator', '-e']
```

<a id="environment-variables"></a>
## 環境変数

Pwntools では、`process()` を通じて好きな環境変数を指定できます。
`gdb.debug()` でも同じです。

```py
>>> io = gdb.debug(['bash', '-c', 'echo $HELLO'], env={'HELLO': 'WORLD'})
>>> io.recvline()
b'WORLD\n'
```

### `CWD` and `   `

残念ながら、`gdb.debug()` を使うと、プロセスは `gdbserver` の下で起動され、
`gdbserver` が独自の環境変数を追加します。環境をごく慎重に制御する必要がある場合、
これが面倒の原因になることがあります。

```py
>>> io = gdb.debug(['env'], env={'FOO':'BAR'}, gdbscript='continue')
>>> print(io.recvallS())
   =/home/user/bin/gdbserver
FOO=BAR

Child exited with status 0
GDBserver exiting
```

これは、`gdb.debug()` でプロセスをデバッガの下で起動した場合にだけ起こります。
プロセスを先に起動し、*そのあとで* `gdb.attach()` でアタッチできるなら、
この問題は避けられます。

### 環境変数の順序

エクスプロイトによっては、特定の環境変数が特定の順序で並んでいる必要があります。
Python2 の辞書には順序がないので、この問題が悪化することがあります。

環境変数を特定の順序に並べるには、Python3 (辞書が挿入順に並ぶ) を使うか、
`collections.OrderedDict` を使うことをお勧めします。

<a id="unable-to-attach-to-processes"></a>
## プロセスにアタッチできない場合

最近の Linux システムには `ptrace_scope` という設定があり、子プロセスでないプロセスを
デバッグできないようにしています。Pwntools が自分で起動したプロセスについては
これを回避していますが、Pwntools の外でプロセスを起動し、PID を指定して
アタッチしようとすると (たとえば `gdb.attach(1234)`)、アタッチできないことがあります。

セキュリティ設定を無効にしてマシンを再起動すれば解決できます。

```sh
sudo tee /etc/sysctl.d/10-ptrace.conf <<EOF
kernel.yama.ptrace_scope = 0
EOF
```

<a id="argv0-and-argc0"></a>
## argv0 と argc==0

問題によっては、`argv[0]` を特定の値にして起動する必要があったり、
NULL (つまり `argc==0`) にする必要があったりします。

バージョン 4.13.0 以降、Pwntools は `argv[0]` を変更または省略した状態で、
gdb の下でバイナリを起動できます。`exe` パラメータで起動するバイナリを
指定すれば、`args` には何でも設定できます。

```py
>>> io = gdb.debug(args=[b'\xde\xad\xbe\xef'], gdbscript='continue', exe='/bin/sh')
>>> io.sendline(b'echo $0')
>>> hexdump(io.recvline())
00000000  de ad be ef  0a
    │····│·│
00000005
```

`args` をすべて省略して `argc==0` にすることもできますが、Linux カーネルは
[バージョン 5.18 以降、argv が空のプロセスを禁止している](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=dcd46d897adb70d63e025f175a00a89797d31a43)
ことに注意してください。これは[脆弱性への対応](https://lwn.net/Articles/882799/)として行われました。

```py
>>> io = gdb.debug([], stdin=PTY, gdbscript='continue', exe=sys.executable)
>>> io.sendlineafter(b'>>> ', b'import sys; print(sys.argv)')
>>> io.recvline()
b"[]\n"  # パッチ適用済みのカーネルでは b"['']\n" と表示される
```
