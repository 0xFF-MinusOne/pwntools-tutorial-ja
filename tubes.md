目次
=================

  * [Tubes](#tubes)
    * [基本的な入出力](#basic-io)
      * [データの受信](#receiving-data)
      * [データの送信](#sending-data)
      * [整数の扱い](#manipulating-integers)
    * [プロセスと基本機能](#processes-and-basic-features)
    * [対話セッション](#interactive-sessions)
    * [ネットワーク](#networking)
    * [Secure Shell](#secure-shell)
    * [シリアルポート](#serial-ports)

<a id="tubes"></a>
# Tubes

Tubes は、必要になるほとんどの種類の入出力に対する入出力ラッパー(I/O wrapper)です。

- ローカルプロセス
- リモートの TCP または UDP 接続
- SSH 経由でリモートサーバー上で動くプロセス
- シリアルポートの入出力

この入門では機能の例をいくつか紹介しますが、さらに複雑な組み合わせも可能です。正規表現によるマッチングや tubes どうしの接続の方法については、[完全なドキュメント][docs]を参照してください。

<a id="basic-io"></a>
## 基本的な入出力

入出力に対して一般的に必要になる基本的な関数は次のとおりです。

<a id="receiving-data"></a>
### データの受信

- `recv(n)` - 受信可能なバイト列を、任意の量だけ受信します
- `recvline()` - 改行が現れるまでデータを受信します
- `recvuntil(delim)` - 区切り文字が見つかるまでデータを受信します
- `recvregex(pattern)` - 正規表現パターンに一致するまでデータを受信します
- `recvrepeat(timeout)` - タイムアウトするまでデータを受信し続けます
- `clean()` - バッファに残っているデータをすべて破棄します

<a id="sending-data"></a>
### データの送信

- `send(data)` - データを送信します
- `sendline(line)` - データに改行を付けて送信します

<a id="manipulating-integers"></a>
### 整数の扱い

- `pack(int)` - ワードサイズにパックした整数を送信します
- `unpack()` - ワードサイズの整数を受信してアンパックします

<a id="processes-and-basic-features"></a>
## プロセスと基本機能

プロセスと通信する tube を作るには、`process` オブジェクトを作り、対象のバイナリの名前を渡すだけです。

```py
from pwn import *

io = process('sh')
io.sendline('echo Hello, world')
io.recvline()
# 'Hello, world\n'
```

コマンドライン引数を渡したり環境変数を設定したりする必要がある場合は、追加のオプションが使えます。詳しくは[完全なドキュメント][process]を参照してください。

```py
from pwn import *

io = process(['sh', '-c', 'echo $MYENV'], env={'MYENV': 'MYVAL'})
io.recvline()
# 'MYVAL\n'
```

バイナリデータの読み取りも問題ありません。`recv` で最大指定バイト数まで受信することも、`recvn` で正確なバイト数が揃うまでブロックすることもできます。

```py
from pwn import *

io = process(['sh', '-c', 'echo A; sleep 1; echo B; sleep 1; echo C; sleep 1; echo DDD'])

io.recv()
# 'A\n'

io.recvn(4)
# 'B\nC\n'

hex(io.unpack())
# 0xa444444
```

<a id="interactive-sessions"></a>
## 対話セッション

ゲームサーバーでシェルを取れましたか?やりましたね。対話的に使うのはとても簡単です。

```py
from pwn import *

# 自分は超 1337 で、シェルを取ったことにしましょう。
io = process('sh')

# <ここにエクスプロイトを書く>

io.interactive()
```


<a id="networking"></a>
## ネットワーク

ネットワーク接続の作成も簡単で、インターフェースはまったく同じです。`remote` オブジェクトはどこか別の場所に接続し、`listen` オブジェクトは接続を待ち受けます。

```py
from pwn import *

io = remote('google.com', 80)
io.send('GET /\r\n\r\n')
io.recvline()
# 'HTTP/1.0 200 OK\r\n'
```

プロトコルの情報を指定する必要がある場合も、かなり簡単です。

```py
from pwn import *

dns  = remote('8.8.8.8', 53, typ='udp')
tcp6 = remote('google.com', 80, fam='ipv6')
```

接続の待ち受けもそれほど複雑ではありません。これはちょうど 1 つの接続を待ち受け、その後は待ち受けを止めることに注意してください。

```py
from pwn import *

client = listen(8080).wait_for_connection()
```

<a id="secure-shell"></a>
## Secure Shell

SSH 接続も同様に簡単です。下のコードを、上の「Hello Process」のコードと比べてみてください。

SSH ではポートフォワーディングやファイルのアップロード/ダウンロードなど、さらに複雑なこともできます。詳しくは [SSH チュートリアル][ssh]を参照してください。

```py
from pwn import *

session = ssh('bandit0', 'bandit.labs.overthewire.org', 2220, password='bandit0')

io = session.process('/bin/sh', env={"PS1":""})
io.sendline('echo Hello, world!')
io.recvline()
# 'Hello, world!\n'
```


<a id="serial-ports"></a>
## シリアルポート

ローカルでハッキングする必要がある場合のために、シリアル tube もあります。いつもどおり、詳しい情報は[オンラインの完全なドキュメント][serial]にあります。

```py
from pwn import *

io = serialtube('/dev/ttyUSB0', baudrate=115200)
```

[docs]: https://pwntools.readthedocs.org/en/latest/tubes.html
[process]: https://pwntools.readthedocs.org/en/latest/tubes/processes.html
[ssh]: ssh.md
[remote]: https://pwntools.readthedocs.org/en/latest/tubes/sock.html
[serial]: https://pwntools.readthedocs.org/en/latest/tubes/serial.html
