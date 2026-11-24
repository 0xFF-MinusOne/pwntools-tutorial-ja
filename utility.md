目次
=================

  * [ユーティリティ関数](#utility-functions)
    * [整数のパックとアンパック](#packing-and-unpacking-integers)
    * [ファイル入出力](#file-io)
    * [ハッシュとエンコード](#hashing-and-encoding)
        * [Base64](#base64)
        * [ハッシュ](#hashes)
        * [URL エンコード](#url-encoding)
        * [16 進エンコード](#hex-encoding)
        * [ビット操作と 16 進ダンプ](#bit-manipulation-and-hex-dumping)
        * [16 進ダンプ](#hex-dumping)
    * [パターン生成](#patten-generation)

<a id="utility-functions"></a>
# ユーティリティ関数

Pwntools の約半分はユーティリティ関数です。次のようなコードをあちこちにコピー&ペーストする必要はもうありません。

```py
import struct

def p(x):
    return struct.pack('I', x)
def u(x):
    return struct.unpack('I', x)[0]

1234 == u(p(1234))
```

代わりに、便利な小さなラッパーが手に入ります。さらに、他人のエクスプロイトコードを読むときも、少し読みやすく理解しやすくなります。

```py
from pwn import *

1234 == unpack(pack(1234))
```

<a id="packing-and-unpacking-integers"></a>
## 整数のパックとアンパック

これはおそらく最もよく行う操作なので、一番上に置いています。主要な `pack` 関数と `unpack` 関数は、[`context`](context.md) のグローバル設定(`endian`、`bits`、`sign` など)を認識します。

関数呼び出しで明示的に指定することもできます。

```py
pack(1)
# '\x01\x00\x00\x00'

pack(-1)
# '\xff\xff\xff\xff'

pack(2**32 - 1)
# '\xff\xff\xff\xff'

pack(1, endian='big')
# '\x00\x00\x00\x01'

p16(1)
# '\x01\x00'

hex(unpack('AAAA'))
# '0x41414141'

hex(u16('AA'))
# '0x4141'
```

<a id="file-io"></a>
## ファイル入出力

関数を 1 回呼び出すだけで、やりたいことができます。

```py
from pwn import *

write('filename', 'data')
read('filename')
# 'data'
read('filename', 1)
# 'd'
```

<a id="hashing-and-encoding"></a>
## ハッシュとエンコード

データを必要な形式に変換するための多くの関数に、すばやくアクセスできます。

<a id="base64"></a>
#### Base64

```py
'hello' == b64d(b64e('hello'))
```

<a id="hashes"></a>
#### ハッシュ

```py
md5sumhex('hello') == '5d41402abc4b2a76b9719d911017c592'
write('file', 'hello')
md5filehex('file') == '5d41402abc4b2a76b9719d911017c592'
sha1sumhex('hello') == 'aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d'
```

<a id="url-encoding"></a>
#### URL エンコード

```py
urlencode("Hello, World!") == '%48%65%6c%6c%6f%2c%20%57%6f%72%6c%64%21'
```

<a id="hex-encoding"></a>
#### 16 進エンコード

```py
enhex('hello')
# '68656c6c6f'
unhex('776f726c64')
# 'world'
```

<a id="bit-manipulation-and-hex-dumping"></a>
#### ビット操作と 16 進ダンプ

```py
bits(0b1000001) == bits('A')
# [0, 0, 0, 1, 0, 1, 0, 1]
unbits([0,1,0,1,0,1,0,1])
# 'U'
```

<a id="hex-dumping"></a>
#### 16 進ダンプ

```py
print hexdump(read('/dev/urandom', 32))
# 00000000  65 4c b6 62  da 4f 1d 1b  d8 44 a6 59  a3 e8 69 2c  │eL·b│·O··│·D·Y│··i,│
# 00000010  09 d8 1c f2  9b 4a 9e 94  14 2b 55 7c  4e a8 52 a5  │····│·J··│·+U|│N·R·│
# 00000020
```

<a id="patten-generation"></a>
## パターン生成

パターン生成(pattern generation)は、計算をしなくてもオフセットを見つけられる、とても便利な方法です。

単純なバッファオーバーフローがあるとして、パターンを生成し、それを対象のアプリケーションに渡したとしましょう。

```py
io = process(...)
io.send(cyclic(512))
```

コアダンプを見ると、クラッシュが 0x61616178 で起きていることがわかるかもしれません。クラッシュ時のフレームを分析しなくても、その数値を入力し直すだけでオフセットが得られます。

```py
cyclic_find(0x61616178)
# 92
```
