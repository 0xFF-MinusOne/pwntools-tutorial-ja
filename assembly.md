目次
=====

  * [アセンブリ](#assembly)
    * [基本的なアセンブリ](#basic-assembly)
    * [既製のアセンブリ (shellcraft)](#canned-assembly-shellcraft)
    * [コマンドラインツール](#command-line-tools)
      * [asm ](#asm)
      * [disasm ](#disasm)
      * [shellcraft ](#shellcraft)
    * [他のアーキテクチャ](#foreign-architectures)
      * [既製のアセンブリ](#canned-assembly)
      * [コマンドラインツール](#command-line-tools-1)

<a id="assembly"></a>
# アセンブリ (Assembly)

Pwntools を使うと、ほぼあらゆるアーキテクチャのアセンブルがとても簡単にできます。また、カスタマイズできる既製のシェルコードが、すぐ使える形で数多く付属しています。

[`walkthrough`](walkthrough) ディレクトリには、より長いシェルコードのチュートリアルがいくつかあります。このページでは基本を説明します。

<a id="basic-assembly"></a>
## 基本的なアセンブリ

最も基本的な例は、アセンブリをシェルコードに変換することです。

```py
from pwn import *

print repr(asm('xor edi, edi'))
# '1\xff'

print enhex(asm('xor edi, edi'))
# 31ff
```

<a id="canned-assembly-shellcraft"></a>
## 既製のアセンブリ (`shellcraft`)

`shellcraft` モジュールは、あらかじめ用意されたアセンブリを提供します。たいていはカスタマイズできます。どんな `shellcraft` テンプレートがあるかを調べるいちばん簡単な方法は、[RTD のドキュメント](https://pwntools.readthedocs.org/en/latest/shellcraft.html)を見ることです。

```py
from pwn import *
help(shellcraft.sh)
print '---'
print shellcraft.sh()
print '---'
print enhex(asm(shellcraft.sh()))
```
```
Help on function sh in module pwnlib.shellcraft.internal:

sh()
    Execute /bin/sh
---
    /* push '/bin///sh\x00' */
    push 0x68
    push 0x732f2f2f
    push 0x6e69622f

    /* call execve('esp', 0, 0) */
    push (SYS_execve) /* 0xb */
    pop eax
    mov ebx, esp
    xor ecx, ecx
    cdq /* edx=0 */
    int 0x80
---
6a68682f2f2f73682f62696e6a0b5889e331c999cd80
```

<a id="command-line-tools"></a>
## コマンドラインツール

アセンブリを扱うコマンドラインツールは 3 つあります。

- `asm`
- `disasm`
- `shellcraft`

### `asm`

asm ツールは名前のとおりの働きをします。出力の書式を指定するオプションがいくつかあります。出力先が端末のときは、既定で 16 進数にエンコードされます。

```
$ asm nop
90
```

出力先がそれ以外のときは、生のデータを書き出します。

```
$ asm nop | xxd
0000000: 90                                       .
```

コマンドラインで命令が指定されなかった場合は、標準入力からデータを受け取ります。

```
$ echo 'push ebx; pop edi' | asm
535f
```

最後に、`--format` オプションで出力形式を指定できます。指定できる引数は `raw`、`hex`、`string`、`elf` です。

```
$ asm --format=elf 'int3' > ./int3
$ ./halt
Trace/breakpoint trap (core dumped)
```

### `disasm`

Disasm は `asm` の逆の働きをします。

```
$ disasm cd80
   0:    cd 80                    int    0x80
$ asm nop | disasm
   0:    90                       nop
```

### `shellcraft`

`shellcraft` コマンドは、内部の `shellcraft` モジュールをコマンドラインから使うためのインターフェースです。コマンドラインでは、コンテキスト全体を `arch.os.template` の順で指定する必要があります。

```
$ shellcraft i386.linux.sh
6a68682f2f2f73682f62696e6a0b5889e331c999cd80
```

<a id="foreign-architectures"></a>
## 他のアーキテクチャ

他のアーキテクチャ向けにアセンブルするには、適切なバージョンの `binutils` がインストールされている必要があります。詳しくは [installing.md](installing.md) を見てください。必要な変更は、グローバルなコンテキスト変数にアーキテクチャを設定することだけです。`context` の詳細は [context.md](context.md) で確認できます。

```py
from pwn import *

context.arch = 'arm'

print repr(asm('mov r0, r1'))
# '\x01\x00\xa0\xe1'

print enhex(asm('mov r0, r1'))
# 0100a0e1
```

<a id="canned-assembly"></a>
### 既製のアセンブリ

`shellcraft` モジュールは、適切なアーキテクチャに自動で切り替わります。

```py
from pwn import *

context.arch = 'arm'

print shellcraft.sh()
print enhex(asm(shellcraft.sh()))
```
```
    adr r0, bin_sh
    mov r2, #0
    mov r1, r2
    svc SYS_execve
bin_sh: .asciz "/bin/sh"

08008fe20020a0e30210a0e10b0000ef2f62696e2f736800
```

<a id="command-line-tools-1"></a>
### コマンドラインツール

他のアーキテクチャのシェルコードも、コマンドラインの `--context` オプションを使ってアセンブルできます。

```
$ asm --context=arm 'mov r0, r1'
0100a0e1
$ shellcraft arm.linux.sh
08008fe20020a0e30210a0e10b0000ef2f62696e2f736800
```
