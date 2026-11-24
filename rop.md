目次
=================

  * [背景](#background)
  * [ELF の読み込み](#loading-an-elf)
  	* [アドレスの修正](#fixing-addresses)
  * [ガジェットの確認](#inspecting-gadgets)
  * [すべてのガジェットを表示する](#viewing-all-gadgets)
  	* [本当に *すべて* のガジェットを表示する](#really-viewing-all-gadgets)
  * [生データの追加](#adding-raw-data)
  * [ROP スタックのダンプ](#dumping-rop-stacks)
  * [生のバイト列の取り出し](#extracting-raw-bytes)
  * [関数を魔法のように呼び出す](#calling-functions-manually)
  	* [名前で関数を呼び出す](#calling-functions-by-name)
  * [複数の ELF](#multiple-elfs)
  * [シェルの取得](#getting-a-shell)


<a id="background"></a>
# 背景

リターン指向プログラミング(Return-oriented programming, ROP)は、NX(no-execute。データ実行防止(Data Execution Prevention, DEP)とも呼ばれます)を回避するための手法です。

Pwntools には ROP を使ったエクスプロイトを簡単にする機能がいくつかありますが、i386 と amd64 アーキテクチャでのみ動作します。

<a id="loading-an-elf"></a>
# ELF の読み込み

`ROP` オブジェクトを作るには、`ELF` ファイルを渡すだけです。

```py
elf = ELF('/bin/sh')
rop = ROP(elf)
```

これでバイナリが自動的に読み込まれ、ほとんどの単純なガジェット(gadget)が抽出されます。たとえば、`rbx` レジスタに値を読み込みたい場合は次のようにします。

```py
rop.rbx
# Gadget(0x5fd5, ['pop rbx', 'ret'], ['rbx'], 0x8)
```

<a id="fixing-addresses"></a>
## アドレスの修正

ここでは、ガジェットのアドレス、その逆アセンブル結果、どのレジスタを読み込むか、そしてガジェットの実行時にスタックがどれだけ調整されるかを確認できます。

この例の `/bin/sh` は位置独立(position-independent)である(つまり ASLR が効く)ため、まず ELF オブジェクトのロードアドレスを調整できます。

```py
elf.address = 0xff000000
rop = ROP(elf)
rop.rbx
# Gadget(0xff005fd5, ['pop rbx', 'ret'], ['rbx'], 0x8)
```

<a id="inspecting-gadgets"></a>
# ガジェットの確認

マジックアクセサ(magic accessor)を通じて、好きなレジスタをどう読み込めばよいかを ROP オブジェクトに尋ねられます。上では `rbx` を使いましたが、ほかのレジスタも探せます。

```py
rop.rbx
# Gadget(0xff005fd5, ['pop rbx', 'ret'], ['rbx'], 0x8)
```

レジスタを読み込めない場合、戻り値は `None` です。この例では、たとえば `pop rcx; ret` というガジェットは存在しません。

```py
rop.rcx
# None
```

<a id="viewing-all-gadgets"></a>
## すべてのガジェットを表示する

Pwntools は、単純でないガジェットの大半を意図的に除外しています。ただし、`ROP.gadgets` プロパティを見れば、読み込まれたガジェットの一覧を確認できます。これはガジェットのアドレスをガジェット自体に対応付けたものです。

```py
rop.gadgets
# {4278225723: Gadget(0xff008b3b, ['add esp, 0x10', 'pop rbx', 'pop rbp', 'pop r12', 'ret'], ['rbx', 'rbp', 'r12'], 0x20),
#  4278278088: Gadget(0xff0157c8, ['add esp, 0x130', 'pop rbp', 'ret'], ['rbp'], 0x138),
#  4278284789: Gadget(0xff0171f5, ['add esp, 0x138', 'pop rbx', 'pop rbp', 'ret'], ['rbx', 'rbp'], 0x144),
#  4278272966: Gadget(0xff0143c6, ['add esp, 0x18', 'ret'], [], 0x1c),
#  4278239612: Gadget(0xff00c17c, ['add esp, 0x20', 'pop rbx', 'pop rbp', 'pop r12', 'ret'], ['rbx', 'rbp', 'r12'], 0x30),
#  4278259611: Gadget(0xff010f9b, ['add esp, 0x28', 'pop rbp', 'pop r12', 'ret'], ['rbp', 'r12'], 0x34),
# ...
#  4278216828: Gadget(0xff00687c, ['pop rsp', 'pop r13', 'ret'], ['rsp', 'r13'], 0xc),
#  4278214225: Gadget(0xff005e51, ['pop rsp', 'ret'], ['rsp'], 0x8),
#  4278210586: Gadget(0xff00501a, ['ret'], [], 0x4)}
```

<a id="really-viewing-all-gadgets"></a>
## 本当に *すべて* のガジェットを表示する

 Pwntools の ROP は単純でないガジェットを除外します。欲しいものが見つからない場合は、ROPGadget を使ってバイナリを調べることをお勧めします。

<a id="adding-raw-data"></a>
# 生データの追加

ROP スタックに生のデータを追加するには、`ROP.raw()` を呼び出すだけです。

```py
rop.raw(0xdeadbeef)
rop.raw(0xcafebabe)
rop.raw('asdf')
```

<a id="dumping-rop-stacks"></a>
# ROP スタックのダンプ

いくつかガジェットが揃ったので、ROP スタックの中身を見てみましょう。

```py
print(rop.dump())
# 0x0000:       0xdeadbeef
# 0x0004:       0xcafebabe
# 0x0008:          b'asdf' 'asdf'
```

<a id="extracting-raw-bytes"></a>
# 生のバイト列の取り出し

ROP スタックができたので、そこから生のバイト列を取り出したいところです。これには `bytes()` メソッドを使います。

```py
print(hexdump(bytes(rop)))
# 00000000  ef be ad de  be ba fe ca  61 73 64 66               │····│····│asdf│
# 0000000c
```

<a id="calling-functions-manually"></a>
# 関数を魔法のように呼び出す

Pwntools の ROP ツールの真価は、マジックアクセサまたは `ROP.call()` ルーチンを通じて任意の関数を呼び出せることです。

```py
elf = ELF('/bin/sh')
rop = ROP(elf)
rop.call(0xdeadbeef, [0, 1])
print(rop.dump())
# 0x0000:       0xdeadbeef 0xdeadbeef(0, 1, 2, 3)
# 0x0004:          b'baaa' <return address>
# 0x0008:              0x0 arg0
# 0x000c:              0x1 arg1
```

ここでは 32 ビットの ABI が使われていますが、これは正しくありません。64 ビットのバイナリに対しても ROP はできますが、それに合わせて `context.arch` を設定する必要があります。`context.binary` を使えば、これを自動的に行えます。

```py
context.binary = elf = ELF('/bin/sh')
rop = ROP(elf)
rop.call(0xdeadbeef, [0, 1])
print(rop.dump())
# 0x0000:           0x61aa pop rdi; ret
# 0x0008:              0x0 [arg0] rdi = 0
# 0x0010:           0x5f73 pop rsi; ret
# 0x0018:              0x1 [arg1] rsi = 1
# 0x0020:       0xdeadbeef
```

<a id="calling-functions-by-name"></a>
# 名前で関数を呼び出す

ライブラリの GOT/PLT に呼び出したい関数がある場合や、バイナリにシンボルがある場合は、関数名を直接指定して呼び出せます。

```py
context.binary = elf = ELF('/bin/sh')
rop = ROP(elf)
rop.execve(0xdeadbeef)
print(rop.dump())
# 0x0000:           0x61aa pop rdi; ret
# 0x0008:       0xdeadbeef [arg0] rdi = 3735928559
# 0x0010:           0x5824 execve
```

<a id="multiple-elfs"></a>
# 複数の ELF

通常、プロセスのアドレス空間には同時に複数の ELF が存在します。`/bin/sh` とその `libc` を使う例を見てみましょう。最初に `rop.rcx` を見たときは `None` でした。bash には `pop rcx; ret` というガジェットがないためです。しかし今回は、`libc` のガジェットもすべて使えます。

```py
context.binary = elf = ELF('/bin/sh')
libc = elf.libc

elf.address = 0xAA000000
libc.address = 0xBB000000

rop.rax
# Gadget(0xaa00eb87, ['pop rax', 'ret'], ['rax'], 0x10)
rop.rbx
# Gadget(0xaa005fd5, ['pop rbx', 'ret'], ['rbx'], 0x10)
rop.rcx
# Gadget(0xbb09f822, ['pop rcx', 'ret'], ['rcx'], 0x10)
rop.rdx
# Gadget(0xbb117960, ['pop rdx', 'add rsp, 0x38', 'ret'], ['rdx'], 0x48)
```

`rax` と `rbx` のガジェットはメインのバイナリ(0xAA...)にあり、後の 2 つは libc(0xBB...)にあることに注目してください。

では、もう少し複雑な呼び出しをしてみましょう。

```py
rop.memcpy(0xaaaaaaaa, 0xbbbbbbbb, 0xcccccccc)
print(rop.dump())
# 0x0000:       0xbb11c1e1 pop rdx; pop r12; ret
# 0x0008:       0xcccccccc [arg2] rdx = 3435973836
# 0x0010:      b'eaaafaaa' <pad r12>
# 0x0018:       0xaa0061aa pop rdi; ret
# 0x0020:       0xaaaaaaaa [arg0] rdi = 2863311530
# 0x0028:       0xaa005f73 pop rsi; ret
# 0x0030:       0xbbbbbbbb [arg1] rsi = 3149642683
# 0x0038:       0xaa0058a4 memcpy
```

Pwntools は `pop rdx; pop r12; ret` ガジェットを使い、スタックに必要な余分な値も考慮できていることに注意してください。また、各項目の記号的な値が `rop.dump()` に表示されている点にも注目してください。たとえば、rdx=3435973836 を設定していることがわかります。

<a id="getting-a-shell"></a>
# シェルの取得

シェルの取得は、意外と簡単な場合もあります。`execve` を直接呼び出し、メモリ内のどこかから `"/bin/sh\x00"` を見つけて第 1 引数として渡しましょう。

```py
context.binary = elf = ELF('/bin/sh')
libc = elf.libc

elf.address = 0xAA000000
libc.address = 0xBB000000

rop = ROP([elf, libc])

binsh = next(libc.search(b"/bin/sh\x00"))
rop.execve(binsh, 0, 0)
```

ROP スタックを表示します。

```py
print(rop.dump())
# 0x0000:       0xbb11c1e1 pop rdx; pop r12; ret
# 0x0008:              0x0 [arg2] rdx = 0
# 0x0010:      b'eaaafaaa' <pad r12>
# 0x0018:       0xaa0061aa pop rdi; ret
# 0x0020:       0xbb1b75aa [arg0] rdi = 3139138986
# 0x0028:       0xaa005f73 pop rsi; ret
# 0x0030:              0x0 [arg1] rsi = 0
# 0x0038:       0xaa005824 execve
```

ROP の生のバイト列を取り出します。

```py
print(hexdump(bytes(rop)))
# 00000000  e1 c1 11 bb  00 00 00 00  00 00 00 00  00 00 00 00  │····│····│····│····│
# 00000010  65 61 61 61  66 61 61 61  aa 61 00 aa  00 00 00 00  │eaaa│faaa│·a··│····│
# 00000020  aa 75 1b bb  00 00 00 00  73 5f 00 aa  00 00 00 00  │·u··│····│s_··│····│
# 00000030  00 00 00 00  00 00 00 00  24 58 00 aa  00 00 00 00  │····│····│$X··│····│
# 00000040
```
