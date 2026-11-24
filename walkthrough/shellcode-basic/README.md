# シェルコード

ときどき、シェルコードを実行する必要が出てきます。

pwntools を使って Python で作業する方法に入る前に、コマンドラインツールを調べておく価値があります。作業がとても楽になるからです。

## `asm`

このコマンドラインツールは、名前のとおりのことをします。

```sh
$ asm nop
90
$ asm 'mov eax, 0xdeadbeef'
b8efbeadde
```

出力形式はいくつか選べます。デフォルトでは、標準出力がターミナルの場合は 16 進エンコードした出力を書き出します。パイプやファイルの場合は、代わりにバイナリデータをそのまま書き出します。

`phd` は pwntools に付属するコマンドで、`xxd` によく似ていますが、表示可能な ASCII 値、NULL バイト、その他いくつかの特殊な値を色分けして強調表示します。

```sh
$ asm nop -f hex
90
$ asm nop -f string
'\x90'
$ asm nop | phd
00000000  90                                                  │·│
00000001
```

適切なバージョンの `binutils` をインストールしていれば、異なるアーキテクチャやエンディアンも選べます。詳しくは[インストール](installation.md)のページを参照してください。

```sh
$ asm -c arm nop
00f020e3
$ asm -c powerpc nop
60000000
$ asm -c mips nop
00000000
```

Pwntools はほとんどの一般的な定数も認識し、コンテキストに応じて解決します。

```sh
$ asm 'push SYS_execve'
6a0b
$ asm -c amd64 'push SYS_execve'
6a3b
```

## `disasm`

Disasm は `asm` の対になるツールです。

```sh
$ asm 'push eax' | disasm
   0:   50                      push   eax
$ asm -c arm 'bx lr' | disasm -c arm
   0:   e12fff1e        bx      lr
```

## `shellcraft`

Shellcraft は、Pwntools に付属するシェルコードライブラリのコマンドラインインターフェースです。利用可能なシェルコードの一覧を得るには、`shellcraft` コマンドを単独で実行するだけです。

```sh
$ shellcraft
aarch64.linux.accept
aarch64.linux.access
aarch64.linux.acct
...
```

shellcraft のテンプレートの多くは、シェルコードを書きやすくするためのシステムコールのラッパーにすぎません。そのうちのいくつか、特に `sh`、`dupsh`、`echo` は、よく使うシェルコードのコンパクトな実装です。それぞれ `execve`、ファイルディスクリプタの `dup2`、`stdout` への文字列の書き込みを行います。

`asm` ツールと同様に、`shellcraft` にも複数の出力モードがあります。

```sh
$ shellcraft i386.linux.sh
6a68682f2f2f73682f62696e89e331c96a0b5899cd80
$ shellcraft i386.linux.sh -fasm
    /* push '/bin///sh\x00' */
    push 0x68
    push 0x732f2f2f
    push 0x6e69622f

    /* call execve('esp', 0, 0) */
    mov ebx, esp
    xor ecx, ecx
    push 0xb
    pop eax
    cdq /* Set edx to 0, eax is known to be positive */
    int 0x80
```

## シェルコードのデバッグ

シェルコードをデバッグしたくなったり、小さなスニペットを試したくなったりすることは必ずあります。Pwntools なら、これがとても簡単です。

### ELF ファイルの出力

1 つ目の方法は、シェルコードを含む ELF ファイルを出力し、それを手動で GDB に読み込むことです。

```sh
$ shellcraft i386.linux.sh -f elf > sh
$ asm 'mov eax, 1; int 0x80' -f elf > exit
$ chmod +x sh exit
$ strace ./exit
execve("./exit", ["./exit"], [/* 94 vars */]) = 0
_exit(0)                                = ?
$ echo 'echo Hello!' | strace -e execve ./sh
execve("./sh", ["./sh"], [/* 94 vars */]) = 0
execve("/bin///sh", [0], [/* 0 vars */]) = 0
Hello!
```

コマンドの中にはオプションを取るものもあり、すべてドキュメントが用意されているはずです。`shellcraft` は、認識できる定数も解決します。

```sh
$ shellcraft i386.linux.echo -?
Writes a string to a file descriptor

Arguments:
    string(str): Message to print
    sock: File descriptor.  Default is ebp.
$ shellcraft i386.linux.echo "Hello, world" STDOUT_FILENO
686f726c64686f2c20776848656c6c6a015b89e16a0c5a6a0458cd80
$ shellcraft i386.linux.mov eax SYS_execve -fasm
    push 0xb
    pop eax
$ shellcraft i386.linux.mov eax SYS_execve
6a0b58
```

### GDB の起動

ELF を出力して GDB を手動で起動する代わりに、そのまま GDB に入ることもできます。

```sh
$ shellcraft i386.linux.sh --debug
$ asm 'mov eax, 1; int 0x80;' --debug
```
