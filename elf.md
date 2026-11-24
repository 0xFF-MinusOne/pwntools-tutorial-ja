目次
=====

  * [ELF](#elfs)
    * [ELF ファイルの読み込み](#loading-elf-files)
    * [シンボルの利用](#using-symbols)
    * [ベースアドレスの変更](#changing-the-base-address)
    * [ELF ファイルの読み取り](#reading-elf-files)
    * [ELF ファイルへのパッチ当て](#patching-elf-files)
    * [ELF ファイルの検索](#searching-elf-files)
    * [ELF ファイルの作成](#building-elf-files)
    * [ELF ファイルの実行とデバッグ](#running-and-debugging-elf-files)

<a id="elfs"></a>
# ELF

Pwntools では、`ELF` クラスを通じて ELF ファイルを比較的簡単に扱えます。完全なドキュメントは [RTD](https://pwntools.readthedocs.org/en/latest/elf.html) にあります。

<a id="loading-elf-files"></a>
## ELF ファイルの読み込み

ELF ファイルはパスを指定して読み込みます。読み込むと、そのファイルのセキュリティに関わる属性がいくつか表示されます。

```py
from pwn import *

e = ELF('/bin/bash')
# [*] '/bin/bash'
#     Arch:     amd64-64-little
#     RELRO:    Partial RELRO
#     Stack:    Canary found
#     NX:       NX enabled
#     PIE:      No PIE
#     FORTIFY:  Enabled
```

<a id="using-symbols"></a>
## シンボルの利用

ELF ファイルでは、何種類かのシンボルの集まりが使えます。それぞれ `{name: data}` という辞書に入っています。

- `ELF.symbols` は、以下のものを含め、分かっているすべてのシンボルを列挙します。GOT エントリよりも PLT エントリが優先されます。
- `ELF.got` は GOT エントリだけを含みます
- `ELF.plt` は PLT エントリだけを含みます
- `ELF.functions` は関数だけを含みます (DWARF シンボルが必要です)

アドレスを直接書き込む必要がなくなるので、エクスプロイトを壊れにくく保つのにとても役立ちます。

```py
from pwn import *

e = ELF('/bin/bash')

print "%#x -> license" % e.symbols['bash_license']
print "%#x -> execve" % e.symbols['execve']
print "%#x -> got.execve" % e.got['execve']
print "%#x -> plt.execve" % e.plt['execve']
print "%#x -> list_all_jobs" % e.functions['list_all_jobs'].address
```

次のような内容が出力されます。

```
0x4ba738 -> license
0x41db60 -> execve
0x6f0318 -> got.execve
0x41db60 -> plt.execve
0x446420 -> list_all_jobs
```

<a id="changing-the-base-address"></a>
## ベースアドレスの変更

ELF ファイルのベースアドレスの変更 (たとえば ASLR に合わせた調整) は、とても簡単です。`bash` のベースアドレスを変えて、すべてのシンボルが変わる様子を見てみましょう。

```py
from pwn import *

e = ELF('/bin/bash')

print "%#x -> base address" % e.address
print "%#x -> entry point" % e.entry
print "%#x -> execve" % e.symbols['execve']

print "---"
e.address = 0x12340000

print "%#x -> base address" % e.address
print "%#x -> entry point" % e.entry
print "%#x -> execve" % e.symbols['execve']
```

次のような内容が出力されるはずです。

```
0x400000 -> base address
0x42020b -> entry point
0x41db60 -> execve
---
0x12340000 -> base address
0x1236020b -> entry point
0x1235db60 -> execve
```

<a id="reading-elf-files"></a>
## ELF ファイルの読み取り

ELF がメモリに読み込まれているかのように、`read`、`write`、そして `packing` モジュールと同じ名前の関数を使って直接やり取りできます。さらに、`disasm` メソッドで逆アセンブル結果も見られます。

```py
from pwn import *

e = ELF('/bin/bash')

print repr(e.read(e.address, 4))

p_license = e.symbols['bash_license']
license   = e.unpack(p_license)
print "%#x -> %#x" % (p_license, license)

print e.read(license, 14)
print e.disasm(e.symbols['main'], 12)
```

次のような内容が出力されます。

```
'\x7fELF'
0x4ba738 -> 0x4ba640
License GPLv3+
  41eab0:       41 57                   push   r15
  41eab2:       41 56                   push   r14
  41eab4:       41 55                   push   r13
```

<a id="patching-elf-files"></a>
## ELF ファイルへのパッチ当て

ELF ファイルへのパッチ当ても同じく簡単です。

```py
from pwn import *

e = ELF('/bin/bash')

# 'exit' コマンドでデバッグ用のブレークを発生させる
e.asm(e.symbols['exit_builtin'], 'int3')

# chdir を無効にして、代わりに内容を出力するだけにする
e.pack(e.got['chdir'], e.plt['puts'])

# ライセンスを変更する
p_license = e.symbols['bash_license']
license = e.unpack(p_license)
e.write(license, 'Hello, world!\n\x00')

e.save('./bash-modified')
```

これで、変更した bash を実行できます。

```
$ chmod +x ./bash-modified
$ ./bash-modified -c 'exit'
Trace/breakpoint trap (core dumped)
$ ./bash-modified --version | grep "Hello"
Hello, world!
$ ./bash-modified -c 'cd "No chdir for you!"'
/home/user/No chdir for you!
No chdir for you!
./bash-modified: line 0: cd: No chdir for you!: No such file or directory
```

<a id="searching-elf-files"></a>
## ELF ファイルの検索

ときどき、あるバイト列を見つけたいことがあります。最もよくある例は、`execve` の呼び出しのために `"/bin/sh\x00"` などを探すことです。
`search` メソッドはイテレータを返すので、最初の結果を使うことも、特別な条件が必要なら (たとえばアドレスに bad character を含まないものなど) 検索を続けることもできます。`search` に `writable` 引数を渡すと、書き込み可能なセグメント内のアドレスだけを返すようにできます。

```py
from pwn import *

e = ELF('/bin/bash')

for address in e.search('/bin/sh\x00'):
    print hex(address)
```

上の例は、次のような内容を出力します。

```
0x420b82
0x420c5e
```

<a id="building-elf-files"></a>
## ELF ファイルの作成

ELF ファイルは、ゼロから比較的簡単に作れます。これらの関数はすべてコンテキストを考慮します。関係する関数は `from_bytes` と `from_assembly` です。どちらも `ELF` オブジェクトを返し、それを簡単にファイルへ保存できます。

```
from pwn import *

ELF.from_bytes('\xcc').save('int3-1')
ELF.from_assembly('int3').save('int3-2')
ELF.from_assembly('nop', arch='powerpc').save('powerpc-nop')
```

<a id="running-and-debugging-elf-files"></a>
## ELF ファイルの実行とデバッグ

`ELF` オブジェクトがあれば、それを直接実行したりデバッグしたりできます。次の 2 つは同じ意味です。

```py
>>> io = elf.process()
# vs
>>> io = process(elf.path)
```

同様に、ELF にデバッガをアタッチした状態で簡単に起動できます。シェルコードをテストするとき、読み込んでデバッグするための C のラッパーが要らなくなるので、とても便利です。

```py
>>> io = elf.debug()
# vs
>>> io = gdb.debug(elf.path)
```